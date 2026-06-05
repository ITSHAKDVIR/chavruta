/**
 * Mishnayos by Hebrew letter — for "לעילוי נשמת".
 *
 * Each Hebrew letter in the deceased's name maps to an entire PEREK
 * (chapter) of mishna. After the name's letters, we also study the
 * 4 chapters for the letters of "נשמה" (soul).
 *
 * Source: chabad.org Mishnayos l'Iluy Neshama table
 * (he.chabad.org/library/article_cdo/aid/5099121).
 *
 * Each entry references a Sefaria chapter — we fetch the actual text
 * dynamically.
 */
export type LetterMishna = {
  letter: string;
  /** Sefaria reference for the whole perek, e.g. "Mishnah Berakhot 5" */
  ref: string;
  /** Human-readable label in Hebrew */
  label: string;
};

// Chabad table — each letter ⇢ an entire perek of mishna.
export const LETTER_TO_MISHNA: Record<string, LetterMishna> = {
  'א': { letter: 'א', ref: 'Mishnah Berakhot 5',     label: 'מסכת ברכות, פרק ה' },
  'ב': { letter: 'ב', ref: 'Mishnah Taanit 4',       label: 'מסכת תענית, פרק ד' },
  'ג': { letter: 'ג', ref: 'Mishnah Bava Batra 10',  label: 'מסכת בבא בתרא, פרק י' },
  'ד': { letter: 'ד', ref: 'Mishnah Sanhedrin 1',    label: 'מסכת סנהדרין, פרק א' },
  'ה': { letter: 'ה', ref: 'Mishnah Berakhot 2',     label: 'מסכת ברכות, פרק ב' },
  'ו': { letter: 'ו', ref: 'Mishnah Moed Katan 3',   label: 'מסכת מועד קטן, פרק ג' },
  'ז': { letter: 'ז', ref: 'Mishnah Tahorot 9',      label: 'מסכת טהרות, פרק ט' },
  'ח': { letter: 'ח', ref: 'Mishnah Shabbat 22',     label: 'מסכת שבת, פרק כב' },
  'ט': { letter: 'ט', ref: 'Mishnah Yoma 4',         label: 'מסכת יומא, פרק ד' },
  'י': { letter: 'י', ref: 'Mishnah Rosh Hashanah 4',label: 'מסכת ראש השנה, פרק ד' },
  'כ': { letter: 'כ', ref: 'Mishnah Berakhot 6',     label: 'מסכת ברכות, פרק ו' },
  'ל': { letter: 'ל', ref: 'Mishnah Sukkah 4',       label: 'מסכת סוכה, פרק ד' },
  'מ': { letter: 'מ', ref: 'Mishnah Berakhot 1',     label: 'מסכת ברכות, פרק א' },
  'נ': { letter: 'נ', ref: 'Mishnah Shabbat 21',     label: 'מסכת שבת, פרק כא' },
  'ס': { letter: 'ס', ref: 'Mishnah Sukkah 1',       label: 'מסכת סוכה, פרק א' },
  'ע': { letter: 'ע', ref: 'Mishnah Pesachim 10',    label: 'מסכת פסחים, פרק י' },
  'פ': { letter: 'פ', ref: 'Mishnah Challah 2',      label: 'מסכת חלה, פרק ב' },
  'צ': { letter: 'צ', ref: 'Mishnah Parah 9',        label: 'מסכת פרה, פרק ט' },
  'ק': { letter: 'ק', ref: 'Mishnah Nedarim 8',      label: 'מסכת נדרים, פרק ח' },
  'ר': { letter: 'ר', ref: 'Mishnah Shabbat 13',     label: 'מסכת שבת, פרק יג' },
  'ש': { letter: 'ש', ref: 'Mishnah Shabbat 23',     label: 'מסכת שבת, פרק כג' },
  'ת': { letter: 'ת', ref: 'Mishnah Berakhot 4',     label: 'מסכת ברכות, פרק ד' },
};

// Final-form letters map to their base form
export const SOFIT_MAP: Record<string, string> = {
  'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ',
};

/** Strip nikud and split a name into its constituent letters (in order) */
export function nameToLetters(name: string): string[] {
  const stripped = name.replace(/[֑-ׇ]/g, '').replace(/\s+/g, '');
  const out: string[] = [];
  for (const ch of stripped) {
    const base = SOFIT_MAP[ch] || ch;
    if (LETTER_TO_MISHNA[base]) out.push(base);
  }
  return out;
}

/** The 4 letters of "נשמה" added at the end */
export const NESHAMA_LETTERS = ['נ', 'ש', 'מ', 'ה'];
