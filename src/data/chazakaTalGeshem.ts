import { HDate, months } from '@hebcal/core';

/**
 * Two separate "חזקה" counters per the halacha of needing 90 correct repetitions:
 *
 *   1. "מ"הג" (משיב הרוח ומוריד הגשם / מוריד הטל) - said in ברכת גבורות (2nd bracha).
 *      - Winter form (מ"הג): from מוסף שמיני עצרת (22 Tishrei) → מוסף ראשון של פסח (15 Nisan)
 *      - Summer form: מוריד הטל (בארץ ישראל - כל הנוסחאות) - rest of the year
 *
 *   2. "ברכת השנים" (ותן טל ומטר לברכה / ותן ברכה) - said in ברכת השנים (9th bracha).
 *      - Winter form (ותן טל ומטר): Israel from ז׳ חשון evening; Diaspora from Dec 4-5
 *      - Summer form (ותן ברכה): from מוסף ראשון של פסח until winter
 *
 * Halacha: After 90 consecutive tefillot with the correct form, one is מוחזק.
 *          If they later doubt — assume habit, no need to repeat.
 */

export type GevurotSeason = 'winter' | 'summer';
export type BirkatHashanimSeason = 'winter' | 'summer';

export type SeasonInfo = {
  /** Current season */
  season: GevurotSeason | BirkatHashanimSeason;
  /** When the current season started (Gregorian date, local midnight) */
  startDate: Date;
  /** When the next transition will happen */
  nextTransition: Date;
  /** Hebrew label of what to say now */
  currentText: string;
  /** Hebrew name of the bracha */
  brachaName: string;
};

const TISHREI = months.TISHREI;
const NISAN = months.NISAN;
const CHESHVAN = months.CHESHVAN;

/**
 * Gevurot (משיב הרוח) transitions:
 *   - מ"הג starts: 22 Tishrei (Shemini Atzeret musaf - effectively from that day)
 *   - מ"הג ends: 15 Nisan (Pesach musaf)
 */
export function gevurotSeasonFor(date: Date): SeasonInfo {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const hyear = hd.getFullYear();

  const isWinter =
    (m === TISHREI && d >= 22) ||
    m === 8 /* Cheshvan */ ||
    m === 9 /* Kislev */ ||
    m === 10 /* Tevet */ ||
    m === 11 /* Shvat */ ||
    m === 12 /* Adar I in leap = Adar in non-leap */ ||
    m === 13 /* Adar II */ ||
    (m === NISAN && d < 15);

  if (isWinter) {
    // Winter form: started on 22 Tishrei of this or previous Hebrew year
    const winterStartHyear = m === TISHREI ? hyear : hyear;
    const startHd = new HDate(22, TISHREI, m >= TISHREI || m <= 6 /* future? */ ? winterStartHyear : winterStartHyear);
    // Edge case: if today < 22 Tishrei of current hyear, start was prev year
    let actualStart = new HDate(22, TISHREI, hyear);
    if (actualStart.greg().getTime() > date.getTime()) {
      actualStart = new HDate(22, TISHREI, hyear - 1);
    }
    const nextTransitionHyear = actualStart.getFullYear() + 1;
    const nextTrans = new HDate(15, NISAN, nextTransitionHyear);
    return {
      season: 'winter',
      startDate: actualStart.greg(),
      nextTransition: nextTrans.greg(),
      currentText: 'מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם',
      brachaName: 'גבורות (מחיה מתים)',
    };
  }
  // Summer form: started on 15 Nisan
  let actualStart = new HDate(15, NISAN, hyear);
  if (actualStart.greg().getTime() > date.getTime()) {
    actualStart = new HDate(15, NISAN, hyear - 1);
  }
  // Next transition is 22 Tishrei AFTER the start. Since 22 Tishrei comes
  // earlier in the same Hebrew year than 15 Nisan, we need year + 1.
  const nextTransHyear = actualStart.getFullYear() + 1;
  const nextTrans = new HDate(22, TISHREI, nextTransHyear);
  return {
    season: 'summer',
    startDate: actualStart.greg(),
    nextTransition: nextTrans.greg(),
    currentText: 'מוֹרִיד הַטָּל (לספרדים) / השמטה (לאשכנזים)',
    brachaName: 'גבורות (מחיה מתים)',
  };
}

/**
 * Birkat HaShanim transitions:
 *   - "ותן טל ומטר" winter form:
 *       Israel: from MAARIV of 7 Cheshvan
 *       Diaspora: from Maariv of Dec 4 (or Dec 5 in some years)
 *   - Ends: מוסף ראשון של פסח (15 Nisan)
 */
export function birkatHashanimSeasonFor(date: Date, inIsrael: boolean): SeasonInfo {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const hyear = hd.getFullYear();

  // Compute current-year start of "ותן טל ומטר"
  let startGreg: Date;
  if (inIsrael) {
    // 7 Cheshvan
    let startHd = new HDate(7, CHESHVAN, hyear);
    if (startHd.greg().getTime() > date.getTime()) {
      startHd = new HDate(7, CHESHVAN, hyear - 1);
    }
    startGreg = startHd.greg();
  } else {
    // Diaspora: Dec 4 (Dec 5 in years prior to a Gregorian leap year). Approximation: Dec 4.
    const gYear = date.getFullYear();
    let s = new Date(gYear, 11, 4); // Dec 4
    // If date is before Dec 4, use previous year
    if (s.getTime() > date.getTime()) s = new Date(gYear - 1, 11, 4);
    startGreg = s;
  }

  // Determine if we're in the winter window
  // Winter window: startGreg ≤ today < next Pesach (15 Nisan)
  let pesachHd = new HDate(15, NISAN, hyear);
  while (pesachHd.greg().getTime() <= startGreg.getTime()) {
    pesachHd = new HDate(15, NISAN, pesachHd.getFullYear() + 1);
  }
  const pesachGreg = pesachHd.greg();

  const isWinter = date.getTime() >= startGreg.getTime() && date.getTime() < pesachGreg.getTime();

  if (isWinter) {
    return {
      season: 'winter',
      startDate: startGreg,
      nextTransition: pesachGreg,
      currentText: 'בָּרֵךְ עָלֵינוּ ... וְתֵן טַל וּמָטָר לִבְרָכָה',
      brachaName: 'ברכת השנים',
    };
  }

  // Summer form: started on 15 Nisan
  let summerStartHd = new HDate(15, NISAN, hyear);
  if (summerStartHd.greg().getTime() > date.getTime()) {
    summerStartHd = new HDate(15, NISAN, hyear - 1);
  }
  // Next winter start
  let nextWinter: Date;
  if (inIsrael) {
    const nextH = new HDate(7, CHESHVAN, summerStartHd.getFullYear());
    nextWinter = nextH.greg();
    if (nextWinter.getTime() < date.getTime()) {
      nextWinter = new HDate(7, CHESHVAN, summerStartHd.getFullYear() + 1).greg();
    }
  } else {
    const gYear = date.getFullYear();
    let next = new Date(gYear, 11, 4);
    if (next.getTime() < date.getTime()) next = new Date(gYear + 1, 11, 4);
    nextWinter = next;
  }

  return {
    season: 'summer',
    startDate: summerStartHd.greg(),
    nextTransition: nextWinter,
    currentText: 'בָּרְכֵנוּ ... וְתֵן בְּרָכָה',
    brachaName: 'ברכת השנים',
  };
}

/**
 * Estimate how many tefillot have happened since seasonStart, for the given bracha kind.
 *   - 'gevurot': mentioned in 2nd bracha — said on weekdays AND shabbat/yom tov.
 *     Approximation: 3 tefillot per day.
 *   - 'birkat-hashanim': said only in weekday amidah (not shabbat/YT 7-bracha amidah).
 *     Approximation: 3 tefillot per weekday, 0 per shabbat.
 */
export function tefillotSinceStart(
  seasonStart: Date,
  now: Date,
  bracha: 'gevurot' | 'birkat-hashanim'
): number {
  const startDay = new Date(seasonStart.getFullYear(), seasonStart.getMonth(), seasonStart.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.max(0, Math.round((today.getTime() - startDay.getTime()) / 86_400_000));

  // Walk day by day so we can count Shabbat correctly
  let count = 0;
  const cursor = new Date(startDay);
  for (let i = 0; i < days; i++) {
    const isShabbat = cursor.getDay() === 6;
    if (bracha === 'gevurot') {
      // Weekday: 3 tefillot. Shabbat: 4 (shacharit, mincha, maariv, musaf) — gevurot appears in all.
      count += isShabbat ? 4 : 3;
    } else {
      // birkat-hashanim: only weekday amidah has 9th bracha. Shabbat = 0.
      count += isShabbat ? 0 : 3;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export const CHAZAKA_TARGET = 90;
