import { HDate } from '@hebcal/core';
import data from './halachaYomit.json';

export type HalachaYomitEntry = {
  hmonth: number;
  hday: number;
  dateLabel: string;
  title: string | null;
  paragraphs: string[];
};

const ENTRIES: HalachaYomitEntry[] = (data as any).entries;

// Quick lookup map
const BY_KEY = new Map<string, HalachaYomitEntry>();
for (const e of ENTRIES) {
  BY_KEY.set(`${e.hmonth}-${e.hday}`, e);
}

/**
 * Resolves the lookup key for a Hebrew date, handling the Adar I/II / regular Adar mapping:
 * - Leap year, Adar I → hmonth 12 (book's "אדר א")
 * - Leap year, Adar II → hmonth 13 (book's "אדר ב")
 * - Non-leap year, regular Adar (which Hebcal returns as month 12) → use Adar II content (hmonth 13)
 *   because "אדר ב" in the book corresponds to the practical Adar where Purim is observed.
 */
function lookupKey(hd: HDate): { hmonth: number; hday: number } {
  const m = hd.getMonth();
  const d = hd.getDate();
  if (m === 12 && !HDate.isLeapYear(hd.getFullYear())) {
    return { hmonth: 13, hday: d };
  }
  return { hmonth: m, hday: d };
}

/** Get the Halacha Yomit entry for a Hebrew date. Returns null if no entry exists. */
export function getHalachaForDate(date: Date = new Date()): HalachaYomitEntry | null {
  const hd = new HDate(date);
  const { hmonth, hday } = lookupKey(hd);
  return BY_KEY.get(`${hmonth}-${hday}`) ?? null;
}

/** Get entry directly by hmonth + hday lookup. */
export function getHalachaByHebrewDate(hmonth: number, hday: number): HalachaYomitEntry | null {
  return BY_KEY.get(`${hmonth}-${hday}`) ?? null;
}

/** Short, single-line label for the today card on the learn list. */
export function getHalachaTodayLabel(date: Date = new Date()): string {
  const entry = getHalachaForDate(date);
  if (!entry) return 'אין הלכה לתאריך זה';
  return entry.title || entry.dateLabel;
}

export function getAllHalachaEntries(): HalachaYomitEntry[] {
  return ENTRIES;
}
