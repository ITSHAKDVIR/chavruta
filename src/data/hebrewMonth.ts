import { HDate, months } from '@hebcal/core';

export type HebrewMonthInfo = {
  hyear: number;
  hmonth: number;
  monthName: string;
  daysInMonth: number;
  /** Array of weeks, each is array of 7 days (Sun-Sat). null = empty cell. */
  weeks: Array<Array<{ gregDate: Date; hday: number } | null>>;
};

const HEB_MONTH_NAMES: Record<number, string> = {
  [months.NISAN]: 'ניסן',
  [months.IYYAR]: 'אייר',
  [months.SIVAN]: 'סיון',
  [months.TAMUZ]: 'תמוז',
  [months.AV]: 'אב',
  [months.ELUL]: 'אלול',
  [months.TISHREI]: 'תשרי',
  [months.CHESHVAN]: 'חשון',
  [months.KISLEV]: 'כסלו',
  [months.TEVET]: 'טבת',
  [months.SHVAT]: 'שבט',
  [months.ADAR_I]: 'אדר א׳',
  [months.ADAR_II]: 'אדר ב׳',
};

export function hebrewMonthName(hyear: number, hmonth: number): string {
  // In a non-leap year, ADAR_I is just "אדר"
  if (hmonth === months.ADAR_I && !HDate.isLeapYear(hyear)) return 'אדר';
  return HEB_MONTH_NAMES[hmonth] || '';
}

export function buildHebrewMonth(hyear: number, hmonth: number): HebrewMonthInfo {
  const daysInMonth = HDate.daysInMonth(hmonth, hyear);
  const monthName = hebrewMonthName(hyear, hmonth);
  const weeks: HebrewMonthInfo['weeks'] = [];
  const firstHd = new HDate(1, hmonth, hyear);
  const firstGreg = firstHd.greg();
  const firstWeekday = firstGreg.getDay(); // 0=Sunday
  let week: HebrewMonthInfo['weeks'][number] = new Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const hd = new HDate(d, hmonth, hyear);
    const greg = hd.greg();
    week.push({ gregDate: greg, hday: d });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  while (week.length > 0 && week.length < 7) week.push(null);
  if (week.length === 7) weeks.push(week);
  return { hyear, hmonth, monthName, daysInMonth, weeks };
}

/** Next Hebrew month (handles leap years and year roll-over). */
export function nextHebrewMonth(hyear: number, hmonth: number): { hyear: number; hmonth: number } {
  // Iterate using HDate to be safe
  const lastDay = HDate.daysInMonth(hmonth, hyear);
  const last = new HDate(lastDay, hmonth, hyear);
  const nextGreg = new Date(last.greg().getTime() + 24 * 3600_000);
  const next = new HDate(nextGreg);
  return { hyear: next.getFullYear(), hmonth: next.getMonth() };
}

export function prevHebrewMonth(hyear: number, hmonth: number): { hyear: number; hmonth: number } {
  const first = new HDate(1, hmonth, hyear);
  const prevGreg = new Date(first.greg().getTime() - 24 * 3600_000);
  const prev = new HDate(prevGreg);
  // Go to first of that month
  return { hyear: prev.getFullYear(), hmonth: prev.getMonth() };
}

/** Format year as Hebrew gematria, e.g. 5786 → "ה'תשפ"ו". */
export function hebrewYearString(hyear: number): string {
  // Use HDate's render to get the gematria year
  const hd = new HDate(1, months.TISHREI, hyear);
  // renderGematriya gives "א׳ תשרי תשפ״ו"
  const full = hd.renderGematriya();
  const parts = full.split(' ');
  return parts.slice(2).join(' ');
}
