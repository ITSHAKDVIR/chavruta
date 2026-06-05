import { useEffect, useState } from 'react';
import { TOOLS, Tool, TOOLS_BY_ID } from '../data/tools';
import { getJSON, setJSON } from '../storage/storage';

const SEEN_KEY = '@yahadut/seen-tools-v1';
const ROTATION_KEY = '@yahadut/discovery-rotation-v1';
const DISMISS_KEY = '@yahadut/discovery-dismissed-v1';

/** Tools never to surface as "discover" (too obvious / always shown via shortcuts). */
const NEVER_SUGGEST = new Set([
  'tfilon', 'tehillim', 'zmanim', 'tfilot', 'halacha-yomit-kosharot',
]);

/** Categories never suggested here - the home page surfaces date-relevant moadim
 *  via the holiday-kit section already. This card is for EVERGREEN tools the
 *  user may not know about. */
const SKIP_CATEGORIES = new Set(['moadim']);

/** Evergreen tools rotated through - no holiday/seasonal stuff. */
const DISCOVERABLE: string[] = [
  'compass',
  'lavud-photo',
  'tefila-today',
  'tikkun-klali',
  'perekshira',
  'chiddushim',
  'tzadik',
  'gematria',
  'hebrew-birthday',
  'shiurim',
  'aveilus',
  'yahrtzeit',
  'maaser',
  'lashon-hara',
  'parent-call',
  'kvarim',
  'kosher-restaurants',
  'shul-times',
  'shul-halachot',
  'whatsapp-groups',
  'contacts-halacha',
  'hundred-brachot',
  'daily-quiz',
  'learning-plan',
  'books-learned',
  'maasrot-calc',
];

export function markToolSeen(id: string): Promise<void> {
  return (async () => {
    const seen = await getJSON<string[]>(SEEN_KEY, []);
    if (!seen.includes(id)) {
      await setJSON(SEEN_KEY, [...seen, id]);
    }
  })();
}

export function useToolDiscovery(now: Date, favorites: string[]): {
  suggestion: Tool | null;
  dismiss: () => Promise<void>;
  markUsed: (id: string) => Promise<void>;
} {
  const [suggestion, setSuggestion] = useState<Tool | null>(null);

  const compute = async () => {
    const dismissedToday = await getJSON<string | null>(DISMISS_KEY, null);
    const todayStr = now.toISOString().slice(0, 10);
    if (dismissedToday === todayStr) {
      setSuggestion(null);
      return;
    }

    const seen = await getJSON<string[]>(SEEN_KEY, []);
    const knownIds = new Set([...seen, ...favorites, ...Array.from(NEVER_SUGGEST)]);

    // Rotate through DISCOVERABLE evergreen tools, skipping known ones and any
    // moadim-category tools that may have slipped in.
    const rotIdx = await getJSON<number>(ROTATION_KEY, 0);
    const candidates = DISCOVERABLE.filter((id) => {
      const t = TOOLS_BY_ID[id];
      return t && !knownIds.has(id) && !SKIP_CATEGORIES.has(t.category);
    });
    if (candidates.length === 0) {
      setSuggestion(null);
      return;
    }
    const pick = candidates[rotIdx % candidates.length];
    await setJSON(ROTATION_KEY, rotIdx + 1);
    setSuggestion(TOOLS_BY_ID[pick]);
  };

  useEffect(() => {
    compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now.toDateString(), favorites.join(',')]);

  const dismiss = async () => {
    const todayStr = now.toISOString().slice(0, 10);
    await setJSON(DISMISS_KEY, todayStr);
    setSuggestion(null);
  };

  const markUsed = async (id: string) => {
    await markToolSeen(id);
    setSuggestion((s) => (s?.id === id ? null : s));
  };

  return { suggestion, dismiss, markUsed };
}
