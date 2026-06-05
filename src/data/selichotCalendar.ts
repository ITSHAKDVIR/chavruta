import { HDate, HebrewCalendar, months, flags } from '@hebcal/core';

/**
 * Maps a date to the appropriate Selichot day per Nusach Polin/Ashkenaz.
 * Ashkenaz custom:
 *  - Start on Saturday night BEFORE Rosh HaShana, at least 4 nights before RH.
 *  - If RH falls on Monday/Tuesday: start the immediately preceding Saturday night.
 *  - If RH falls on Thursday/Saturday: start two Saturdays before (to ensure 4+ days).
 *  - Days are: "ליום ראשון" through "ליום שביעי" (the regular selichot week).
 *  - "לערב ראש השנה" - the day of Erev RH.
 *  - "לצום גדליה" - 3 Tishrei.
 *  - "ליום שני/שלישי/רביעי/חמישי דעשי״ת" - days 4-7 of Aseret Yemei Teshuva.
 *  - "לערב יום כיפור" - 9 Tishrei.
 */

export type SelichotDayKey =
  | 'first-day' | 'second-day' | 'third-day' | 'fourth-day'
  | 'fifth-day' | 'sixth-day' | 'seventh-day'
  | 'erev-rosh-hashana'
  | 'tzom-gedaliah'
  | 'aseret-yt-2' | 'aseret-yt-3' | 'aseret-yt-4' | 'aseret-yt-5'
  | 'erev-yom-kippur';

export const POLIN_DAYS: { key: SelichotDayKey; he: string; ref: string }[] = [
  { key: 'first-day',         he: 'ליום ראשון',                   ref: 'Selichot Nusach Polin, First Day' },
  { key: 'second-day',        he: 'ליום שני',                     ref: 'Selichot Nusach Polin, Second Day' },
  { key: 'third-day',         he: 'ליום שלישי',                   ref: 'Selichot Nusach Polin, Third Day' },
  { key: 'fourth-day',        he: 'ליום רביעי',                   ref: 'Selichot Nusach Polin, Fourth Day' },
  { key: 'fifth-day',         he: 'ליום חמישי',                   ref: 'Selichot Nusach Polin, Fifth Day' },
  { key: 'sixth-day',         he: 'ליום שישי',                    ref: 'Selichot Nusach Polin, Sixth Day' },
  { key: 'seventh-day',       he: 'ליום שביעי',                   ref: 'Selichot Nusach Polin, Seventh Day' },
  { key: 'erev-rosh-hashana', he: 'לערב ראש השנה',                ref: 'Selichot Nusach Polin, Erev Rosh Hashana' },
  { key: 'tzom-gedaliah',     he: 'לצום גדליה',                   ref: 'Selichot Nusach Polin, Fast of Gedaliah' },
  { key: 'aseret-yt-2',       he: 'ליום שני דעשי״ת',              ref: 'Selichot Nusach Polin, Second Day of the Ten Days of Penitence' },
  { key: 'aseret-yt-3',       he: 'ליום שלישי דעשי״ת',            ref: 'Selichot Nusach Polin, Third Day of the Ten Days of Penitence' },
  { key: 'aseret-yt-4',       he: 'ליום רביעי דעשי״ת',            ref: 'Selichot Nusach Polin, Fourth Day of the Ten Days of Penitence' },
  { key: 'aseret-yt-5',       he: 'ליום חמישי דעשי״ת',            ref: 'Selichot Nusach Polin, Fifth Day of the Ten Days of Penitence' },
  { key: 'erev-yom-kippur',   he: 'לערב יום כיפור',               ref: 'Selichot Nusach Polin, Yom Kippur Eve' },
];

/** Returns the first day of Rosh HaShana for the given Hebrew year. */
function roshHashanaDate(hebYear: number): Date {
  return new HDate(1, months.TISHREI, hebYear).greg();
}

/** Returns the start date of Ashkenazi selichot for the year containing the given date. */
function selichotStartDate(date: Date): Date {
  // Determine the Hebrew year of the upcoming Rosh HaShana
  const hd = new HDate(date);
  const m = hd.getMonth();
  // If we're already past Elul/Tishrei, look at next year
  const targetYear = m >= months.TISHREI || m <= months.TAMUZ ? hd.getFullYear() + 1 : hd.getFullYear();
  // Actually: if we're in Elul or early Tishrei (before YK), use the current year's RH
  let rhYear = hd.getFullYear() + 1;
  if (m === months.ELUL) rhYear = hd.getFullYear() + 1;
  else if (m === months.TISHREI && hd.getDate() <= 10) rhYear = hd.getFullYear();
  else if (m >= months.AV) rhYear = hd.getFullYear() + 1;
  else rhYear = hd.getFullYear();

  const rh = roshHashanaDate(rhYear);
  const rhDay = rh.getDay(); // 0=Sun
  // Need 4+ days of selichot before RH (not counting RH itself)
  // Saturday night of week before RH is the standard start; add an extra week if needed.
  // Find the Saturday immediately before RH:
  const daysUntilRH = (rhDay - 6 + 7) % 7 || 7; // days from previous Saturday to RH
  let weeksBefore = 1;
  if (daysUntilRH < 4) weeksBefore = 2; // not enough, push back another week

  const startSat = new Date(rh);
  startSat.setDate(startSat.getDate() - daysUntilRH - 7 * (weeksBefore - 1));
  // Saturday night = the date of that Saturday (selichot are said after midnight, conventionally treated as next day for ref purposes)
  // We'll treat the first selichot day as the Saturday night → Sunday "ליום ראשון" mapping.
  return startSat;
}

/** Returns the selichot day key for the given date (Ashkenaz/Polin), or null if not in season. */
export function polinDayFor(date: Date, inIsrael = true): SelichotDayKey | null {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  const isRH = m === months.TISHREI && (d === 1 || d === 2);
  const isYK = m === months.TISHREI && d === 10;

  // On Rosh HaShana or Yom Kippur itself we don't say selichot
  if (isRH || isYK) return null;

  // Tishrei 3-9 (Aseret Yemei Teshuva, excluding RH itself)
  if (m === months.TISHREI) {
    if (d === 3) return 'tzom-gedaliah';
    if (d === 4) return 'aseret-yt-2';
    if (d === 5) return 'aseret-yt-3';
    if (d === 6) return 'aseret-yt-4';
    if (d === 7) return 'aseret-yt-5';
    // 8-9: special - 9 is Erev YK
    if (d === 8) return 'aseret-yt-5'; // doubling or Sephardim
    if (d === 9) return 'erev-yom-kippur';
  }

  // 29 Elul - Erev RH
  if (m === months.ELUL && d === 29) return 'erev-rosh-hashana';

  // Selichot week (Elul, before RH eve)
  if (m === months.ELUL && d >= 1 && d <= 28) {
    const start = selichotStartDate(date);
    const dayOffset = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
    if (dayOffset < 0) return null;
    // Map offset to day key. Day 0 = First Day (Saturday night), then sequential.
    // Stop at "Seventh Day" then Erev RH (handled above).
    const offsetMap: SelichotDayKey[] = [
      'first-day', 'second-day', 'third-day', 'fourth-day',
      'fifth-day', 'sixth-day', 'seventh-day',
    ];
    if (dayOffset >= 0 && dayOffset < offsetMap.length) return offsetMap[dayOffset];
    if (dayOffset >= offsetMap.length) {
      // Past 7 days - means it's still before Erev RH but more than 7 days passed.
      // We loop through "first-day" → "seventh-day" cyclically until Erev RH.
      return offsetMap[dayOffset % offsetMap.length];
    }
  }

  return null;
}

/** Sephardi/Edot HaMizrach: selichot are recited daily from 1 Elul through Erev YK. */
export function sephardiSelichotActive(date: Date): boolean {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  if (m === months.ELUL) return true;
  if (m === months.TISHREI && d <= 9) {
    // Don't say on RH itself (1-2) but do say on 3-9
    return d === 3 || d === 4 || d === 5 || d === 6 || d === 7 || d === 8 || d === 9;
  }
  return false;
}

/** Find the most relevant Polin day even if we're outside the season (so user can browse) */
export function defaultPolinDay(date: Date): SelichotDayKey {
  return polinDayFor(date) ?? 'first-day';
}
