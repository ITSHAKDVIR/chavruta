import { HDate, Molad, months } from '@hebcal/core';

const HEBREW_MONTHS_BY_NUM: Record<number, string> = {
  1: 'ניסן', 2: 'אייר', 3: 'סיון', 4: 'תמוז', 5: 'אב', 6: 'אלול',
  7: 'תשרי', 8: 'חשון', 9: 'כסלו', 10: 'טבת', 11: 'שבט',
  12: 'אדר', 13: 'אדר ב׳',
};
const HEBREW_MONTHS_BY_NAME: Record<string, string> = {
  Nisan: 'ניסן', Iyyar: 'אייר', Sivan: 'סיון', Tamuz: 'תמוז',
  Av: 'אב', Elul: 'אלול', Tishrei: 'תשרי', Cheshvan: 'חשון',
  Kislev: 'כסלו', Tevet: 'טבת', "Sh'vat": 'שבט', Shvat: 'שבט',
  'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳', Adar: 'אדר',
};

function toHebrewMonth(month: number, name?: string): string {
  return HEBREW_MONTHS_BY_NUM[month] || (name ? HEBREW_MONTHS_BY_NAME[name] : '') || name || String(month);
}

export type LevanaWindow = {
  monthName: string;
  hyear: number;
  hmonth: number;
  startSefardi: Date;
  startAshkenazi: Date;
  endHalfMolad: Date;
  end15Days: Date;
  moladInstant: Date;
};

function zdtToDate(zdt: { epochMilliseconds: number } | null | undefined): Date | null {
  if (!zdt || typeof zdt.epochMilliseconds !== 'number') return null;
  return new Date(zdt.epochMilliseconds);
}

export function getLevanaWindow(hyear: number, hmonth: number): LevanaWindow | null {
  if (hmonth === months.TISHREI) return null;
  try {
    const molad = new Molad(hyear, hmonth);
    const instant = zdtToDate(molad.getInstant());
    const start3 = zdtToDate(molad.getTchilasZmanKidushLevana3Days());
    const start7 = zdtToDate(molad.getTchilasZmanKidushLevana7Days());
    const endHalf = zdtToDate(molad.getSofZmanKidushLevanaBetweenMoldos());
    const end15 = zdtToDate(molad.getSofZmanKidushLevana15Days());
    if (!instant || !start3 || !start7 || !endHalf || !end15) return null;
    return {
      monthName: toHebrewMonth(hmonth, molad.getMonthName()),
      hyear,
      hmonth,
      moladInstant: instant,
      startSefardi: start3,
      startAshkenazi: start7,
      endHalfMolad: endHalf,
      end15Days: end15,
    };
  } catch {
    return null;
  }
}

export function getCurrentLevanaWindow(now: Date = new Date()): LevanaWindow | null {
  const hd = new HDate(now);
  const hyear = hd.getFullYear();
  const hmonth = hd.getMonth();
  const cur = getLevanaWindow(hyear, hmonth);
  if (cur && now.getTime() <= cur.end15Days.getTime() && now.getTime() >= cur.moladInstant.getTime()) {
    return cur;
  }
  const nextHmonth = hmonth + 1;
  const next = getLevanaWindow(hyear, nextHmonth);
  return next;
}

export type LevanaStatus =
  | { state: 'before-window'; window: LevanaWindow; daysUntil: number }
  | { state: 'in-window-sefardi'; window: LevanaWindow; daysUntilSefardi: number; daysUntilAshkenazi: number; daysLeft: number }
  | { state: 'in-window-ashkenazi'; window: LevanaWindow; daysLeft: number }
  | { state: 'after-window'; window: LevanaWindow; daysSince: number };

export function levanaStatus(now: Date = new Date()): LevanaStatus | null {
  const w = getCurrentLevanaWindow(now);
  if (!w) return null;
  const ms = now.getTime();
  const dayMs = 86_400_000;
  if (ms < w.startSefardi.getTime()) {
    return { state: 'before-window', window: w, daysUntil: Math.ceil((w.startSefardi.getTime() - ms) / dayMs) };
  }
  if (ms >= w.startSefardi.getTime() && ms < w.startAshkenazi.getTime()) {
    return {
      state: 'in-window-sefardi',
      window: w,
      daysUntilSefardi: 0,
      daysUntilAshkenazi: Math.ceil((w.startAshkenazi.getTime() - ms) / dayMs),
      daysLeft: Math.ceil((w.end15Days.getTime() - ms) / dayMs),
    };
  }
  if (ms >= w.startAshkenazi.getTime() && ms <= w.end15Days.getTime()) {
    return {
      state: 'in-window-ashkenazi',
      window: w,
      daysLeft: Math.ceil((w.end15Days.getTime() - ms) / dayMs),
    };
  }
  return { state: 'after-window', window: w, daysSince: Math.floor((ms - w.end15Days.getTime()) / dayMs) };
}
