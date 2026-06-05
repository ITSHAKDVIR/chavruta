/**
 * The four "תקופות" (solar season transitions). Per Shmuel's calculation: a year is
 * exactly 365.25 days, divided into 4 equal periods of 91d 7.5h each.
 *
 * Tekufat Tishrei is conventionally set near the autumnal equinox (~23 Sep).
 * The 60-day count for "ותן טל ומטר" in Diaspora starts from Tekufat Tishrei.
 */
export type Tekufa = {
  id: 'tishrei' | 'tevet' | 'nisan' | 'tamuz';
  name: string;
  emoji: string;
  meaning: string;
  /** Exact moment of the transition for the given Gregorian year. */
  start: Date;
};

const TEKUFA_LENGTH_MS = (91 * 24 + 7.5) * 3600 * 1000;

export function computeTekufot(year: number): Tekufa[] {
  // Tekufat Tishrei for year Y is around September 23-24 of Y (varies slightly).
  // Per Shmuel: 6 hours after midday on the conventional date — close enough.
  const tishreiStart = new Date(year, 8, 23, 12, 0, 0);
  return [
    {
      id: 'tishrei',
      name: 'תקופת תשרי',
      emoji: '🍂',
      meaning: 'השוויון הסתווי - תחילת הסתיו',
      start: tishreiStart,
    },
    {
      id: 'tevet',
      name: 'תקופת טבת',
      emoji: '❄️',
      meaning: 'אמצע החורף - היום הקצר ביותר',
      start: new Date(tishreiStart.getTime() + TEKUFA_LENGTH_MS),
    },
    {
      id: 'nisan',
      name: 'תקופת ניסן',
      emoji: '🌸',
      meaning: 'השוויון האביבי - התחדשות',
      start: new Date(tishreiStart.getTime() + 2 * TEKUFA_LENGTH_MS),
    },
    {
      id: 'tamuz',
      name: 'תקופת תמוז',
      emoji: '☀️',
      meaning: 'אמצע הקיץ - היום הארוך ביותר',
      start: new Date(tishreiStart.getTime() + 3 * TEKUFA_LENGTH_MS),
    },
  ];
}

/** Returns the tekufah falling today (same Gregorian date), or null. */
export function isTekufaToday(date: Date = new Date()): Tekufa | null {
  const candidates = [
    ...computeTekufot(date.getFullYear() - 1),
    ...computeTekufot(date.getFullYear()),
    ...computeTekufot(date.getFullYear() + 1),
  ];
  for (const t of candidates) {
    if (
      t.start.getFullYear() === date.getFullYear() &&
      t.start.getMonth() === date.getMonth() &&
      t.start.getDate() === date.getDate()
    ) {
      return t;
    }
  }
  return null;
}
