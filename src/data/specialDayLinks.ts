/**
 * Returns banner-link data for special-day external screens that should be
 * surfaced from within the siddur reader.
 *
 *   - Purim Maariv + Shacharit → link to /tools/megillah (Megillah reading)
 *   - Sukkot ChH"M Shacharit  → link to /tools/hoshanot (daily Hoshanot)
 *   - Tisha B'Av Shacharit    → link to /tools/kinnot (Kinnot collection)
 *   - Tisha B'Av Shacharit    → warning card "no Tallit/Tefillin in shacharit"
 *
 * Each return value is consumed by read.tsx to render a Card<accent> banner
 * at the top of the prayer flow (similar to the Musaf and Selichot banners).
 */
import { HDate, HebrewCalendar, flags, months } from '@hebcal/core';

export type SpecialLink = {
  /** Hebrew label shown in the banner. */
  label: string;
  /** Short description line. */
  description: string;
  /** Slash-prefixed router path. */
  path: string;
  /** Emoji icon. */
  icon: string;
};

/** Megillah link — shown on Purim night (Maariv) and Purim morning (Shacharit). */
export function getActiveMegillahLink(date: Date = new Date(), inIsrael = true): SpecialLink | null {
  const hd = new HDate(date);
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  if (!events.some((e) => /Purim|Shushan/i.test(e.getDesc()))) return null;
  return {
    label: 'קריאת מגילת אסתר',
    description: 'הערב ניתן לקרוא את המגילה — לחץ למעבר לטקסט עם ניקוד וטעמים.',
    path: '/tools/megillah',
    icon: '📜',
  };
}

/** Hoshanot link — shown on each Sukkot ChH"M day (and Hoshana Rabbah). */
export function getActiveHoshanotLink(date: Date = new Date(), inIsrael = true): SpecialLink | null {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  if (m !== months.TISHREI || d < 15 || d > 21) return null;
  // Skip Shabbat (different Hoshanot custom; tool handles it)
  return {
    label: 'הושענות להיום',
    description: 'הקפה ואמירת הושענות לפי יום החג. לחץ למעבר לטקסט המלא.',
    path: '/tools/hoshanot',
    icon: '🌿',
  };
}

/** Kinnot link — shown on Tisha B'Av Shacharit. */
export function getActiveKinnotLink(date: Date = new Date(), inIsrael = true): SpecialLink | null {
  const hd = new HDate(date);
  if (hd.getMonth() !== months.AV || hd.getDate() !== 9) return null;
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  if (!events.some((e) => /Tish.a.B.Av|9.Av/i.test(e.getDesc()))) return null;
  return {
    label: 'קינות לתשעה באב',
    description: 'אחרי שחרית נוהגים לומר קינות. לחץ למעבר לאוסף הקינות.',
    path: '/tools/kinnot',
    icon: '😢',
  };
}

/** Halachic warning card for Tisha B'Av Shacharit — no Tallit/Tefillin
 *  (Ashkenazim and Sephardi Chasidi); Edot HaMizrach has its own custom. */
export function getTishaBAvTallitWarning(
  date: Date = new Date(),
  nusach: 'ashkenazi' | 'sephardi' | 'edot-mizrach' | 'chabad' = 'ashkenazi',
): SpecialLink | null {
  const hd = new HDate(date);
  if (hd.getMonth() !== months.AV || hd.getDate() !== 9) return null;
  if (nusach === 'edot-mizrach') {
    return {
      label: 'תפילין בתשעה באב',
      description: 'מנהג עדות המזרח: מתפללים שחרית עם טלית ותפילין בבית ואחר כך מסירים. לחץ להלכות.',
      path: '/tools/tisha-bav-info',
      icon: '⚠️',
    };
  }
  return {
    label: 'אין טלית ותפילין בשחרית',
    description: 'נוהגים שלא להניח טלית ותפילין בשחרית של תשעה באב. מניחים במנחה.',
    path: '/tools/tisha-bav-info',
    icon: '⚠️',
  };
}
