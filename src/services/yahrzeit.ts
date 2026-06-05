import { HDate, months } from '@hebcal/core';
import { getJSON, setJSON } from '../storage/storage';

export type Yahrzeit = {
  id: string;
  /** Name of the deceased, Hebrew. */
  name: string;
  /** Optional: father's name (for memorial prayers / kaddish lists). */
  parentName?: string;
  /** Relation to the user (Father / Mother / etc.). */
  relation: string;
  /** Hebrew month index (1-13 per hebcal: Nisan=1 ... Adar II = 13). */
  hebMonth: number;
  /** Hebrew day of month (1-30). */
  hebDay: number;
  /** Year of death (Hebrew, optional - useful for "x years since" labels). */
  hebYearOfDeath?: number;
  /** Whether to send eve reminder (sundown of day before). */
  remindEve: boolean;
  /** Whether to send morning reminder. */
  remindMorning: boolean;
  /** Whether user is in 11-month aveilus countdown. */
  aveilusUntil?: string; // ISO date string
};

const KEY = '@yahadut/yahrzeits';

export async function loadYahrzeits(): Promise<Yahrzeit[]> {
  return getJSON<Yahrzeit[]>(KEY, []);
}

export async function saveYahrzeits(list: Yahrzeit[]): Promise<void> {
  await setJSON(KEY, list);
}

/** Reschedule all notifications including yahrzeit reminders. */
async function _kickReschedule() {
  try {
    const { getJSON, Keys } = await import('../storage/storage');
    const { DEFAULT_LOCATIONS } = await import('../data/hebcal');
    const { rescheduleAll } = await import('./notificationsHub');
    const loc = (await getJSON<any>(Keys.location, null)) ?? DEFAULT_LOCATIONS[0];
    await rescheduleAll(loc);
  } catch (e) {
    console.warn('[yahrzeit] reschedule failed:', e);
  }
}

export async function addYahrzeit(y: Omit<Yahrzeit, 'id'>): Promise<Yahrzeit> {
  const list = await loadYahrzeits();
  const yz: Yahrzeit = { ...y, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
  list.push(yz);
  await saveYahrzeits(list);
  _kickReschedule().catch(() => {});
  return yz;
}

export async function deleteYahrzeit(id: string): Promise<void> {
  const list = await loadYahrzeits();
  await saveYahrzeits(list.filter((y) => y.id !== id));
  _kickReschedule().catch(() => {});
}

/** Compute the next Gregorian date when this yahrzeit will fall, starting from `fromDate`. */
export function nextYahrzeitDate(y: Pick<Yahrzeit, 'hebMonth' | 'hebDay'>, fromDate: Date = new Date()): Date {
  const todayHd = new HDate(fromDate);
  let year = todayHd.getFullYear();
  for (let i = 0; i < 5; i++) {
    try {
      const candidate = new HDate(y.hebDay, y.hebMonth, year);
      const greg = candidate.greg();
      if (greg.getTime() >= startOfDay(fromDate).getTime()) {
        return greg;
      }
    } catch {
      // Some months don't exist in this year (Adar II in non-leap, Cheshvan 30 in chaser);
      // fall back to closest valid day.
      try {
        const fallback = adjustToNearestValidDay(y.hebMonth, y.hebDay, year);
        if (fallback) {
          const greg = fallback.greg();
          if (greg.getTime() >= startOfDay(fromDate).getTime()) return greg;
        }
      } catch {}
    }
    year++;
  }
  return fromDate;
}

function adjustToNearestValidDay(month: number, day: number, year: number): HDate | null {
  // Handle Adar II in non-leap year - use Adar I
  if (month === months.ADAR_II && !HDate.isLeapYear(year)) {
    return new HDate(day, months.ADAR_I, year);
  }
  // Cheshvan/Kislev day 30 in chaser/maleh years
  for (let d = day; d >= 1; d--) {
    try {
      return new HDate(d, month, year);
    } catch {
      continue;
    }
  }
  return null;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** Years since death up to the upcoming yahrzeit. */
export function yearsSince(y: Yahrzeit, fromDate: Date = new Date()): number | null {
  if (!y.hebYearOfDeath) return null;
  const next = nextYahrzeitDate(y, fromDate);
  const nextHd = new HDate(next);
  return nextHd.getFullYear() - y.hebYearOfDeath;
}

/** "X days until yahrzeit" for sorting. */
export function daysUntil(y: Yahrzeit, fromDate: Date = new Date()): number {
  const next = nextYahrzeitDate(y, fromDate);
  const ms = next.getTime() - startOfDay(fromDate).getTime();
  return Math.round(ms / 86400000);
}

/** Format hebrew date short label. */
export function hebrewDateLabel(month: number, day: number): string {
  const monthNames: Record<number, string> = {
    [months.NISAN]: 'ניסן',
    [months.IYYAR]: 'אייר',
    [months.SIVAN]: 'סיון',
    [months.TAMUZ]: 'תמוז',
    [months.AV]: 'אב',
    [months.ELUL]: 'אלול',
    [months.TISHREI]: 'תשרי',
    [months.CHESHVAN]: 'חשוון',
    [months.KISLEV]: 'כסלו',
    [months.TEVET]: 'טבת',
    [months.SHVAT]: 'שבט',
    [months.ADAR_I]: 'אדר א׳',
    [months.ADAR_II]: 'אדר ב׳',
  };
  return `${day} ב${monthNames[month] ?? '?'}`;
}

/** Returns true if `aveilusUntil` is in the future relative to `now`. */
export function isInAveilus(y: Yahrzeit, now: Date = new Date()): boolean {
  if (!y.aveilusUntil) return false;
  return new Date(y.aveilusUntil).getTime() > now.getTime();
}

/** Days remaining in the 11-month aveilus period. */
export function aveilusDaysRemaining(y: Yahrzeit, now: Date = new Date()): number | null {
  if (!y.aveilusUntil) return null;
  const ms = new Date(y.aveilusUntil).getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86400000);
}

export const RELATIONS = ['אבא', 'אמא', 'בעל', 'אישה', 'בן', 'בת', 'אח', 'אחות', 'סבא', 'סבתא', 'דוד', 'דודה', 'אחר'];

export const HEB_MONTHS: { value: number; label: string }[] = [
  { value: months.TISHREI, label: 'תשרי' },
  { value: months.CHESHVAN, label: 'חשוון' },
  { value: months.KISLEV, label: 'כסלו' },
  { value: months.TEVET, label: 'טבת' },
  { value: months.SHVAT, label: 'שבט' },
  { value: months.ADAR_I, label: 'אדר א׳' },
  { value: months.ADAR_II, label: 'אדר ב׳' },
  { value: months.NISAN, label: 'ניסן' },
  { value: months.IYYAR, label: 'אייר' },
  { value: months.SIVAN, label: 'סיון' },
  { value: months.TAMUZ, label: 'תמוז' },
  { value: months.AV, label: 'אב' },
  { value: months.ELUL, label: 'אלול' },
];
