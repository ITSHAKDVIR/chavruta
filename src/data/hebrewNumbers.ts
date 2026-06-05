const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];

/** Map of regular Hebrew letters to their final (sofit) forms. */
const SOFIT: Record<string, string> = {
  'כ': 'ך',
  'מ': 'ם',
  'נ': 'ן',
  'פ': 'ף',
  'צ': 'ץ',
};

/** Replace last char with its sofit form if applicable. */
function applySofit(s: string): string {
  if (!s) return s;
  const last = s.slice(-1);
  const sofit = SOFIT[last];
  return sofit ? s.slice(0, -1) + sofit : s;
}

export function hebrewNumeral(n: number): string {
  if (n <= 0) return String(n);
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    return hebrewNumeral(thousands) + "'" + (rest > 0 ? hebrewNumeral(rest) : '');
  }
  let result = '';
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  result += HUNDREDS[h];
  if (t === 1 && o === 5) result += 'טו';
  else if (t === 1 && o === 6) result += 'טז';
  else {
    result += TENS[t];
    result += ONES[o];
  }
  if (result.length >= 2) {
    // Insert gershayim before the LAST letter, then convert that last letter
    // to its sofit form (final letter) if it's one of כמנפצ.
    // E.g. 790 → 'תשצ' → 'תש' + '״' + sofit('צ') = 'תש״ץ'.
    const lastLetter = result.slice(-1);
    const head = result.slice(0, -1);
    result = head + '״' + (SOFIT[lastLetter] ?? lastLetter);
  } else if (result.length === 1) {
    // Single-letter numerals (ת', כ', ל', מ', נ', פ' for days/perek refs)
    // are written WITHOUT sofit by convention - 20th = כ', not ך'.
    result = result + '׳';
  }
  return result;
}

export function hebrewOrdinal(n: number): string {
  return hebrewNumeral(n);
}

const HEB_MONTHS_BIBLICAL = [
  '', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול',
  'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט',
];

export function formatGregorianHebrew(d: Date): string {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return `יום ${days[d.getDay()]}, ${d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export function hebrewTimeOfDay(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}`;
}

/**
 * Convert all Arabic digit sequences in a string to Hebrew numerals.
 * "כלים 5:9-10" → "כלים ה׳:ט׳-י׳"
 */
export function arabicToHebrewLetters(text: string): string {
  return text.replace(/\d+/g, (match) => {
    const n = parseInt(match, 10);
    if (isNaN(n) || n <= 0) return match;
    return hebrewNumeral(n);
  });
}

const ROMAN_TO_HEB: Record<string, string> = {
  I: 'א׳', II: 'ב׳', III: 'ג׳', IV: 'ד׳', V: 'ה׳',
  VI: 'ו׳', VII: 'ז׳', VIII: 'ח׳', IX: 'ט׳', X: 'י׳',
};

const ENGLISH_TO_HEB: Record<string, string> = {
  Book: 'ספר', Volume: 'כרך', Chapter: 'פרק', Section: 'חלק',
  'Hilchot Lashon Hara': 'הלכות לשון הרע',
  'Hilchot Rechilut': 'הלכות רכילות',
  'Lashon Hara': 'לשון הרע',
  Rechilut: 'רכילות',
};

/**
 * Full pipeline: convert Arabic digits + Roman numerals + common English terms to Hebrew.
 */
export function normalizeHebrewLabel(text: string): string {
  let out = text;
  // Translate English terms with Roman numerals: "Book II" → "ספר ב׳"
  for (const [en, he] of Object.entries(ENGLISH_TO_HEB)) {
    const re = new RegExp(`${en}\\s+(I{1,3}|IV|V|VI{0,3}|IX|X)\\b`, 'g');
    out = out.replace(re, (_m, roman) => `${he} ${ROMAN_TO_HEB[roman] ?? roman}`);
    // Also without Roman numeral
    out = out.replace(new RegExp(`\\b${en}\\b`, 'g'), he);
  }
  // Standalone Roman numerals at word boundaries
  out = out.replace(/\b(I{1,3}|IV|V|VI{0,3}|IX|X)\b/g, (m) => ROMAN_TO_HEB[m] ?? m);
  // Arabic digits → Hebrew letters
  out = arabicToHebrewLetters(out);
  return out;
}
