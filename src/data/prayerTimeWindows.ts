/**
 * Prayer-time validation — figures out whether the user is in a valid
 * halachic window for the prayer they're reading, and surfaces warnings.
 *
 * Per the user's halachic preferences:
 *
 * • Every warning states clearly *when* the valid time begins / ends.
 * • Mincha after sunset: just inform "השקיעה כבר עברה" — no judgment about
 *   what's allowed bediavad.
 * • Maariv: no language framing plag-time as "bediavad" — there are those
 *   who pray from plag haMincha lechatchila.  No warning between chatzot
 *   and alot.  Only block before alot of the next morning.
 * • Shacharit: before alot — block.  Before sunrise — note that sunrise
 *   hasn't happened yet (the preferred earliest).
 */
import type { ZmanimResult } from './hebcal';

export type PrayerKind = 'shacharit' | 'mincha' | 'maariv';

export type PrayerWarningLevel = 'info' | 'warn' | 'urgent';

export type PrayerWarning = {
  level: PrayerWarningLevel;
  title: string;
  /** Optional second line with more detail. */
  body?: string;
};

const URGENT_WINDOW_MIN = 10;

/** Identify which prayer the user is currently reading from the section
 *  English name + ancestor breadcrumb trail.  Returns null when the page
 *  isn't one of the 3 daily tefilot (e.g. a tehillim section). */
export function getPrayerKind(
  hereEn: string | undefined,
  trail: { en: string; he: string }[] = [],
): PrayerKind | null {
  const names = [hereEn || '', ...trail.map((t) => t.en)].map((s) => s.toLowerCase());
  const blob = names.join(' | ');
  // Order matters — Maariv/Arvit must be checked before "Shacharit" gets a false
  // positive on something like "Shabbat Arvit / Shacharit" combos.
  if (/(maariv|arvit)/.test(blob)) return 'maariv';
  if (/(mincha|minchah)/.test(blob)) return 'mincha';
  if (/(shacharit|shaharit|morning prayer|weekday shacharit)/.test(blob)) return 'shacharit';
  return null;
}

function fmt(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function minutesUntil(target: Date | null, now: Date): number | null {
  if (!target) return null;
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

/**
 * Build the warning for a given prayer + zmanim + current time.
 * Returns null if everything is fine (user is well within the valid window).
 */
export function getPrayerWarning(
  kind: PrayerKind,
  zmanim: ZmanimResult,
  now: Date,
): PrayerWarning | null {
  if (kind === 'shacharit') {
    const alot = zmanim.alotHaShachar;
    const hanetz = zmanim.sunrise;
    const sofShmaGRA = zmanim.sofZmanShmaGRA;
    const sofShmaMA = zmanim.sofZmanShmaMA;
    const sofTfillaGRA = zmanim.sofZmanTfillaGRA;
    const sofTfillaMA = zmanim.sofZmanTfillaMA;

    // Before alot — full block. Tell the user when they CAN start.
    if (alot && now < alot) {
      return {
        level: 'warn',
        title: 'זמן שחרית עוד לא הגיע',
        body: `עלות השחר ב-${fmt(alot)} · הנץ ב-${fmt(hanetz)} · סוף זמן ק״ש בערך ${fmt(sofShmaGRA)}.`,
      };
    }
    // Between alot and hanetz — inform that sunrise hasn't happened yet.
    if (alot && hanetz && now >= alot && now < hanetz) {
      return {
        level: 'info',
        title: 'הזריחה עדיין לא היתה',
        body: `הנץ החמה ב-${fmt(hanetz)} · עלות השחר היה ב-${fmt(alot)}.`,
      };
    }
    // End-approaching — ק״ש מג"א
    const minutesToShmaMA = minutesUntil(sofShmaMA, now);
    if (minutesToShmaMA !== null && minutesToShmaMA > 0 && minutesToShmaMA <= URGENT_WINDOW_MIN) {
      return {
        level: 'urgent',
        title: `סוף זמן ק״ש (מג״א) בעוד ${minutesToShmaMA} ${minutesToShmaMA === 1 ? 'דקה' : 'דקות'}`,
        body: `מג״א: ${fmt(sofShmaMA)} · גר״א: ${fmt(sofShmaGRA)} · סוף תפילה: ${fmt(sofTfillaGRA)}.`,
      };
    }
    // End-approaching — ק״ש גר"א
    const minutesToShmaGRA = minutesUntil(sofShmaGRA, now);
    if (minutesToShmaGRA !== null && minutesToShmaGRA > 0 && minutesToShmaGRA <= URGENT_WINDOW_MIN) {
      return {
        level: 'urgent',
        title: `סוף זמן ק״ש (גר״א) בעוד ${minutesToShmaGRA} ${minutesToShmaGRA === 1 ? 'דקה' : 'דקות'}`,
        body: `גר״א: ${fmt(sofShmaGRA)} · סוף זמן תפילה: ${fmt(sofTfillaGRA)}.`,
      };
    }
    // End-approaching — תפילה
    const minutesToTfillaGRA = minutesUntil(sofTfillaGRA, now);
    if (minutesToTfillaGRA !== null && minutesToTfillaGRA > 0 && minutesToTfillaGRA <= URGENT_WINDOW_MIN) {
      return {
        level: 'urgent',
        title: `סוף זמן תפילה בעוד ${minutesToTfillaGRA} ${minutesToTfillaGRA === 1 ? 'דקה' : 'דקות'}`,
        body: `גר״א: ${fmt(sofTfillaGRA)} · מג״א: ${fmt(sofTfillaMA)}.`,
      };
    }
    // Past sof zman Shma — but תפילה still ok
    if (sofShmaGRA && now > sofShmaGRA && (!sofTfillaGRA || now <= sofTfillaGRA)) {
      return {
        level: 'warn',
        title: 'סוף זמן ק״ש עבר',
        body: `אפשר עוד להתפלל עד ${fmt(sofTfillaGRA)} (סוף זמן תפילה).`,
      };
    }
    // Past sof zman Tfilla
    if (sofTfillaGRA && now > sofTfillaGRA) {
      return {
        level: 'warn',
        title: 'סוף זמן תפילה עבר',
        body: 'מתפללים תשלומין במנחה — שתי עמידות.',
      };
    }
    return null;
  }

  if (kind === 'mincha') {
    const minchaG = zmanim.minchaGedola;
    const shkia = zmanim.sunset;

    // Before mincha gedola — block. State when it begins and ends.
    if (minchaG && now < minchaG) {
      return {
        level: 'warn',
        title: 'זמן מנחה עוד לא הגיע',
        body: `מנחה גדולה ב-${fmt(minchaG)} · שקיעה (סוף הזמן) ב-${fmt(shkia)}.`,
      };
    }
    // Approaching shkia
    const minutesToShkia = minutesUntil(shkia, now);
    if (minutesToShkia !== null && minutesToShkia > 0 && minutesToShkia <= URGENT_WINDOW_MIN) {
      return {
        level: 'urgent',
        title: `סוף זמן מנחה בעוד ${minutesToShkia} ${minutesToShkia === 1 ? 'דקה' : 'דקות'}`,
        body: `שקיעה ב-${fmt(shkia)}.`,
      };
    }
    // After shkia — inform only, no halachic ruling.
    if (shkia && now > shkia) {
      return {
        level: 'warn',
        title: 'שימו לב — השקיעה כבר עברה',
        body: `השקיעה היתה ב-${fmt(shkia)}.`,
      };
    }
    return null;
  }

  if (kind === 'maariv') {
    const plag = zmanim.plagHaMincha;
    const tzeit = zmanim.tzeit18min;
    // Sof zman maariv = alot haShachar of the NEXT day.
    // hebcal computes alot for the date we pass; we want tomorrow's alot.
    // Approximation: tomorrow's alot ≈ today's alot + 24h (good to ~1 minute).
    const alotTomorrow = zmanim.alotHaShachar
      ? new Date(zmanim.alotHaShachar.getTime() + 24 * 60 * 60 * 1000)
      : null;

    // Before plag — too early.  Tell user when both options begin.
    if (plag && now < plag) {
      return {
        level: 'warn',
        title: 'זמן מעריב עוד לא הגיע',
        body: `המתפללים מפלג המנחה: ${fmt(plag)} · צאת הכוכבים: ${fmt(tzeit)}.`,
      };
    }
    // Between plag and tzeit — informational only, no judgment.
    if (plag && tzeit && now >= plag && now < tzeit) {
      return {
        level: 'info',
        title: 'יש המתפללים מפלג המנחה',
        body: `פלג המנחה היה ב-${fmt(plag)} · צאת הכוכבים ב-${fmt(tzeit)}.`,
      };
    }
    // Approaching alot of next day — sof zman maariv
    const minutesToAlot = minutesUntil(alotTomorrow, now);
    if (minutesToAlot !== null && minutesToAlot > 0 && minutesToAlot <= URGENT_WINDOW_MIN) {
      return {
        level: 'urgent',
        title: `סוף זמן מעריב בעוד ${minutesToAlot} ${minutesToAlot === 1 ? 'דקה' : 'דקות'}`,
        body: `עלות השחר ב-${fmt(alotTomorrow)}.`,
      };
    }
    // Past alot of next morning — too late.
    if (alotTomorrow && now > alotTomorrow) {
      return {
        level: 'warn',
        title: 'עלות השחר כבר עבר',
        body: `זמן מעריב הסתיים בעלות השחר (${fmt(alotTomorrow)}).`,
      };
    }
    return null;
  }

  return null;
}
