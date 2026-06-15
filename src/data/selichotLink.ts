import { HDate, HebrewCalendar, flags, months } from '@hebcal/core';
import { Nusach } from './siddurTree';

/**
 * Surface a Selichot quick-link banner on Shacharit during days when Selichot
 * is recited. Used for both Aseret Yemei Teshuva (most communities say
 * Selichot until Yom Kippur — Ashkenazim from motzei Shabbat before R"H,
 * Edot HaMizrach from 1 Elul) and on public fast days.
 *
 * The banner navigates to the existing Selichot tool (/tools/selichot) which
 * auto-loads the right Selichot for today's date.
 */
export type SelichotLink = {
  label: string;
  /** Route to navigate to. Always /tools/selichot — the tool decides which
   *  Selichot to surface based on the date. */
  path: string;
  /** Why this banner is being shown (for telemetry / debug). */
  reason: 'elul' | 'aseret' | 'fast' | 'bahab';
};

export function getActiveSelichotLink(
  date: Date = new Date(),
  inIsrael = true,
  nusach: Nusach = 'ashkenazi',
): SelichotLink | null {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  const isFast = events.some((e) => e.getFlags() & (flags.MAJOR_FAST | flags.MINOR_FAST));

  // Public fast day → Selichot at Shacharit
  if (isFast) {
    return { label: 'סליחות לתענית', path: '/tools/selichot', reason: 'fast' };
  }

  // Aseret Yemei Teshuva (1-10 Tishrei) — daily Selichot until YK eve
  if (m === months.TISHREI && d >= 1 && d <= 9) {
    return { label: 'סליחות עשרת ימי תשובה', path: '/tools/selichot', reason: 'aseret' };
  }

  // Elul Selichot:
  //   • Edot HaMizrach: from 1 Elul
  //   • Ashkenazim (Ashkenaz + Sephard chasidi + Chabad): from motzei Shabbat
  //     before R"H (or 2 weeks earlier if less than 4 days). Heuristic: from
  //     20 Elul show the banner — close enough to the customary start without
  //     pretending to compute exact Saturday-night boundaries.
  if (m === months.ELUL) {
    if (nusach === 'edot-mizrach') {
      return { label: 'סליחות לחודש אלול', path: '/tools/selichot', reason: 'elul' };
    }
    if (d >= 20) {
      return { label: 'סליחות לפני ראש השנה', path: '/tools/selichot', reason: 'elul' };
    }
  }

  return null;
}
