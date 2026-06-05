/**
 * Cosmetics kashrut checker — wraps the Kosharot.co.il `api-proxy.php`
 * endpoint that the website uses, and applies the same client-side
 * ingredient analysis we extracted into `data/cosmeticsIngredients.ts`.
 *
 * Pipeline:
 *   1. Send the photo (data URL) to api-proxy.php with the cosmetics prompt
 *   2. GPT-4o-mini returns a comma-separated list of ingredients in English
 *      (with PARTIAL / ROTATED / NOT_COSMETIC markers)
 *   3. Run each ingredient through 3 local lists and return a verdict
 */
import {
  PROBLEMATIC_ALWAYS,
  PROBLEMATIC_IF_NOT_VEGAN,
  REQUIRES_CHECK,
  SAFE_EXTRACTS,
  CosmeticIngredient,
} from '../data/cosmeticsIngredients';

const API_URL = 'https://www.kosharot.co.il/loadedFiles/api-proxy.php';

export type ExtractResult = {
  text: string;
  partial: boolean;
  rotated: boolean;
  isNotCosmetic: boolean;
};

const COSMETIC_PROMPT =
  'Check the image and respond according to these instructions:\n' +
  '1. If this is a product that is swallowed (food, drink, snacks, candy, dietary supplement, vitamins, pills) - write only: NOT_COSMETIC\n' +
  '2. If this is a product that is NOT swallowed (cosmetics, cream, ointment, lipstick, makeup, soap, shampoo, deodorant, perfume, topical medicine, toothpaste) - Extract the ingredients list. IMPORTANT: Translate Chinese/Arabic/Russian/Korean/Japanese to English. Keep only English and Hebrew as-is. List separated by commas. If text is rotated add ROTATED at start. If partial list add PARTIAL at start. If no ingredients write EMPTY.';

const FORCE_COSMETIC_PROMPT =
  'Extract the ingredients list from the image. IMPORTANT: You MUST translate ALL non-English ingredients to English. Chinese, Arabic, Russian, Korean, Japanese - translate to English. Only keep English and Hebrew as-is. List ingredients in one line separated by commas. If partial list write PARTIAL at start. If no ingredients write EMPTY. If text is rotated write ROTATED at start.';

/** Call the proxy and extract the ingredient text from a photo. */
export async function extractIngredients(
  base64Image: string,
  forceCosmetic = false,
): Promise<ExtractResult> {
  const promptText = forceCosmetic ? FORCE_COSMETIC_PROMPT : COSMETIC_PROMPT;
  const res = await fetch(`${API_URL}?t=${Date.now()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'image_url', image_url: { url: base64Image } },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });
  const data: any = await res.json();
  if (data?.error) throw new Error(data.error.message || 'API error');
  const content: string = data?.choices?.[0]?.message?.content ?? '';
  const lower = content.toLowerCase();
  if (
    !forceCosmetic &&
    (content === 'NOT_COSMETIC' ||
      lower.includes('not_cosmetic') ||
      lower.includes('food') ||
      lower.includes('מזון') ||
      lower.includes('תוסף תזונה') ||
      lower.includes('לבליעה'))
  ) {
    return { text: '', partial: false, rotated: false, isNotCosmetic: true };
  }
  const rotated = content.includes('ROTATED');
  const partial = content.includes('PARTIAL');
  const text = content.replace('ROTATED', '').replace('PARTIAL', '').trim();
  return { text, partial, rotated, isNotCosmetic: false };
}

export type IngredientFinding = {
  original: string;
  translation: CosmeticIngredient;
};

export type AnalysisResult = {
  problematic: IngredientFinding[];
  conditional: IngredientFinding[];
  requiresCheck: IngredientFinding[];
  rawIngredients: string[];
};

/** Apply the same matching rules the original site uses. */
function matchesWholeWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i');
  return regex.test(text);
}

const FLAVOR_LIKE = [
  'flavor', 'flavour', 'natural flavor', 'natural flavour',
  'artificial flavor', 'artificial flavour',
];

/**
 * Categorize each ingredient against the three lists.
 * `isVegan` = the user ticked the "vegan / plant-based" checkbox.
 */
export function analyzeIngredients(text: string, isVegan: boolean): AnalysisResult {
  const ingredients = text
    .toLowerCase()
    .replace(/[()]/g, '')
    .split(/[,\n\r]+/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  const problematic: IngredientFinding[] = [];
  const conditional: IngredientFinding[] = [];
  const requiresCheck: IngredientFinding[] = [];

  for (const ingredient of ingredients) {
    // 1. Always-problematic
    const paMatch = PROBLEMATIC_ALWAYS.find((item) => matchesWholeWord(ingredient, item.en));
    if (paMatch) {
      problematic.push({ original: ingredient, translation: paMatch });
      continue;
    }

    // 2. Undisclosed-composition (flavor / parfum etc.)
    const rcMatch = REQUIRES_CHECK.find((item) => {
      if (FLAVOR_LIKE.includes(item.en)) {
        return (
          ingredient === item.en ||
          ingredient.endsWith(' ' + item.en) ||
          ingredient.startsWith(item.en + ' ')
        );
      }
      return matchesWholeWord(ingredient, item.en);
    });
    if (rcMatch) {
      const isSafe = SAFE_EXTRACTS.some((safe) => ingredient.includes(safe));
      if (!isSafe) {
        requiresCheck.push({ original: ingredient, translation: rcMatch });
        continue;
      }
    }

    // 3. Problematic-if-not-vegan
    if (!isVegan) {
      const pnMatch = PROBLEMATIC_IF_NOT_VEGAN.find((item) => matchesWholeWord(ingredient, item.en));
      if (pnMatch) {
        conditional.push({ original: ingredient, translation: pnMatch });
      }
    }
  }

  return { problematic, conditional, requiresCheck, rawIngredients: ingredients };
}
