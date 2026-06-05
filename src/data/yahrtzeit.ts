import { HDate, months } from '@hebcal/core';

export type Yahrtzeit = {
  id: string;
  hebrewName: string;
  hebrewFatherName: string;
  relationship: string;
  deathHebrewYear: number;
  deathHebrewMonth: number;
  deathHebrewDay: number;
  afterSunset: boolean;
  notes?: string;
  createdAt: number;
};

export const HEBREW_MONTHS: Array<{ value: number; label: string }> = [
  { value: months.NISAN, label: 'ניסן' },
  { value: months.IYYAR, label: 'אייר' },
  { value: months.SIVAN, label: 'סיוון' },
  { value: months.TAMUZ, label: 'תמוז' },
  { value: months.AV, label: 'אב' },
  { value: months.ELUL, label: 'אלול' },
  { value: months.TISHREI, label: 'תשרי' },
  { value: months.CHESHVAN, label: 'חשוון' },
  { value: months.KISLEV, label: 'כסלו' },
  { value: months.TEVET, label: 'טבת' },
  { value: months.SHVAT, label: 'שבט' },
  { value: months.ADAR_I, label: 'אדר א׳' },
  { value: months.ADAR_II, label: 'אדר ב׳' },
];

export const RELATIONSHIPS = [
  'אב',
  'אם',
  'בעל',
  'אישה',
  'בן',
  'בת',
  'אח',
  'אחות',
  'סב',
  'סבתא',
  'דוד',
  'דודה',
  'רב',
  'חמיו',
  'חמותו',
  'אחר',
];

export function findNextYahrtzeit(y: Yahrtzeit, from: Date = new Date()): HDate {
  const fromHd = new HDate(from);
  const curYear = fromHd.getFullYear();
  let candidate = createObservedDate(y, curYear);
  if (candidate.abs() < fromHd.abs()) {
    candidate = createObservedDate(y, curYear + 1);
  }
  return candidate;
}

function isLeap(year: number): boolean {
  return HDate.isLeapYear(year);
}

function createObservedDate(y: Yahrtzeit, observedYear: number): HDate {
  let month = y.deathHebrewMonth;
  let day = y.deathHebrewDay;
  const deathWasLeap = isLeap(y.deathHebrewYear);
  const observedIsLeap = isLeap(observedYear);

  if (deathWasLeap && !observedIsLeap) {
    if (month === months.ADAR_I || month === months.ADAR_II) {
      month = months.ADAR_I;
    }
  } else if (!deathWasLeap && observedIsLeap) {
    if (month === months.ADAR_I) {
      month = months.ADAR_II;
    }
  }

  if ((month === months.CHESHVAN || month === months.KISLEV) && day === 30) {
    const monthLen = HDate.daysInMonth(month, observedYear);
    if (monthLen < 30) {
      month = month === months.CHESHVAN ? months.KISLEV : months.TEVET;
      day = 1;
    }
  }

  return new HDate(day, month, observedYear);
}

export function daysUntil(target: HDate, from: Date = new Date()): number {
  return target.abs() - new HDate(from).abs();
}

export function formatYahrtzeitDate(hd: HDate): string {
  return hd.renderGematriya();
}

export function gregForHDate(hd: HDate): Date {
  return hd.greg();
}
