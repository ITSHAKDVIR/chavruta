import { HDate } from '@hebcal/core';

export type Cycle = {
  id: string;
  startDate: string;
  endDate?: string;
};

export type CalcResult = {
  hefsekTaharaSephardi: Date;
  hefsekTaharaAshkenazi: Date;
  sevenCleanEnd: Date;
  mikvehNight: Date;
  onahBenonit: Date;
  onahChodeshHebrew: Date;
  haflagah?: { date: Date; gap: number };
  nextPrishahDates: Date[];
};

const DAY = 86_400_000;

export function calculate(currentStart: Date, previousStart?: Date | null): CalcResult {
  const hd = new HDate(currentStart);

  const hefsekTaharaSephardi = new Date(currentStart.getTime() + 4 * DAY);
  const hefsekTaharaAshkenazi = new Date(currentStart.getTime() + 4 * DAY);
  const sevenCleanEnd = new Date(hefsekTaharaSephardi.getTime() + 7 * DAY);
  const mikvehNight = new Date(sevenCleanEnd.getTime() + DAY);

  const onahBenonit = new Date(currentStart.getTime() + 30 * DAY);

  const onahChodeshHebrew = new HDate(hd.getDate(), hd.getMonth() + 1, hd.getFullYear()).greg();

  const result: CalcResult = {
    hefsekTaharaSephardi,
    hefsekTaharaAshkenazi,
    sevenCleanEnd,
    mikvehNight,
    onahBenonit,
    onahChodeshHebrew,
    nextPrishahDates: [onahBenonit, onahChodeshHebrew],
  };

  if (previousStart) {
    const gap = Math.round((currentStart.getTime() - previousStart.getTime()) / DAY);
    if (gap > 0 && gap < 90) {
      const haflagahDate = new Date(currentStart.getTime() + gap * DAY);
      result.haflagah = { date: haflagahDate, gap };
      result.nextPrishahDates.push(haflagahDate);
    }
  }

  result.nextPrishahDates.sort((a, b) => a.getTime() - b.getTime());

  return result;
}

export function dayBefore(d: Date): Date {
  return new Date(d.getTime() - DAY);
}

export function formatHebrewDate(d: Date): string {
  return new HDate(d).renderGematriya();
}
