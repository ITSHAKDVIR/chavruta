import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Linking, Modal, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { getString, Keys } from '../../src/storage/storage';
import { useSiddurPrefs, shouldHideForPrefs } from '../../src/storage/siddurPrefs';
import { useLocation } from '../../src/hooks/useLocation';
import { useEffectiveDate } from '../../src/hooks/useEffectiveDate';
import {
  getNodesAtPath,
  slugify,
  collectLeaves,
  collectLeavesFromList,
  getNusachTree,
  getHashkamatHaBokerNode,
  Nusach,
  NUSACH_LABEL,
  NUSACH_KEYS,
  FlatLeaf,
  SiddurNode,
} from '../../src/data/siddurTree';
import { augmentLeavesForToday } from '../../src/data/siddurAugment';
import { GabbaiCard } from '../../src/components/GabbaiCard';
import { isSectionRelevantToday } from '../../src/data/siddurRelevance';
import { getActiveMusafLink } from '../../src/data/musafLinks';
import { getActiveSelichotLink } from '../../src/data/selichotLink';
import {
  getActiveMegillahLink,
  getActiveHoshanotLink,
  getActiveKinnotLink,
  getTishaBAvTallitWarning,
} from '../../src/data/specialDayLinks';
import { fetchSefariaText } from '../../src/services/sefaria';
import { parseParagraphs, activeTags, shouldRender, enhanceConditionalText, stripInactiveInlineParens, hasNikud, splitMonolithicAmidah, stripMaarivBaruchHashemLeolam, stripLongTachanunSupplication, ParsedParagraph } from '../../src/services/siddurParser';
import { ANENU_TEXT } from '../../src/data/specialDayContent';
import { CholimReminder } from '../../src/components/CholimReminder';
import { getInsertsForDate, TefilaInsert } from '../../src/data/tefilaInserts';
import { computeZmanim, omerDay } from '../../src/data/hebcal';
import { getPrayerKind } from '../../src/data/prayerTimeWindows';
import { PrayerTimeBanner } from '../../src/components/PrayerTimeBanner';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

/** When viewing a node, if total descendant leaves ≤ this number, render running text.
 *  Otherwise, show navigation list (so user can drill down).
 *  Sized for a whole service (Ashkenaz Shacharit = ~106 leaves). */
const RUNNING_TEXT_MAX_LEAVES = 150;

/** Sefaria refs present in the index tree but with NO text (the API 404s).
 *  They would render a permanent "לא ניתן לטעון" error, so we drop them.
 *  - Weekday Minchah "Vidui and 13 Middot": the long Tachanun confession isn't
 *    said at weekday Mincha (only נפילת אפים), and Sefaria has no text for it. */
const KNOWN_EMPTY_REFS = new Set<string>([
  'Siddur Ashkenaz, Weekday, Minchah, Post Amidah, Vidui and 13 Middot',
  // "Prayers for Welfare of the People" (יהי רצון / אחינו) — Sefaria has no
  // text; the actual content loads from its sibling leaf. Showed a load error
  // on every Ashkenazi Torah-reading day (R"Ch, Mon/Thu, fasts).
  'Siddur Ashkenaz, Weekday, Shacharit, Torah Reading, Reading from Sefer, Prayers for Welfare of the People',
  // Shabbat Shacharit refs Sefaria 404s on (found by a full ref scan):
  //  - Holiness of God: the silent אתה קדוש is actually bundled in the sibling
  //    "Kedushah" leaf, so this empty duplicate is safe to drop.
  //  - Mizmor Letoda: not said on Shabbat (no text) — drop.
  //  - Mi Sheberach Bat Mitzvah: optional, no text — drop.
  'Siddur Ashkenaz, Shabbat, Shacharit, Amidah, Holiness of God',
  'Siddur Ashkenaz, Shabbat, Shacharit, Pesukei Dezimra, Mizmor Letoda',
  'Siddur Ashkenaz, Shabbat, Shacharit, Torah Reading, Reading from Sefer, Mi Sheberach, Bat Mitzvah',
]);

/**
 * Sefaria's "Song of the Day" leaf contains ALL 7 daily psalms with
 * Hebrew section markers like "בראשון בשבת:", "בשני בשבת:", etc. We keep
 * only the section that matches today's day-of-week, so the user sees
 * just their relevant psalm instead of all seven.
 */
/** Strip Hebrew nikud (vowel marks) for regex matching. Sefaria sometimes
 *  returns text with nikud (e.g. "בָּרְבִיעִי") and sometimes without; we
 *  normalize to bare consonants so a single regex matches either form. */
const NIKUD_RX = /[֑-ׇ]/g;

/** Headers preceding intro paragraphs. Sefaria uses "בראשון בשבת:" etc.
 *  We match the bare-consonant form (post nikud-strip). */
// Two Sefaria formats: Ashkenazi "בראשון בשבת:" (anchored) and Sephardi/EM
// "שיר של יום ראשון:" (each day's block opens with this — the per-day divider).
const DAY_OF_WEEK_MARKERS = [
  /^ב?ראשון\s+ב?שבת|שיר של יום ראשון/,  // Sunday
  /^ב?שני\s+ב?שבת|שיר של יום שני/,      // Monday
  /^ב?שלישי\s+ב?שבת|שיר של יום שלישי/,  // Tuesday
  /^ב?רביעי\s+ב?שבת|שיר של יום רביעי/,  // Wednesday
  /^ב?חמישי\s+ב?שבת|שיר של יום חמישי/,  // Thursday
  /^ב?שישי\s+ב?שבת|שיר של יום שישי/,    // Friday
  /^ב?שבת|^יום\s+השבת|שיר של יום שבת|שיר של יום שביעי/, // Shabbat
];

function filterDailyPsalmForToday(lines: string[], dow: number): string[] {
  // Map raw line index → which day's marker it starts with (or -1).
  // Strip HTML tags + nikud before matching (Sefaria sometimes returns
  // markers like "<small>בָּרִאשׁוֹן בַּשַּׁבָּת:</small>").
  const markerIdxs: { dow: number; idx: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const bare = lines[i].replace(/<[^>]+>/g, '').replace(NIKUD_RX, '').trim();
    for (let d = 0; d < DAY_OF_WEEK_MARKERS.length; d++) {
      if (DAY_OF_WEEK_MARKERS[d].test(bare)) {
        markerIdxs.push({ dow: d, idx: i });
        break;
      }
    }
  }
  if (markerIdxs.length === 0) return lines;
  // Keep intro lines (before the first marker), and today's section only.
  const myMarker = markerIdxs.find((m) => m.dow === dow);
  if (!myMarker) return lines; // unknown day; show everything
  const myIdxInList = markerIdxs.indexOf(myMarker);
  const nextMarker = markerIdxs[myIdxInList + 1];
  const introEnd = markerIdxs[0].idx;
  const sectionEnd = nextMarker ? nextMarker.idx : lines.length;
  return [...lines.slice(0, introEnd), ...lines.slice(myMarker.idx, sectionEnd)];
}

/**
 * Sefirat HaOmer leaves list ALL 49 day-counts. Keep only TONIGHT's count
 * (`omerCount`) plus the non-day lines (intro, bracha, closing tefilot), so
 * the reader isn't shown all 49. Each day line looks like "N. היום ... לעמר:".
 */
function filterOmerForToday(lines: string[], omerCount: number | null): string[] {
  if (!omerCount) return lines; // unknown / not in omer — leave as-is
  const bareOf = (l: string) => l.replace(/<[^>]+>/g, '').replace(NIKUD_RX, '');
  // A day-count line ends "...לעמר/בעמר" (Sefard la- / Ashkenaz ba-omer); the
  // count phrasing varies — "19. היום..." (Sefard/Ashkenaz, numbered) or
  // "תשעה עשר יום לעמר..." (Edot HaMizrach, no number, "היום" sits on the bracha
  // line). Match any omer line that isn't the bracha ("...ספירת העמר").
  const dayIdx = lines
    .map((l, i) => ({ i, b: bareOf(l) }))
    .filter(({ b }) => /[לב]ע[ֹו]?מר/.test(b) && !/ספירת/.test(b))
    .map(({ i }) => i);
  if (dayIdx.length === 0) return lines;
  // Pick the line whose explicit "N." equals the count; else the Nth in order.
  let keepIdx = -1;
  for (const i of dayIdx) {
    const m = bareOf(lines[i]).match(/(\d+)\.\s*היום/);
    if (m && parseInt(m[1], 10) === omerCount) { keepIdx = i; break; }
  }
  if (keepIdx < 0 && dayIdx.length >= omerCount) keepIdx = dayIdx[omerCount - 1];
  const drop = new Set(dayIdx.filter((i) => i !== keepIdx));
  return lines.filter((_, i) => !drop.has(i));
}

type LoadedLeaf = FlatLeaf & {
  paragraphs?: ParsedParagraph[];
  loading?: boolean;
  error?: boolean;
  /** Stable identity for state updates. One placeholder leaf can fan out into
   *  several virtual sub-leaves (monolithic Amidah split), so index-based
   *  updates aren't safe — we update by uid instead. */
  uid?: string;
};

/**
 * Curated list of the 5-11 MAIN sections per prayer. Each entry has:
 *   - label: Hebrew chip text
 *   - match: list of English/Hebrew substrings to find the right leaf
 *
 * When the user taps a chip we look up the first leaf whose trail OR section
 * name matches, and scroll to its ref. Anything not found is skipped.
 */
type CuratedSection = { label: string; match: string[]; exclude?: string[] };

const CURATED_TOC_BY_PRAYER: Record<string, CuratedSection[]> = {
  Shacharit: [
    { label: 'ברכות השחר',      match: ['Preparatory', 'Morning Blessings', 'ברכות השחר'] },
    { label: 'קרבנות',          match: ['Korbanot', 'קרבנות', 'Sacrifices'] },
    { label: 'פסוקי דזמרה',     match: ['Pesukei Dezimra', 'Pesukei DeZimra', 'פסוקי דזמרה'] },
    { label: 'ברכות קריאת שמע', match: ['Blessings of the Shema', 'Shema'] },
    { label: 'שמונה עשרה',      match: ['Amidah', 'Amida', 'שמונה עשרה', 'עמידה'] },
    { label: 'חזרת הש״ץ',       match: ['Repetition', 'Chazarat', 'חזרת'] },
    { label: 'הלל',             match: ['Half Hallel', 'Hallel for Rosh Chodesh', 'הלל לראש חודש', 'Berakhah before the Hallel'] },
    { label: 'תחנון',           match: ['Tachanun', 'תחנון'] },
    { label: 'קריאת התורה',     match: ['Torah Reading', 'קריאת התורה'] },
    // The standalone Ashrei (before Uva Letzion) — NOT the Ashrei buried
    // inside Pesukei Dezimra earlier in Shacharit.
    { label: 'אשרי',            match: ['Ashrei', 'אשרי'], exclude: ['Pesukei Dezimra', 'Pesukei DeZimra', 'פסוקי דזמרה'] },
    { label: 'מוסף',            match: ['Musaf Amidah for Rosh Chodesh', 'Musaf', 'מוסף לראש חודש', 'מוסף עמידה לראש חודש'] },
    { label: 'שיר של יום',      match: ['Song of the Day', 'שיר של יום', 'Daily Psalm'] },
    { label: 'ברכי נפשי',       match: ['Barchi Nafshi', 'ברכי נפשי', 'Psalm 104'] },
    { label: 'עלינו לשבח',      match: ['Aleinu', 'Alenu', 'עלינו'] },
  ],
  Minchah: [
    { label: 'אשרי',         match: ['Ashrei', 'אשרי'] },
    { label: 'קריאת התורה',  match: ['Torah Reading', 'קריאת התורה'] },
    { label: 'שמונה עשרה',   match: ['Amida', 'Amidah', 'שמונה עשרה'] },
    { label: 'חזרת הש״ץ',    match: ['Repetition', 'Chazarat', 'חזרת'] },
    { label: 'תחנון',        match: ['Tachanun', 'תחנון'] },
    { label: 'עלינו לשבח',   match: ['Aleinu', 'Alenu', 'עלינו'] },
  ],
  Mincha: [
    { label: 'אשרי',         match: ['Ashrei', 'אשרי'] },
    { label: 'קריאת התורה',  match: ['Torah Reading', 'קריאת התורה'] },
    { label: 'שמונה עשרה',   match: ['Amida', 'Amidah', 'שמונה עשרה'] },
    { label: 'חזרת הש״ץ',    match: ['Repetition', 'Chazarat', 'חזרת'] },
    { label: 'תחנון',        match: ['Tachanun', 'תחנון'] },
    { label: 'עלינו לשבח',   match: ['Aleinu', 'Alenu', 'עלינו'] },
  ],
  Maariv: [
    { label: 'והוא רחום',         match: ['Vehu Rachum', 'והוא רחום'] },
    { label: 'ברכו',              match: ['Barchu', 'ברכו'] },
    { label: 'ברכות קריאת שמע',   match: ['Blessings of the Shema'] },
    { label: 'שמונה עשרה',        match: ['Amidah', 'Amida', 'שמונה עשרה'] },
    { label: 'תוספות מוצש״ק',     match: ['Motza', 'Motzei', 'מוצאי'] },
    { label: 'ספירת העומר',       match: ['Sefirat', 'ספירת'] },
    { label: 'עלינו לשבח',         match: ['Aleinu', 'Alenu', 'עלינו'] },
    { label: 'קריאת שמע על המיטה', match: ['Bedtime', 'al Hamita', 'על המיטה'] },
  ],
  Arvit: [
    { label: 'והוא רחום',         match: ['Vehu Rachum', 'והוא רחום'] },
    { label: 'ברכו',              match: ['Barchu', 'ברכו'] },
    { label: 'ברכות קריאת שמע',   match: ['Blessings of the Shema'] },
    { label: 'שמונה עשרה',        match: ['Amidah', 'Amida', 'שמונה עשרה'] },
    { label: 'עלינו לשבח',         match: ['Aleinu', 'Alenu', 'עלינו'] },
  ],
};

/** Look up the curated section list for the current prayer's English name. */
function getCuratedList(hereEn: string): CuratedSection[] | null {
  const key = hereEn.replace(/^Weekday\s+/i, '').trim();
  // Direct match
  if (CURATED_TOC_BY_PRAYER[key]) return CURATED_TOC_BY_PRAYER[key];
  // Try fuzzy: contains
  const lower = key.toLowerCase();
  for (const k of Object.keys(CURATED_TOC_BY_PRAYER)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) {
      return CURATED_TOC_BY_PRAYER[k];
    }
  }
  return null;
}

/** Build a TOC from the curated list, dropping sections whose leaves aren't
 *  present in this nusach. Returns {label, ref} pairs ready to render. */
function buildCuratedTOC(hereEn: string, leaves: LoadedLeaf[]): { label: string; ref: string }[] {
  const list = getCuratedList(hereEn);
  if (!list) return [];
  const out: { label: string; ref: string }[] = [];
  for (const section of list) {
    // Find the first leaf whose trail OR section name matches any of the keys,
    // skipping any leaf whose haystack contains an `exclude` token (used to
    // disambiguate the standalone Ashrei from the Pesukei-Dezimra Ashrei).
    const match = leaves.find((l) => {
      const hay = [l.en, l.he, ...l.trail.flatMap((t) => [t.en, t.he])].join(' | ').toLowerCase();
      if (section.exclude?.some((x) => hay.includes(x.toLowerCase()))) return false;
      return section.match.some((m) => hay.includes(m.toLowerCase()));
    });
    if (match) out.push({ label: section.label, ref: match.ref });
  }
  return out;
}

export default function SiddurReader() {
  const router = useRouter();
  const { nusach: rawNusach, path: rawPath } = useLocalSearchParams<{ nusach?: string; path?: string }>();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const today = useEffectiveDate();

  const [storedNusach, setStoredNusach] = useState<Nusach>('ashkenazi');

  useEffect(() => {
    (async () => {
      const stored = await getString(Keys.nusach, 'ashkenazi');
      if ((NUSACH_KEYS as string[]).includes(stored)) {
        setStoredNusach(stored as Nusach);
      }
    })();
  }, []);

  const nusach: Nusach = (rawNusach && (NUSACH_KEYS as string[]).includes(rawNusach)
    ? (rawNusach as Nusach)
    : storedNusach);

  const slugs = useMemo(() => (rawPath ? rawPath.split('/').filter(Boolean) : []), [rawPath]);
  const { here, children, trail } = useMemo(() => getNodesAtPath(nusach, slugs), [nusach, slugs]);

  // Decide: navigation list or running text?
  const allLeavesUnderHere = useMemo(() => {
    if (here?.ref) {
      // Single-leaf top-level (Chabad Maariv, Shacharit, Mincha pack the whole
      // prayer into one Sefaria ref). Still run the augmenter so Purim Maariv
      // / fast day / ChH"M etc. additions can be appended even when there are
      // no sub-leaves to anchor against.
      const own: FlatLeaf[] = [{ ref: here.ref, he: here.he, en: here.en, trail: [] }];
      return augmentLeavesForToday(own, here, nusach, today, inIsrael);
    }
    if (here?.children) {
      let own = collectLeaves(here);
      // Sephardi / Edot HaMizrach: "Upon Arising" / "Preparatory Prayers" is
      // a separate top-level container in the data. When the user opens
      // Weekday Shacharit, prepend those wake-up leaves so the prayer reads
      // as one continuous flow (Modeh Ani → Birkot HaShachar → Shacharit).
      const isWeekdayShacharit =
        (nusach === 'sephardi' || nusach === 'edot-mizrach') &&
        /^Weekday Shacharit$/i.test(here.en);
      if (isWeekdayShacharit) {
        const hashkamat = getHashkamatHaBokerNode(nusach);
        if (hashkamat) {
          own = [...collectLeaves(hashkamat), ...own];
        }
      }
      // Today-specific augmentation: on Rosh Chodesh / Chol HaMoed / Chanukah /
      // Purim, inject the day's special leaves (Hallel, special Torah reading,
      // Mussaf, etc.) into the Shacharit flow so the user doesn't have to
      // navigate to a separate page for Musaf etc.
      return augmentLeavesForToday(own, here, nusach, today, inIsrael);
    }
    if (slugs.length === 0) return collectLeavesFromList(getNusachTree(nusach));
    return [];
  }, [here?.ref, here?.children, here?.en, nusach, slugs.length, inIsrael, today]);

  // Siddur prefs (minyan/yachid, optional sections, quiet mode). Loaded
  // before allLeavesFiltered so the filter has the latest value.
  const [prefs, setPrefs] = useSiddurPrefs();

  // Filter leaves by:
  //   1. User prefs (minyan, optional sections)
  //   2. Date relevance (ברכי נפשי only on ר"ח, לדוד only באלול-הוש"ר, etc.)
  //   3. SILENT AMIDAH ONLY — קדושה is hidden because the silent (תפילה ראשונה)
  //      doesn't include it. קדושה is rendered separately in the chazara collapse.
  // Match any trail node that names an Amidah variant — includes:
  //   "Amidah", "Amida", "עמידה", "שמונה עשרה"
  //   "Musaf Amidah for Rosh Chodesh", "מוסף עמידה לראש חודש"
  //   "Musaf Amidah", "Musaf LeShabbat → Amidah" subtrees, etc.
  // Importantly NOT "Post Amidah" (Tachanun/Vidui zone — those should not
  // appear in chazara collapse).
  const isAmidahLeaf = (l: { en: string; trail: { en: string; he: string }[] }) =>
    l.trail.some((t) => {
      const en = t.en.trim();
      const he = (t.he || '').trim();
      if (/^Post[\s-]?Amid/i.test(en)) return false; // exclude "Post Amidah"
      if (/^שלאחר[\s-]?עמידה/.test(he)) return false;
      return /\bAmid(ah|a)\b/i.test(en) || /עמידה|שמונה עשרה/.test(he);
    });
  // Distinguish a Musaf-Amidah leaf from a regular-Amidah leaf — used to render
  // separate chazara collapses (one per Amidah variant).
  const isMusafAmidahLeaf = (l: { en: string; trail: { en: string; he: string }[] }) =>
    l.trail.some((t) => /Musaf|מוסף/i.test(`${t.en} ${t.he}`));
  // The PUBLIC Kedushah (נקדש / קדוש קדוש קדוש) is said only in the chazara,
  // so it must be hidden from the silent Amidah. BUT the 3rd blessing itself —
  // "Holiness of God" / קדושת השם ("אתה קדוש ושמך קדוש... האל הקדוש") — is the
  // silent bracha and MUST be shown. Sefaria names the public sanctification
  // "Kedushah"/"Keduasha"/קדושה (hide it), and in RC Musaf nests a
  // "Kedushat HaShem" sub-leaf UNDER a "Kedushah" parent (hide via trail).
  // We must NOT match the standalone weekday "Holiness of God" leaf whose
  // Hebrew name is also קדושת השם — that one is the silent bracha.
  const isKedushahLeaf = (l: { en: string; he: string; trail: { en: string; he: string }[] }) => {
    if (/^(Kedushah|Kedusha|Keduasha)$/i.test(l.en)) return true;
    if (/^קדושה$/i.test(l.he)) return true;
    // "Kedushat HaShem" (Ashkenazi Musaf) BUNDLES the public Kedushah AND the
    // silent 3rd bracha (אתה קדוש) in one leaf, so it must NOT be hidden whole —
    // the parser tags only its public lines chazara-only. Don't treat it (or its
    // parent "Kedushah" container) as a hide-wholesale Kedushah leaf.
    if (/^Kedushat HaShem$/i.test(l.en)) return false;
    return l.trail.some((t) => /^Kedushah$/i.test(t.en) || /^קדושה$/.test(t.he));
  };
  // ברכת כהנים is said by the כהנים only during חזרת הש"ץ — never silently.
  const isBirkatKohanimLeaf = (l: { en: string; he: string }) =>
    /Birkat Kohanim|Priestly Blessing|ברכת כהנים/i.test(`${l.en} ${l.he}`);
  const isConcludingPassage = (l: { en: string; he: string }) =>
    /Concluding Passage|Elohai Netzor|Elokai Netzor|אל[הוו]?הי נצור|אלקי נצור|אלוהי נצור|חתימה/i.test(`${l.en} ${l.he}`);
  // Kedushah stays in allLeavesFiltered so the chazara collapse can render it,
  // but we SKIP it in the main (silent) leaves loop.
  const allLeavesFiltered = useMemo(
    () => allLeavesUnderHere.filter((l) => {
      if (KNOWN_EMPTY_REFS.has(l.ref)) return false;
      if (shouldHideForPrefs(l.en, prefs)) return false;
      if (l.trail.some((t) => shouldHideForPrefs(t.en, prefs))) return false;
      if (!isSectionRelevantToday(l.en, today, inIsrael, l.he)) return false;
      if (l.trail.some((t) => !isSectionRelevantToday(t.en, today, inIsrael, t.he))) return false;
      return true;
    }),
    [allLeavesUnderHere, prefs, inIsrael],
  );
  // Render any node with a reasonable leaf count as running text. The earlier
  // protection (force nav list at slugs.length===1) was for Ashkenazi's
  // "ימי חול" wrapper which bundled all 3 weekday prayers; we now flatten
  // that at the index level (getFlatTopItems) so every top-level entry is
  // ONE prayer. The leaf-count threshold alone is enough — and finally lets
  // Sephardi/Edot-Mizrach/Chabad render שחרית directly in running text too,
  // matching the experience the user wants.
  const hereIsLeaf = !!here?.ref;
  const isRunningText =
    allLeavesFiltered.length > 0 &&
    allLeavesFiltered.length <= RUNNING_TEXT_MAX_LEAVES;

  // Today is Mon/Thu? Used to surface the קריאת התורה link in the right place.
  const dayOfWeek = today.getDay();
  const isMonOrThu = dayOfWeek === 1 || dayOfWeek === 4;

  // Inserts for today
  const inserts = useMemo(() => getInsertsForDate(today, inIsrael), [today, inIsrael]);
  // Active condition tags for today (אומר היום בעשי"ת? בר"ח? etc.)
  const active = useMemo(() => activeTags(today, inIsrael), [today, inIsrael]);

  // Halachic-window banner: detect if user is reading Shacharit/Mincha/Maariv
  // and warn them if the time is wrong or the end is approaching.
  const prayerKind = useMemo(
    () => getPrayerKind(here?.en, trail),
    [here?.en, trail],
  );
  const zmanim = useMemo(
    () => (prayerKind ? computeZmanim(today, location) : null),
    [prayerKind, location],
  );

  // User toggles
  const [showAll, setShowAll] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  // Chazara collapse — one button per Elokai Netzor position. On a day with
  // both Shacharit and Musaf (RC / ChH"M), there are TWO Elokai Netzor leaves
  // (one ending the silent Shacharit, one ending the silent Musaf), so we
  // track open state per-anchor. Date-aware additions (יעלה ויבוא, ובספר חיים,
  // ותן טל ומטר, וכו') apply to both because they live in paragraph tags.
  const [chazaraOpenIdx, setChazaraOpenIdx] = useState<Set<number>>(new Set());

  // ===== Running text fetch =====
  const [leaves, setLeaves] = useState<LoadedLeaf[]>([]);

  useEffect(() => {
    if (!isRunningText) {
      setLeaves([]);
      return;
    }
    // Initialize with loading placeholders — use filtered list. Each gets a
    // stable uid so async updates survive the monolithic-Amidah split (which
    // replaces one placeholder with several virtual sub-leaves).
    setLeaves(allLeavesFiltered.map((l, idx) => ({ ...l, uid: `${idx}:${l.ref}`, loading: true })));

    // Is this the monolithic Amidah leaf used by Sefard / Edot HaMizrach /
    // Chabad (the whole Amidah in one Sefaria ref)? Ashkenaz never has a leaf
    // named exactly "Amidah" — its Amidah is already split into per-bracha
    // leaves — so this gate targets only the monolithic nuschach.
    const isMonolithicAmidah = (l: FlatLeaf) =>
      // "Amidah" / "Mussaf" / "Yom Tov Musaf Amidah" / "...Musaf..." — a word-
      // boundary match on Musaf catches the multi-word Musaf-Amidah leaf names
      // (Sefard YT, RC) the old anchored /^Muss?af$/ missed.
      /^(The\s+)?Amid(ah|a)$/i.test(l.en.trim()) || /\bMuss?af\b/i.test(l.en.trim()) ||
      // Chabad's RC Musaf is a single flat leaf named "Rosh Chodesh" (chatzi-
      // kaddish + a clean Musaf Amidah + full kaddish). Only Chabad has this as
      // a fetchable leaf; the other nuschaot's "Rosh Chodesh" are containers.
      // The splitter self-guards (returns [] below 6 sections) so this is safe.
      /^Rosh Chodesh$/i.test(l.en.trim()) ||
      /^(עמידה|תפילת עמידה|שמונה עשרה|ראש חודש)$/.test((l.he || '').trim()) ||
      /מוסף/.test((l.he || '').trim());

    // Progressive load: each leaf updates state the moment its text returns,
    // so the user sees the start of the prayer immediately instead of waiting
    // for the entire ~100-section fetch to complete.
    let cancelled = false;
    const todayDow = today.getDay();
    allLeavesFiltered.forEach((leaf, idx) => {
      const uid = `${idx}:${leaf.ref}`;
      (async () => {
        try {
          // Synthesized leaves with inline text (YH Maariv piyutim, etc.) — use
          // the embedded lines verbatim, no Sefaria fetch.
          if (leaf.inlineHe && leaf.inlineHe.length > 0) {
            const parsed = parseParagraphs(leaf.inlineHe);
            setLeaves((prev) =>
              prev.map((l) => (l.uid === uid ? { ...l, paragraphs: parsed, loading: false } : l)),
            );
            return;
          }
          const t = await fetchSefariaText(leaf.ref);
          if (cancelled) return;
          if (t && t.heText.length > 0) {
            let lines = t.heText;
            // שיר של יום: filter to TODAY's day section only.
            if (/Song of the Day|שיר של יום|Daily Psalm|Psalm of the Day/i.test(`${leaf.en} ${leaf.he}`)) {
              lines = filterDailyPsalmForToday(lines, todayDow);
            }
            // ספירת העומר: the leaf lists all 49 days — keep only tonight's count.
            // Counted at Maariv, so tonight's count is the NEXT day's omer day.
            if (/Sefirat HaOmer|Sefirat Ha'?Omer|ספירת הע[ומ]מר|Omer/i.test(`${leaf.en} ${leaf.he}`)) {
              const tonight = new Date(today);
              tonight.setDate(tonight.getDate() + 1);
              lines = filterOmerForToday(lines, omerDay(tonight));
            }
            // Weekday Maariv: drop ברוך ה' לעולם + יראו עינינו (not said per the
            // Eretz-Yisrael minhag). Gated to Maariv so the verses aren't
            // stripped if they appear elsewhere.
            const inMaariv = /Maariv|Arvit|מעריב|ערבית/i.test(
              `${leaf.en} ${leaf.he} ${leaf.trail.map((tr) => `${tr.en} ${tr.he}`).join(' ')}`,
            );
            if (inMaariv) lines = stripMaarivBaruchHashemLeolam(lines);
            // Monolithic Amidah → split into virtual per-bracha sub-leaves with
            // canonical Ashkenaz en names, so the silent/chazara/Kedushah logic
            // (all leaf-based) works for Sefard/EM/Chabad too. Falls back to a
            // single leaf if the text doesn't look like a headered Amidah.
            if (isMonolithicAmidah(leaf)) {
              const sections = splitMonolithicAmidah(lines);
              if (sections.length >= 6) {
                const amidahTrail = [...leaf.trail, { en: 'Amidah', he: 'עמידה' }];
                const subLeaves: LoadedLeaf[] = sections.map((s, k) => ({
                  uid: `${uid}#${k}`,
                  ref: `${leaf.ref}#${s.en}`,
                  en: s.en,
                  he: s.he,
                  trail: amidahTrail,
                  // amidah:true — promote whole-<small> vocalized bracha bodies
                  // (Sefard Yom Tov Musaf wraps every line in <small>) back to
                  // prayer; chazara-only liturgy stays hidden in the silent.
                  paragraphs: parseParagraphs(s.lines, { amidah: true }),
                  loading: false,
                }));
                // עננו — on a public fast the (Sephardi) individual says it within
                // the Amidah, in שומע תפילה. Inject it as a sub-section right after
                // "Response to Prayer" so it reads in its proper place rather than
                // as a floating card. Self-gates via the 'fast' tag. Skip if the
                // text already carries a full Anenu (the Mincha Amidah does, in
                // Geulah) — only Shacharit needs it injected.
                const hasNativeAnenu = sections.some((s) =>
                  s.lines.some((l) => /עננו\s+(יהוה|אבינו)\s+עננו/.test(l.replace(/[֑-ׇ]/g, ''))));
                if (active.has('fast') && !hasNativeAnenu) {
                  const rtpIdx = subLeaves.findIndex((l) => /^Response to Prayer$/i.test(l.en));
                  if (rtpIdx >= 0) {
                    subLeaves.splice(rtpIdx + 1, 0, {
                      uid: `${uid}#anenu`,
                      ref: `${leaf.ref}#Anenu`,
                      en: 'Anenu',
                      he: 'עננו (בתענית ציבור)',
                      trail: amidahTrail,
                      paragraphs: [{ body: ANENU_TEXT, kind: 'conditional', marker: 'בתענית ציבור — בשומע תפילה', tags: ['fast'] }],
                      loading: false,
                    });
                  }
                }
                setLeaves((prev) => prev.flatMap((l) => (l.uid === uid ? subLeaves : [l])));
                return;
              }
            }
            // Sefard "לשני וחמישי" Tachanun leaf — shown on every Tachanun day now
            // (relevance). On non-Mon/Thu, drop the Mon/Thu-only "והוא רחום"
            // supplication so only the daily "שומר ישראל…" conclusion + חצי קדיש
            // remain, and retitle the section accordingly (it's no longer the
            // Mon/Thu addition).
            let heOverride: string | null = null;
            if (/^לשני וחמישי$/.test((leaf.he || '').trim()) && todayDow !== 1 && todayDow !== 4) {
              lines = stripLongTachanunSupplication(lines);
              heOverride = 'שומר ישראל';
            }
            const parsed = parseParagraphs(lines);
            setLeaves((prev) =>
              prev.map((l) => (l.uid === uid ? { ...l, he: heOverride ?? l.he, paragraphs: parsed, loading: false } : l)),
            );
          } else {
            setLeaves((prev) =>
              prev.map((l) => (l.uid === uid ? { ...l, loading: false, error: true } : l)),
            );
          }
        } catch {
          if (cancelled) return;
          setLeaves((prev) =>
            prev.map((l) => (l.uid === uid ? { ...l, loading: false, error: true } : l)),
          );
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [isRunningText, allLeavesFiltered.map((l) => l.ref).join('|')]);

  // ===== Scroll-to-section for TOC =====
  const scrollRef = useRef<ScrollView>(null);
  // A non-collapsing wrapper around ALL ScrollView content. The section Views
  // live INSIDE a Card (not direct children of the ScrollView), so their
  // onLayout y is Card-relative — wrong for scrollTo. We measure each section
  // relative to THIS wrapper (an ancestor at scroll-origin) via findNodeHandle,
  // which works on the new architecture (Fabric). The old code measured against
  // ScrollView.getInnerViewNode() — an old-arch-only API that returns undefined
  // on Fabric, so the jump silently fell back to the wrong Card-relative y.
  const contentRef = useRef<View>(null);
  // A FIXED on-screen anchor wrapping the scroll viewport — its window Y stays
  // constant as content scrolls.
  const scrollOuterRef = useRef<View>(null);
  // Current scroll offset, tracked via onScroll.
  const currentScrollY = useRef(0);
  // Card-relative y from onLayout — kept as a coarse fallback.
  const sectionPositions = useRef<Record<string, number>>({});
  const leafViewRefs = useRef<Record<string, View | null>>({});

  // Jump to a section. measureLayout()/getInnerViewNode() are unreliable on the
  // new architecture (Fabric) — they silently no-op — so we use absolute window
  // coords from measure(): target = currentScroll + (sectionWindowY - viewportWindowY).
  function jumpTo(ref: string) {
    const scroll = scrollRef.current;
    const view = leafViewRefs.current[ref];
    const outer = scrollOuterRef.current;
    if (!scroll || !view) return;
    // Defer one frame so a just-closed nav modal is dismissed and layout is
    // settled before we measure window coords.
    requestAnimationFrame(() => {
      const finish = (outerY: number) =>
        view.measure((_x, _y, _w, _h, _vx, viewPageY) => {
          const target = currentScrollY.current + (viewPageY - outerY);
          scroll.scrollTo({ y: Math.max(0, target - 16), animated: true });
        });
      if (outer) outer.measure((_x, _y, _w, _h, _ox, outerPageY) => finish(outerPageY));
      else finish(0);
    });
  }

  function navigateTo(slug: string) {
    const newPath = [...slugs, slug].join('/');
    router.push(`/tfilon/read?nusach=${nusach}&path=${encodeURIComponent(newPath)}` as any);
  }

  function navigateBreadcrumb(idx: number) {
    if (idx === -1) {
      router.replace(`/tfilon/read?nusach=${nusach}` as any);
    } else {
      const newPath = slugs.slice(0, idx + 1).join('/');
      router.replace(`/tfilon/read?nusach=${nusach}&path=${encodeURIComponent(newPath)}` as any);
    }
  }

  const title = here ? here.he || here.en : `סידור ${NUSACH_LABEL[nusach]}`;
  const showTOC = isRunningText && leaves.length > 1;

  // Top-bar dropdown: list of curated sections for this prayer, jump to any.
  // Uses the same curated list as the in-page TOC chips.
  const [navOpen, setNavOpen] = useState(false);
  const curatedNavItems = useMemo(() => {
    if (!isRunningText || leaves.length === 0) return [];
    return buildCuratedTOC(here?.en || '', leaves);
  }, [here?.en, leaves]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        {curatedNavItems.length > 0 ? (
          <Pressable
            onPress={() => setNavOpen(true)}
            hitSlop={10}
            style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}
          >
            <Text style={[typography.bodyBold, { color: colors.primary }]}>📑 ניווט</Text>
            <Text style={{ color: colors.primary, fontSize: 12 }}>▾</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Top-bar navigation modal — quick jump between prayer sections. */}
      <Modal visible={navOpen} animationType="fade" transparent onRequestClose={() => setNavOpen(false)}>
        <Pressable style={styles.navBackdrop} onPress={() => setNavOpen(false)}>
          <Pressable style={styles.navSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md }]}>
              ניווט בתפילה
            </Text>
            <ScrollView style={{ maxHeight: 500 }}>
              {curatedNavItems.map((c) => (
                <Pressable
                  key={c.ref}
                  onPress={() => { jumpTo(c.ref); setNavOpen(false); }}
                  style={styles.navItem}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>‹</Text>
                  <Text style={[typography.h3, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <View ref={scrollOuterRef} collapsable={false} style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        onScroll={(e) => { currentScrollY.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        <View ref={contentRef} collapsable={false}>
        <ScreenHeader title={title} />
        {/* Nusach indicator — tap to jump to settings and change it. */}
        <Pressable
          onPress={() => router.push('/more' as any)}
          hitSlop={10}
          style={{ paddingHorizontal: spacing.lg, marginTop: -spacing.sm, marginBottom: spacing.sm, alignSelf: 'flex-end' }}
        >
          <Text style={[typography.small, { color: colors.primary }]}>
            סידור {NUSACH_LABEL[nusach]} · לחץ לשינוי
          </Text>
        </Pressable>

        {/* Breadcrumb */}
        {trail.length > 0 && (
          <View style={styles.breadcrumb}>
            <Pressable onPress={() => navigateBreadcrumb(-1)} hitSlop={6}>
              <Text style={[typography.small, { color: colors.primary }]}>בית הסידור</Text>
            </Pressable>
            {trail.map((t, i) => (
              <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                <Text style={[typography.small, { color: colors.textMuted }]}>›</Text>
                <Pressable onPress={() => navigateBreadcrumb(i)} hitSlop={6}>
                  <Text
                    style={[
                      typography.small,
                      {
                        color: i === trail.length - 1 ? colors.textPrimary : colors.primary,
                        fontWeight: i === trail.length - 1 ? '700' : '400',
                      },
                    ]}
                  >
                    {t.he || t.en}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.sm }}>
          {/* Prayer-time warning banner: shows if reading Shacharit/Mincha/Maariv
              outside its halachic window, or near its end. */}
          {prayerKind && zmanim && (
            <PrayerTimeBanner kind={prayerKind} zmanim={zmanim} />
          )}


          {/* Tefila inserts banner — glass, not gold-filled (per user feedback).
              Only on Shacharit/Mincha/Maariv (prayerKind set) — NOT on Birkat
              Hamazon, Brachot, etc. which don't have יעלה ויבוא / על הניסים. */}
          {isRunningText && prayerKind && inserts.length > 0 && (
            <Card variant="default" onPress={() => router.push('/tools/tefila-today' as any)}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.md }}>
                <Text style={{ fontSize: 24 }}>📿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.primary }]}>תוספות לתפילה היום</Text>
                  <Text style={[typography.small, { color: colors.textPrimary, marginTop: 2 }]}>
                    {inserts.map((i) => i.title).join(' · ')}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                    הטקסט מ-Sefaria הוא טקסט בסיסי וסטטי. לחץ כאן לרשימה מלאה.
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 18 }}>‹</Text>
              </View>
            </Card>
          )}

          {/* Musaf shortcut — surfaced on Rosh Chodesh / Chol HaMoed weekdays
              when the user is viewing Shacharit. Tapping navigates to the
              appropriate Musaf section for the current nusach. */}
          {/* Selichot button at top of Shacharit on Elul / AYT / fast days. */}
          {isRunningText && /Shacharit|שחרית/i.test(`${here?.en || ''} ${here?.he || ''}`) && (() => {
            const sel = getActiveSelichotLink(today, inIsrael, nusach);
            if (!sel) return null;
            return (
              <Card
                variant="accent"
                onPress={() => router.push(sel.path as any)}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ fontSize: 26 }}>📜</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>{sel.label}</Text>
                    <Text style={[typography.small, { color: colors.textPrimary, marginTop: 2 }]}>
                      היום נהוג לומר סליחות לפני שחרית. לחץ למעבר.
                    </Text>
                  </View>
                  <Text style={{ color: colors.primaryDark, fontSize: 18 }}>‹</Text>
                </View>
              </Card>
            );
          })()}

          {isRunningText && /Shacharit|שחרית/i.test(`${here?.en || ''} ${here?.he || ''}`) && (() => {
            const musaf = getActiveMusafLink(today, inIsrael, nusach);
            if (!musaf) return null;
            return (
              <Card
                variant="accent"
                onPress={() => router.push(`/tfilon/read?nusach=${nusach}&path=${encodeURIComponent(musaf.path)}` as any)}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ fontSize: 26 }}>🕊️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>{musaf.label}</Text>
                    <Text style={[typography.small, { color: colors.textPrimary, marginTop: 2 }]}>
                      היום מתפללים מוסף נוסף על תפילת שחרית. לחץ למעבר ישיר.
                    </Text>
                  </View>
                  <Text style={{ color: colors.primaryDark, fontSize: 18 }}>‹</Text>
                </View>
              </Card>
            );
          })()}

          {/* Day-specific link banners — Megillah on Purim, Hoshanot on
              Sukkot ChH"M, Kinnot on T"B, Tallit warning on T"B. */}
          {isRunningText && (() => {
            const isShacharit = /Shacharit|שחרית/i.test(`${here?.en || ''} ${here?.he || ''}`);
            const isMaariv = /Maariv|Arvit|ערבית|מעריב/i.test(`${here?.en || ''} ${here?.he || ''}`);
            const cards: { label: string; description: string; path: string; icon: string; key: string }[] = [];
            if (isShacharit || isMaariv) {
              const meg = getActiveMegillahLink(today, inIsrael);
              if (meg) cards.push({ ...meg, key: 'meg' });
            }
            if (isShacharit) {
              const hosh = getActiveHoshanotLink(today, inIsrael);
              if (hosh) cards.push({ ...hosh, key: 'hosh' });
              const kin = getActiveKinnotLink(today, inIsrael);
              if (kin) cards.push({ ...kin, key: 'kin' });
              const tall = getTishaBAvTallitWarning(today, nusach);
              if (tall) cards.push({ ...tall, key: 'tall' });
            }
            return cards.map((c) => (
              <Card key={c.key} variant="accent" onPress={() => router.push(c.path as any)}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ fontSize: 26 }}>{c.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>{c.label}</Text>
                    <Text style={[typography.small, { color: colors.textPrimary, marginTop: 2 }]}>
                      {c.description}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primaryDark, fontSize: 18 }}>‹</Text>
                </View>
              </Card>
            ));
          })()}

          {/* Cholim reminder — shown on any Shemoneh-Esreh / Amidah view so
              the user remembers to mention their cholim list at "רפאנו". */}
          {(here?.en || trail.some((t) => /Amid|Shacharit|Mincha|Maariv|Arvit/i.test(t.en))) &&
            /Amid|Shacharit|Mincha|Maariv|Arvit/i.test(here?.en || trail.map((t) => t.en).join(' ')) && (
              <CholimReminder />
          )}

          {/* TOC — curated list of MAIN sections per prayer instead of all
              106 leaves. Each chip jumps to the first leaf in that section. */}
          {showTOC && (() => {
            const curated = buildCuratedTOC(here?.en || '', leaves);
            if (curated.length === 0) return null;
            return (
              <Card>
                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  📑 קפיצה מהירה
                </Text>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
                  {curated.map((c) => (
                    <Pressable key={c.ref} onPress={() => jumpTo(c.ref)} style={styles.tocChip}>
                      <Text style={[typography.caption, { color: colors.primaryDark }]}>{c.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
            );
          })()}

          {/* Navigation list mode - filtered by today relevance */}
          {!isRunningText && children.length > 0 && (() => {
            const visible = children.filter((c) => isSectionRelevantToday(c.en, today, inIsrael));
            const hidden = children.length - visible.length;
            const list = showAll ? children : visible;
            return (
              <>
                {hidden > 0 && (
                  <Pressable onPress={() => setShowAll(!showAll)}>
                    <Text style={[typography.small, { color: colors.primary, textAlign: 'center', marginVertical: spacing.xs }]}>
                      {showAll ? '◀ הסתר לא רלוונטי' : `הצג גם חלקים לא רלוונטיים להיום (+${hidden}) ▶`}
                    </Text>
                  </Pressable>
                )}
                {list.map((c, i) => {
                  const relevant = isSectionRelevantToday(c.en, today, inIsrael);
                  return (
                    <Card key={`${c.en}-${i}`} onPress={() => navigateTo(slugify(c.en))}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, opacity: relevant ? 1 : 0.55 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.h3, { color: colors.textPrimary }]}>{c.he || c.en}</Text>
                          {!relevant && (
                            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                              לא רלוונטי היום
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
                      </View>
                    </Card>
                  );
                })}
              </>
            );
          })()}

          {!isRunningText && children.length === 0 && allLeavesUnderHere.length === 0 && (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>
                אין כאן קטעים זמינים בנוסח זה.
              </Text>
            </Card>
          )}

          {/* Quiet-mode (DND) toggle removed — the underlying Android permission
              flow opened system "App Info" settings, which users mistook for the
              back button being broken. The feature added more confusion than
              value, so it was removed per user request. */}

          {/* Siddur preferences sheet — minyan, optional sections.
              Only relevant for tefila in minyan (Shacharit/Mincha/Maariv) —
              never for ברכת המזון, ברכות הראייה, וכו'. */}
          {isRunningText && prayerKind && (
            <Card>
              <Pressable onPress={() => setPrefsOpen((v) => !v)} hitSlop={4} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ fontSize: 18 }}>⚙</Text>
                <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>
                  הגדרות תפילה {prefs.withMinyan ? '· במניין' : '· יחיד'}
                </Text>
                <Text style={[typography.small, { color: colors.primary }]}>
                  {prefsOpen ? '◀ סגור' : 'פתח ▼'}
                </Text>
              </Pressable>
              {prefsOpen ? (
                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  <PrefToggle
                    label="במניין"
                    when="קדושה, מודים דרבנן, חזרת הש״ץ, קדיש"
                    value={prefs.withMinyan}
                    onChange={(v) => setPrefs({ ...prefs, withMinyan: v })}
                  />
                  <PrefToggle
                    label="ברכת כהנים"
                    when="במניין (חו״ל: יו״ט; א״י: כל יום במזרחי)"
                    value={prefs.includeBirkatKohanim}
                    onChange={(v) => setPrefs({ ...prefs, includeBirkatKohanim: v })}
                  />
                  <PrefToggle
                    label="הוצאת ספר תורה"
                    when="ב׳, ה׳, ר״ח, חגים, תעניות"
                    value={prefs.includeTorahService}
                    onChange={(v) => setPrefs({ ...prefs, includeTorahService: v })}
                  />
                  <PrefToggle
                    label="קישור לקריאת התורה בב׳/ה׳"
                    when="3 עליות מהפרשה הקרובה (לתצוגה גם בימים אחרים)"
                    value={prefs.includeMondayThursdayLeyning}
                    onChange={(v) => setPrefs({ ...prefs, includeMondayThursdayLeyning: v })}
                  />
                  <PrefToggle
                    label="ברכי נפשי"
                    when="ראש חודש"
                    value={prefs.includeBarchiNafshi}
                    onChange={(v) => setPrefs({ ...prefs, includeBarchiNafshi: v })}
                  />
                  <PrefToggle
                    label="לדוד ה׳ אורי וישעי"
                    when="מאלול עד הושענא רבה"
                    value={prefs.includeLeDavidHashemOri}
                    onChange={(v) => setPrefs({ ...prefs, includeLeDavidHashemOri: v })}
                  />
                  <PrefToggle
                    label="הלל"
                    when="ר״ח, חנוכה, חוה״מ סוכות + פסח, יו״ט"
                    value={prefs.includeHallel}
                    onChange={(v) => setPrefs({ ...prefs, includeHallel: v })}
                  />
                  <PrefToggle
                    label="אבינו מלכנו"
                    when="עשרת ימי תשובה + תעניות ציבור"
                    value={prefs.includeAvinuMalkenu}
                    onChange={(v) => setPrefs({ ...prefs, includeAvinuMalkenu: v })}
                  />
                  <PrefToggle
                    label="תפילה לשלום המדינה"
                    when="שבת + יו״ט (מנהג רוב בתי הכנסת בא״י)"
                    value={prefs.includeTefilaLaMedina}
                    onChange={(v) => setPrefs({ ...prefs, includeTefilaLaMedina: v })}
                  />
                  <PrefToggle
                    label="תפילה לשלום החיילים"
                    when="שבת + יו״ט"
                    value={prefs.includeTefilaLaTzva}
                    onChange={(v) => setPrefs({ ...prefs, includeTefilaLaTzva: v })}
                  />
                  <PrefToggle
                    label="מי שבירך לחולים"
                    when="בקריאת התורה — אופציונלי"
                    value={prefs.includeMishBeirachCholim}
                    onChange={(v) => setPrefs({ ...prefs, includeMishBeirachCholim: v })}
                  />
                </View>
              ) : null}
            </Card>
          )}

          {/* Display toggles */}
          {isRunningText && (
            <Card>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm }}>
                <Pressable
                  onPress={() => setShowAll(!showAll)}
                  style={[styles.toggleChip, showAll && styles.toggleChipActive]}
                  hitSlop={6}
                >
                  <Text style={[typography.caption, { color: showAll ? colors.textInverse : colors.textPrimary }]}>
                    {showAll ? '✓ ' : ''}הצג את כל התוספות (כולל לא רלוונטיות)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowNotes(!showNotes)}
                  style={[styles.toggleChip, showNotes && styles.toggleChipActive]}
                  hitSlop={6}
                >
                  <Text style={[typography.caption, { color: showNotes ? colors.textInverse : colors.textPrimary }]}>
                    {showNotes ? '✓ ' : ''}הצג הערות הלכתיות
                  </Text>
                </Pressable>
              </View>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
                ברירת המחדל: רק הקטעים המתאימים להיום מוצגים.
              </Text>
            </Card>
          )}

          {/* Running text mode */}
          {isRunningText && (() => {
            // אלקי נצור marks the END of each silent עמידה. After EACH one we
            // render a chazara collapse — one for regular Amidah, one for Musaf
            // on RC / ChH"M days. Each collapse renders ONLY the leaves of its
            // own Amidah variant (distinguished by whether trail mentions Musaf).
            //
            // Maariv has NO chazaras hashatz (chazara only in Shacharit/Mincha) —
            // suppress the collapse for any Elokai Netzor whose trail names Maariv.
            const isElohaiNetzor = (l: LoadedLeaf) =>
              /Elohai Netzor|Elokai Netzor|אל[הוו]?הי נצור|אלקי נצור|אלוהי נצור/i.test(`${l.en} ${l.he}`);
            const isMaarivLeaf = (l: LoadedLeaf) =>
              l.trail.some((t) => /Maariv|Arvit|ערבית|מעריב/i.test(`${t.en} ${t.he}`));
            const elokaiNetzorIdxs: number[] = [];
            if (prefs.withMinyan) {
              for (let i = 0; i < leaves.length; i++) {
                if (isElohaiNetzor(leaves[i]) && !isMaarivLeaf(leaves[i])) {
                  elokaiNetzorIdxs.push(i);
                }
              }
            }

            // קריאת התורה לב'/ה' link — anchored after הוצאת ספר תורה (or
            // the more general Torah Reading container). The Sefaria siddur tree
            // already provides the actual leyning text; we just add a quick
            // jump to the dedicated screen for the special Mon/Thu reading.
            const trailText = (l: LoadedLeaf) =>
              `${l.en} ${l.he} ${l.trail.map((t) => `${t.en} ${t.he}`).join(' ')}`;
            const findLastIdx = (re: RegExp) => {
              for (let i = leaves.length - 1; i >= 0; i--) {
                if (re.test(trailText(leaves[i]))) return i;
              }
              return -1;
            };
            // NOTE: findLastIdx returns -1 when not found, and -1 is TRUTHY in JS,
            // so `findLastIdx(A) || findLastIdx(B)` would never fall through to B.
            // Sefard/EM/Chabad have no separate "הוצאת ספר תורה" leaf (the whole
            // service is one "קריאת התורה" leaf), so the fallback MUST run for them
            // — use an explicit >= 0 check, not `||`.
            const hotzaaIdx = findLastIdx(/Removing the Torah from Ark|הוצאת ספר תורה/i);
            const torahAnchorIdx = hotzaaIdx >= 0
              ? hotzaaIdx
              : findLastIdx(/Torah Reading|קריאת התורה/i);
            return (
            <Card padding="xl">
              {leaves.map((leaf, idx) => {
                // Skip Kedushah + Birkat Kohanim in silent עמידה (chazara-only).
                // EXCEPTION: a Kedushah leaf that BUNDLES the silent 3rd bracha
                // (אתה קדוש) — Shabbat Shacharit, Musaf — must NOT be hidden whole;
                // the parser tags its public lines chazara-only, so render it and
                // the silent shows only אתה קדוש.
                if (isAmidahLeaf(leaf) && isBirkatKohanimLeaf(leaf)) return null;
                if (isAmidahLeaf(leaf) && isKedushahLeaf(leaf)) {
                  const bundlesAtahKadosh = leaf.paragraphs?.some((p) =>
                    /אתה קדוש ושמך קדוש/.test((p.body || '').replace(/[֑-ׇ]/g, '')));
                  if (!bundlesAtahKadosh) return null;
                }
                // Hide a section whose entire text was stripped (e.g. Ashkenaz's
                // "ברוך ה' לעולם" leaf in weekday Maariv) — no bare title.
                if (leaf.paragraphs && leaf.paragraphs.length === 0) return null;
                // Hide section if ALL its paragraphs would be filtered out — avoids
                // empty headers like "תהילים קל", "ויברך דוד", etc. when seasonal
                // content was removed.
                if (leaf.paragraphs && leaf.paragraphs.length > 0) {
                  const visibleCount = leaf.paragraphs.filter((p) =>
                    shouldRender(p, active, { showAll, showNotes, chazara: false })).length;
                  if (visibleCount === 0) return null;
                }
                const subTitle = leaf.he || leaf.en;
                // Determine if a MAJOR chapter divider should show (first leaf in a chapter)
                const prevChapter = idx > 0 ? leaves[idx - 1].trail[0]?.he : undefined;
                const myChapter = leaf.trail[0]?.he;
                const showChapterHeader =
                  myChapter && (idx === 0 || myChapter !== prevChapter);
                return (
                  <View
                    key={`${leaf.ref}-${idx}`}
                    ref={(r) => { leafViewRefs.current[leaf.ref] = r; }}
                    onLayout={(e) => {
                      sectionPositions.current[leaf.ref] = e.nativeEvent.layout.y;
                    }}
                  >
                    {showChapterHeader && (
                      <View style={[styles.chapterDivider, idx > 0 && { marginTop: spacing.xxl }]}>
                        <View style={styles.chapterLine} />
                        <Text style={[typography.h2, styles.chapterTitle]}>{myChapter}</Text>
                        <View style={styles.chapterLine} />
                      </View>
                    )}
                    <View style={[styles.sectionBlock, idx > 0 && !showChapterHeader && styles.sectionDivider]}>
                      <Text style={[typography.h3, styles.sectionTitle]}>{subTitle}</Text>
                      {leaf.loading && (
                        <View style={{ paddingVertical: spacing.md }}>
                          <ActivityIndicator color={colors.primary} />
                        </View>
                      )}
                      {leaf.error && (
                        <Text style={[typography.small, { color: colors.danger, marginTop: spacing.sm }]}>
                          לא ניתן לטעון. נסה לפתוח בספריא ↗
                        </Text>
                      )}
                      {leaf.paragraphs &&
                        leaf.paragraphs.map((p, j) => {
                          if (!shouldRender(p, active, { showAll, showNotes, chazara: false })) return null;
                          if (p.kind === 'halachic-note') {
                            return (
                              <Text key={j} style={[typography.small, styles.halachicNote]}>
                                {p.body}
                              </Text>
                            );
                          }
                          if (p.kind === 'conditional' || p.kind === 'alternative') {
                            // Inject day name into Yaaleh VeYavo etc.
                            const enhancedBody = enhanceConditionalText(p, today, inIsrael);
                            // Is this currently in season?
                            // 'unknown' tag = we don't know when, treat as in-season
                            // so it doesn't show a false "לא היום" badge.
                            const inSeason = !p.tags || p.tags.length === 0 ||
                              p.tags.includes('unknown') || p.tags.includes('chazara-only') ||
                              p.tags.some((t) => active.has(t));
                            return (
                              <View key={j} style={[styles.conditionalBlock, !inSeason && styles.conditionalBlockMuted]}>
                                {p.marker && (
                                  <Text style={[typography.caption, styles.conditionalMarker]}>
                                    🔹 {p.marker}
                                    {p.kind === 'alternative' ? ' (במקום)' : ''}
                                    {!inSeason && ' · לא היום'}
                                  </Text>
                                )}
                                <Text
                                  style={[
                                    typography.sacred,
                                    styles.paragraph,
                                    inSeason ? styles.paragraphConditional : styles.paragraphConditionalMuted,
                                  ]}
                                >
                                  {enhancedBody}
                                </Text>
                              </View>
                            );
                          }
                          // Unvocalized paragraphs (no nikud) are rubric /
                          // instructional — render in a smaller serif style
                          // distinct from the vocalized prayer text.
                          const unvocalized = !hasNikud(p.body);
                          // Strip inline (בעשי"ת ...) parens that aren't in season today
                          const renderBody = stripInactiveInlineParens(p.body, active);
                          return (
                            <Text
                              key={j}
                              style={[
                                unvocalized ? styles.rubric : typography.sacred,
                                styles.paragraph,
                              ]}
                            >
                              {renderBody}
                            </Text>
                          );
                        })}
                    </View>
                    {/* Monolithic Amidah (Edot HaMizrach / Chabad — no <b> split,
                        so no per-bracha chazara). Per R. Dvir: a collapse that
                        REPEATS the whole Amidah with the chazara-only lines and the
                        קהל/חזן/"בחזרת הש״ץ" labels shown (showNotes + chazara). */}
                    {prefs.withMinyan && !isMaarivLeaf(leaf) &&
                     leaf.paragraphs && leaf.paragraphs.length > 0 &&
                     (/^(Amid(ah|a)|The Amidah)$/i.test(leaf.en.trim()) ||
                      /^(עמידה|תפילת עמידה|שמונה עשרה)$/.test((leaf.he || '').trim())) ? (() => {
                      const open = chazaraOpenIdx.has(idx);
                      return (
                        <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
                          <Pressable
                            onPress={() => setChazaraOpenIdx((prev) => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx); else next.add(idx);
                              return next;
                            })}
                            style={styles.inlineNextLink}
                            hitSlop={6}
                          >
                            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>
                              🕊  חזרת הש״ץ {open ? '▾' : '▸'}
                            </Text>
                            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                              {open ? 'סגור חזרת הש״ץ' : 'לחץ להציג — חזרה על כל העמידה, כולל קדושה ומודים דרבנן'}
                            </Text>
                          </Pressable>
                          {open ? (
                            <View style={styles.chazaraBlock}>
                              <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md }]}>
                                ⟦ חזרת הש״ץ — כל העמידה עם קדושה, מודים דרבנן והתוויות ⟧
                              </Text>
                              {leaf.paragraphs.map((p, k) => {
                                if (!shouldRender(p, active, { showAll, showNotes: true, chazara: true })) return null;
                                if (p.kind === 'halachic-note') {
                                  return <Text key={k} style={[typography.small, styles.halachicNote]}>{p.body}</Text>;
                                }
                                if (p.kind === 'conditional' || p.kind === 'alternative') {
                                  const body = enhanceConditionalText(p, today, inIsrael);
                                  const inSeason = !p.tags || p.tags.length === 0 ||
                                    p.tags.includes('unknown') || p.tags.includes('chazara-only') ||
                                    p.tags.some((t) => active.has(t));
                                  return (
                                    <View key={k} style={[styles.conditionalBlock, !inSeason && styles.conditionalBlockMuted]}>
                                      {p.marker ? (
                                        <Text style={[typography.caption, styles.conditionalMarker]}>🔹 {p.marker}{!inSeason ? ' · לא היום' : ''}</Text>
                                      ) : null}
                                      <Text style={[typography.sacred, styles.paragraph, inSeason ? styles.paragraphConditional : styles.paragraphConditionalMuted]}>{body}</Text>
                                    </View>
                                  );
                                }
                                const unvoc = !hasNikud(p.body);
                                return <Text key={k} style={[unvoc ? styles.rubric : typography.sacred, styles.paragraph]}>{stripInactiveInlineParens(p.body, active)}</Text>;
                              })}
                            </View>
                          ) : null}
                        </View>
                      );
                    })() : null}
                    {/* Inline COLLAPSE AFTER אלוקי נצור: חזרת הש"ץ.
                        Renders at EACH אלוקי נצור position (silent Shacharit
                        + silent Musaf on RC). Each collapse pulls the leaves of
                        its OWN Amidah variant. */}
                    {elokaiNetzorIdxs.includes(idx) ? (() => {
                      const isMyMusafChazara = isMusafAmidahLeaf(leaf);
                      const open = chazaraOpenIdx.has(idx);
                      const label = isMyMusafChazara ? 'חזרת הש״ץ של מוסף' : 'חזרת הש״ץ';
                      return (
                      <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
                        <Pressable
                          onPress={() => setChazaraOpenIdx((prev) => {
                            const next = new Set(prev);
                            if (next.has(idx)) next.delete(idx); else next.add(idx);
                            return next;
                          })}
                          style={styles.inlineNextLink}
                          hitSlop={6}
                        >
                          <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>
                            🕊  {label} {open ? '▾' : '▸'}
                          </Text>
                          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                            {open
                              ? 'סגור חזרת הש״ץ'
                              : 'לחץ להציג — כולל קדושה ומודים דרבנן'}
                          </Text>
                        </Pressable>
                        {open ? (
                          <View style={styles.chazaraBlock}>
                            <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md }]}>
                              ⟦ {label} — כל הברכות עם קדושה ומודים דרבנן ⟧
                            </Text>
                            {leaves
                              .filter((l) => {
                                if (!(isAmidahLeaf(l) && !isConcludingPassage(l)
                                  && (isMusafAmidahLeaf(l) === isMyMusafChazara))) return false;
                                // Ashkenaz: the Kedushah leaf is self-contained — its
                                // "לדור ודור" runs through "...כי אל מלך גדול וקדוש אתה:
                                // ברוך אתה ה' האל הקדוש". So in the chazara we say לדור
                                // ודור, NOT the silent "אתה קדוש ושמך קדוש"; drop the
                                // separate "Holiness of God" leaf. (Sefard's Kedushah has
                                // no לדור ודור, so its קדושת השם stays in the chazara.)
                                const isHoG = /^Holiness of God$/i.test(l.en) || /^קדושת השם$/.test(l.he);
                                if (isHoG && leaves.some((k) =>
                                  isKedushahLeaf(k) && (isMusafAmidahLeaf(k) === isMyMusafChazara) &&
                                  k.paragraphs?.some((p) => /לדור ודור נגיד גדלך/.test((p.body || '').replace(/[֑-ׇ]/g, ''))))) {
                                  return false;
                                }
                                return true;
                              })
                              .map((cleaf, j) => (
                              <View key={`chazara-${cleaf.ref}-${j}`} style={{ marginBottom: spacing.sm }}>
                                <Text style={[typography.h3, styles.sectionTitle]}>{cleaf.he || cleaf.en}</Text>
                                {cleaf.loading ? (
                                  <ActivityIndicator color={colors.primary} size="small" />
                                ) : cleaf.error ? (
                                  <Text style={[typography.small, { color: colors.danger }]}>
                                    שגיאה בטעינה
                                  </Text>
                                ) : (
                                  cleaf.paragraphs?.map((p, k) => {
                                    if (!shouldRender(p, active, { showAll, showNotes, chazara: true })) return null;
                                    if (p.kind === 'halachic-note') {
                                      return showNotes ? (
                                        <Text key={k} style={[typography.small, styles.halachicNote]}>{p.body}</Text>
                                      ) : null;
                                    }
                                    if (p.kind === 'conditional' || p.kind === 'alternative') {
                                      const body = enhanceConditionalText(p, today, inIsrael);
                                      const inSeason = !p.tags || p.tags.length === 0 ||
                                        p.tags.includes('unknown') || p.tags.includes('chazara-only') ||
                                        p.tags.some((t) => active.has(t));
                                      return (
                                        <View key={k} style={[styles.conditionalBlock, !inSeason && styles.conditionalBlockMuted]}>
                                          {p.marker ? (
                                            <Text style={[typography.caption, styles.conditionalMarker]}>
                                              🔹 {p.marker}{p.kind === 'alternative' ? ' (במקום)' : ''}{!inSeason ? ' · לא היום' : ''}
                                            </Text>
                                          ) : null}
                                          <Text style={[typography.sacred, styles.paragraph, inSeason ? styles.paragraphConditional : styles.paragraphConditionalMuted]}>
                                            {body}
                                          </Text>
                                        </View>
                                      );
                                    }
                                    const unvoc = !hasNikud(p.body);
                                    const chazaraRenderBody = stripInactiveInlineParens(p.body, active);
                                    return (
                                      <Text key={k} style={[unvoc ? styles.rubric : typography.sacred, styles.paragraph]}>
                                        {chazaraRenderBody}
                                      </Text>
                                    );
                                  })
                                )}
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                      );
                    })() : null}
                    {/* Gabbai assistance card — render ONCE at the aliyah-blessing
                        leaf. Ashkenaz exposes a dedicated "Birkat HaTorah" leaf;
                        Sefard / Edot HaMizrach / Chabad pack the whole service into
                        a single "Torah Reading" / "קריאת התורה" leaf, so match that
                        too (otherwise the gabbai card never appears in those three
                        nuschaot). Each nusach has exactly ONE matching leaf, so no
                        duplicate cards. Previously matching any "Torah Reading" in
                        the TRAIL produced ~10 duplicates — we match the leaf's own
                        en/he only. */}
                    {(/^Birkat HaTorah$|^Reading from Sefer$|^Torah Reading$|^ברכת התורה$|^קריאת הקודש$/i.test(leaf.en.trim()) ||
                      /^ברכת התורה$|^קריאת הקודש$|^קריאת התורה$/.test(leaf.he.trim())) ? (
                      <View style={{ marginTop: spacing.md }}>
                        <GabbaiCard />
                      </View>
                    ) : null}
                    {/* Inline anchor for קריאת התורה (Mon/Thu) — right after הוצאת ספר תורה.
                        SKIP on RC/Chag/Chol HaMoed/fasts — those days have their own
                        Torah reading, so a "Mon/Thu" leyning link would be misleading. */}
                    {idx === torahAnchorIdx && prefs.includeMondayThursdayLeyning &&
                     !active.has('rosh-chodesh') && !active.has('chol-hamoed') &&
                     !active.has('fast') && !active.has('chanukah') && !active.has('purim') ? (
                      <Pressable
                        onPress={() => router.push('/tfilon/leyning' as any)}
                        style={styles.inlineNextLink}
                      >
                        <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>
                          📖  קריאת התורה לשני/חמישי ←
                        </Text>
                        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                          {isMonOrThu
                            ? '3 עליות מהפרשה הקרובה'
                            : 'מוצג רק בימי ב׳ ו-ה׳ (לתצוגה מקדימה)'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </Card>
            );
          })()}

          {/* (All optional inserts and leyning link are now rendered INLINE
              inside the leaves loop, anchored to their canonical positions —
              see insertsAt and torahAnchorIdx above. Nothing here.) */}

          {isRunningText && here?.ref && (
            <Pressable
              onPress={() => Linking.openURL(`https://www.sefaria.org.il/${encodeURIComponent(here.ref!)}?lang=he`)}
              style={{ alignSelf: 'center', marginTop: spacing.lg }}
              hitSlop={10}
            >
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                טקסטים מאת Sefaria · CC-BY
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ height: 40 }} />
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  navBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  navSheet: {
    backgroundColor: '#0a1f3d',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  navItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    gap: spacing.sm,
  },
  breadcrumb: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: 4,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  tocChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  toggleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  conditionalBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 4,
    borderRightColor: '#8B3A62', // burgundy - distinct from primary brown
    backgroundColor: 'rgba(139, 58, 98, 0.07)',
    borderRadius: radius.sm,
  },
  conditionalBlockMuted: {
    borderRightColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.03)',
    opacity: 0.55,
  },
  conditionalMarker: {
    color: '#e6a3c2', // light pink/burgundy — visible on dark navy
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  paragraphConditional: {
    marginTop: 2,
    color: colors.textPrimary, // white — fully readable on the dark navy background
    fontWeight: '500',
  },
  paragraphConditionalMuted: {
    marginTop: 2,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  halachicNote: {
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    lineHeight: 20,
    opacity: 0.85,
  },
  // Rubric / instructional text style — smaller and visually distinct from
  // the vocalized prayer text (which uses typography.sacred).
  rubric: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 19,
    textAlign: 'right',
  },
  chapterDivider: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  chapterLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  chapterTitle: {
    color: colors.primary,
    fontWeight: '700',
  },
  sectionBlock: {
    paddingVertical: spacing.sm,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E8DFCC',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    color: colors.primaryDark,
    marginBottom: 4,
  },
  paragraph: {
    color: colors.textPrimary,
    lineHeight: 32,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  inlineNextLink: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(184,134,42,0.10)',
    borderRightWidth: 4,
    borderRightColor: '#b8862a',
    borderRadius: radius.sm,
    alignItems: 'flex-end',
  },
  chazaraBlock: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(184,134,42,0.06)',
    borderRadius: radius.md,
    borderRightWidth: 4,
    borderRightColor: '#b8862a',
  },
});

/** Inline checkbox row used in the preferences sheet. The "when" prop is a
 *  small secondary line indicating WHEN this section is traditionally said
 *  (e.g. "ראש חודש בלבד", "מאלול עד הושענא רבה"). */
function PrefToggle({ label, when, value, onChange }: { label: string; when?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={4}
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
        gap: spacing.sm,
        paddingVertical: 6,
      }}
    >
      <View
        style={{
          width: 22, height: 22, borderRadius: 5,
          borderWidth: 1.5,
          borderColor: value ? colors.primary : colors.border,
          backgroundColor: value ? colors.primary : 'transparent',
          alignItems: 'center', justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {value ? <Text style={{ color: colors.textInverse, fontWeight: '700', fontSize: 14 }}>✓</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>
          {label}
        </Text>
        {when ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            ↳ {when}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
