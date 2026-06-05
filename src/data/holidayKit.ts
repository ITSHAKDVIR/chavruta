import { HDate, HebrewCalendar, flags, months } from '@hebcal/core';
import { TOOLS_BY_ID, Tool } from './tools';

export type HolidayKit = {
  id: string;
  name: string;
  emoji: string;
  /** Days until the main date. 0 = today / active now. Negative = past. */
  daysUntil: number;
  /** Custom label override (e.g. "ראש חודש כסלו"). If absent, computed from daysUntil. */
  customLabel?: string;
  toolIds: string[];
};

type Def = {
  id: string;
  name: string;
  emoji: string;
  toolIds: string[];
  /** Returns an active kit window or null if not applicable today. */
  compute: (now: Date) => { daysUntil: number; customLabel?: string } | null;
};

const ADAR_FOR_YEAR = (hyear: number) =>
  HDate.isLeapYear(hyear) ? months.ADAR_II : months.ADAR_I;

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Helper: holiday at fixed Hebrew date, with window before + trailing after. */
function staticHoliday(opts: {
  id: string;
  name: string;
  emoji: string;
  toolIds: string[];
  hmonth: (hyear: number) => number;
  hday: number;
  windowBefore: number;
  trailingAfter?: number;
}): Def {
  return {
    id: opts.id,
    name: opts.name,
    emoji: opts.emoji,
    toolIds: opts.toolIds,
    compute: (now: Date) => {
      const hd = new HDate(now);
      const trailing = opts.trailingAfter ?? 0;
      for (const hy of [hd.getFullYear(), hd.getFullYear() + 1]) {
        const target = new HDate(opts.hday, opts.hmonth(hy), hy).greg();
        const days = daysBetween(now, target);
        if (days <= opts.windowBefore && days >= -trailing) return { daysUntil: days };
      }
      return null;
    },
  };
}

const DEFINITIONS: Def[] = [
  // === Holiday preparation kits ===
  staticHoliday({
    id: 'pesach',
    name: 'פסח',
    emoji: '🍷',
    toolIds: ['bedikat-chametz', 'kashering', 'hatarat-nedarim'],
    hmonth: () => months.NISAN,
    hday: 15,
    windowBefore: 21,
    trailingAfter: 8,
  }),
  staticHoliday({
    id: 'rosh-hashana',
    name: 'ראש השנה',
    emoji: '🍯',
    toolIds: ['hatarat-nedarim'],
    hmonth: () => months.TISHREI,
    hday: 1,
    windowBefore: 30,
    trailingAfter: 1,
  }),
  staticHoliday({
    id: 'yom-kippur',
    name: 'יום כיפור',
    emoji: '🕊️',
    toolIds: ['hatarat-nedarim'],
    hmonth: () => months.TISHREI,
    hday: 10,
    windowBefore: 9, // 1-9 Tishrei
    trailingAfter: 0,
  }),
  staticHoliday({
    id: 'sukkot',
    name: 'סוכות',
    emoji: '🌿',
    toolIds: ['arba-minim', 'netilat-arba-minim'],
    hmonth: () => months.TISHREI,
    hday: 15,
    windowBefore: 21,
    trailingAfter: 0,
  }),
  staticHoliday({
    id: 'tu-bishvat',
    name: 'ט"ו בשבט',
    emoji: '🌳',
    toolIds: ['tu-bishvat'],
    hmonth: () => months.SHVAT,
    hday: 15,
    windowBefore: 7,
    trailingAfter: 1,
  }),
  {
    id: 'purim',
    name: 'פורים',
    emoji: '🎭',
    toolIds: ['purim', 'raashan'],
    compute: (now) => {
      const hd = new HDate(now);
      for (const hy of [hd.getFullYear(), hd.getFullYear() + 1]) {
        const target = new HDate(14, ADAR_FOR_YEAR(hy), hy).greg();
        const days = daysBetween(now, target);
        if (days <= 14 && days >= -1) return { daysUntil: days };
      }
      return null;
    },
  },

  // === Active-period kits ===

  // Sefirat HaOmer: from 16 Nisan, 49 days. Shows during the count.
  {
    id: 'sefirat-haomer',
    name: 'ספירת העומר',
    emoji: '🌾',
    toolIds: ['omer'],
    compute: (now) => {
      const hd = new HDate(now);
      for (const hy of [hd.getFullYear(), hd.getFullYear() + 1]) {
        const start = new HDate(16, months.NISAN, hy).greg();
        const days = daysBetween(now, start); // negative or zero = within count if start ≤ today
        if (days <= 0 && days >= -49) {
          const omerDay = -days + 1; // day 1 starts on 16 Nisan
          return { daysUntil: 0, customLabel: `יום ${omerDay} בעומר` };
        }
      }
      return null;
    },
  },

  // Elul + Selichot: full month of Elul (Sephardi from 1 Elul, Ashkenazi from week before R"H).
  // Conservative: show entire Elul.
  {
    id: 'elul-selichot',
    name: 'סליחות (חודש אלול)',
    emoji: '🍂',
    toolIds: ['selichot'],
    compute: (now) => {
      const hd = new HDate(now);
      if (hd.getMonth() === months.ELUL) {
        return { daysUntil: 0, customLabel: `אלול - ימי תשובה ורחמים` };
      }
      return null;
    },
  },

  // Erev Yom Kippur (9 Tishrei): kaparot
  {
    id: 'erev-yom-kippur',
    name: 'ערב יום כיפור',
    emoji: '🐓',
    toolIds: ['kaparot'],
    compute: (now) => {
      const hd = new HDate(now);
      if (hd.getMonth() === months.TISHREI && hd.getDate() === 9) {
        return { daysUntil: 0, customLabel: 'היום - כפרות' };
      }
      return null;
    },
  },

  // Sukkot active period (15-21 Tishrei): hoshanot
  {
    id: 'sukkot-active',
    name: 'חג הסוכות',
    emoji: '🌿',
    toolIds: ['hoshanot', 'netilat-arba-minim'],
    compute: (now) => {
      const hd = new HDate(now);
      if (hd.getMonth() === months.TISHREI && hd.getDate() >= 15 && hd.getDate() <= 21) {
        const dayInChag = hd.getDate() - 14;
        return { daysUntil: 0, customLabel: `יום ${dayInChag} של החג` };
      }
      return null;
    },
  },

  // Hallel days handled via the siddur (tfilon). No separate kit needed.
  // Rosh Chodesh marker only - to display "ראש חודש" header without tools.
  {
    id: 'rosh-chodesh',
    name: 'ראש חודש',
    emoji: '🌙',
    toolIds: [], // intentionally empty — kit only shows label; no tool cards
    compute: (now) => {
      const hd = new HDate(now);
      const isFirstDay = hd.getDate() === 1;
      const isThirtyDay = hd.getDate() === 30;
      if (!isFirstDay && !isThirtyDay) return null;
      const monthName = isThirtyDay ? nextMonthName(hd) : hebMonthName(hd.getMonth(), hd.getFullYear());
      return { daysUntil: 0, customLabel: `ראש חודש ${monthName}` };
    },
  },

  // Hallel-day placeholder kept for back-compat but with no tools.
  {
    id: 'hallel-day',
    name: 'הלל',
    emoji: '🎵',
    toolIds: [],
    compute: (now) => {
      const hd = new HDate(now);
      if (hd.getDate() === 1 || hd.getDate() === 30) return null;
      const evs = HebrewCalendar.calendar({ start: hd, end: hd, il: true });
      const hasHallel = evs.some((ev) => {
        const f = ev.getFlags();
        const desc = ev.getDesc();
        if (f & flags.CHAG) return true;
        if (/Chanukah|Pesach|Sukkot|Shavuot|Shmini Atzeret|Yom HaAtzma|Yom Yerushalayim/i.test(desc)) return true;
        return false;
      });
      if (!hasHallel) return null;
      return { daysUntil: 0, customLabel: 'יום שאומרים בו הלל' };
    },
  },

  // Motzaei Shabbat: Saturday all day (for prep) + Sunday early morning fallback
  {
    id: 'motzaei-shabbat',
    name: 'מוצאי שבת',
    emoji: '🌃',
    toolIds: ['motzaei-shabbat'],
    compute: (now) => {
      const day = now.getDay();
      const hour = now.getHours();
      if (day === 6) {
        // Saturday — havdalah tonight. Earlier in the day = prep, evening = action.
        return { daysUntil: 0, customLabel: hour >= 15 ? 'הערב - הבדלה' : 'הערב - מוצאי שבת' };
      }
      if (day === 0 && hour < 6) {
        // Early Sunday morning — for someone who hasn't done havdalah yet
        return { daysUntil: 0, customLabel: 'הבדלה (אם טרם נאמרה)' };
      }
      return null;
    },
  },

  // Eruv Tavshilin: when Yom Tov falls on Friday (so Shabbat follows).
  // Done on Erev Yom Tov (Thursday in this case).
  {
    id: 'eruv-tavshilin',
    name: 'עירוב תבשילין',
    emoji: '🍞',
    toolIds: ['eruv-tavshilin'],
    compute: (now) => {
      // Today must be a day where we should make eruv: erev yom tov that falls on Friday,
      // or erev yom tov when yom tov is Thursday+Friday (2-day chag continuing into Shabbat).
      // Simple heuristic: today + 1 is a Yom Tov AND (today+1).getDay() is Friday,
      // OR today + 1 is Yom Tov on Thursday and (today+2) is Yom Tov on Friday.
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
      const tmEvs = HebrewCalendar.calendar({ start: new HDate(tomorrow), end: new HDate(tomorrow), il: true });
      const daEvs = HebrewCalendar.calendar({ start: new HDate(dayAfter), end: new HDate(dayAfter), il: true });
      const tmIsYT = tmEvs.some((ev) => ev.getFlags() & (flags.CHAG | flags.LIGHT_CANDLES | flags.LIGHT_CANDLES_TZEIS));
      const daIsYT = daEvs.some((ev) => ev.getFlags() & (flags.CHAG | flags.LIGHT_CANDLES | flags.LIGHT_CANDLES_TZEIS));
      const tmIsFri = tomorrow.getDay() === 5;
      const tmIsThu = tomorrow.getDay() === 4;
      // Case A: tomorrow is YT and it's Friday (one-day YT going into Shabbat)
      if (tmIsYT && tmIsFri) return { daysUntil: 0, customLabel: 'היום - לפני יום טוב שחל ביום שישי' };
      // Case B: tomorrow is YT (Thu) and day-after is YT (Fri) → 2-day chag into Shabbat
      if (tmIsYT && tmIsThu && daIsYT) return { daysUntil: 0, customLabel: 'היום - לפני יום טוב שחל בחמישי-שישי' };
      return null;
    },
  },
];

function hebMonthName(hmonth: number, hyear: number): string {
  // Use HDate to render the month name in Hebrew
  try {
    const hd = new HDate(1, hmonth, hyear);
    const rendered = hd.renderGematriya();
    const parts = rendered.split(' ');
    return parts[1] || '';
  } catch {
    return '';
  }
}

function nextMonthName(hd: HDate): string {
  // The 30th day of one month is also Rosh Chodesh of the next.
  const last = HDate.daysInMonth(hd.getMonth(), hd.getFullYear());
  if (hd.getDate() !== last) return hebMonthName(hd.getMonth(), hd.getFullYear());
  const nextGreg = new Date(hd.greg().getTime() + 86_400_000);
  const next = new HDate(nextGreg);
  return hebMonthName(next.getMonth(), next.getFullYear());
}

export function getActiveHolidayKits(now: Date = new Date(), maxResults = 3): HolidayKit[] {
  const candidates: HolidayKit[] = [];
  for (const def of DEFINITIONS) {
    const w = def.compute(now);
    if (!w) continue;
    candidates.push({
      id: def.id,
      name: def.name,
      emoji: def.emoji,
      daysUntil: w.daysUntil,
      customLabel: w.customLabel,
      toolIds: def.toolIds,
    });
  }
  // Sort: active now (daysUntil=0) first, then upcoming by closeness, then past
  candidates.sort((a, b) => {
    const aActive = a.daysUntil === 0 ? 0 : 1;
    const bActive = b.daysUntil === 0 ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    if (a.daysUntil >= 0 && b.daysUntil < 0) return -1;
    if (b.daysUntil >= 0 && a.daysUntil < 0) return 1;
    return Math.abs(a.daysUntil) - Math.abs(b.daysUntil);
  });
  return candidates.slice(0, maxResults);
}

export function formatDaysUntil(daysUntil: number, customLabel?: string): string {
  if (customLabel) return customLabel;
  if (daysUntil === 0) return 'היום';
  if (daysUntil === 1) return 'מחר';
  if (daysUntil === 2) return 'מחרתיים';
  if (daysUntil > 0) return `עוד ${daysUntil} ימים`;
  if (daysUntil === -1) return 'אתמול';
  return `${Math.abs(daysUntil)} ימים אחרי`;
}

export function toolsForKit(kit: HolidayKit): Tool[] {
  return kit.toolIds.map((id) => TOOLS_BY_ID[id]).filter(Boolean);
}
