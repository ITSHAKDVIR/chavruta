import { HDate } from '@hebcal/core';
import {
  DafYomi,
  MishnaYomiIndex,
  MishnaYomiEvent,
  PsalmsEvent,
  ChofetzChaimEvent,
  ShemiratHaLashonEvent,
  YerushalmiYomiEvent,
  vilna,
  dailyPsalms,
  yerushalmiYomi,
  chofetzChaim,
  shemiratHaLashon,
} from '@hebcal/learning';
import { normalizeHebrewLabel } from './hebrewNumbers';
import { fetchSefariaCalendar, CalendarItem } from '../services/sefaria';
import { translateRef } from './refTranslate';
import { getHalachaTodayLabel } from './halachaYomit';

export type LearningCycle = {
  id: string;
  hebrewName: string;
  shortName: string;
  description: string;
  todayLabel: string;
  source?: string;
  /** When true, no in-app reader available - only external Sefaria link */
  externalOnly?: boolean;
  /** Optional direct Sefaria URL (for dynamic calendar items) */
  externalUrl?: string;
};

const mishnaIndex = new MishnaYomiIndex();

function safeLabel(fn: () => string): string {
  try {
    const v = fn();
    if (!v || !v.length) return '—';
    return normalizeHebrewLabel(v);
  } catch {
    return '—';
  }
}

export function getTodayLearning(date: Date = new Date()): LearningCycle[] {
  const hd = new HDate(date);
  const cycles: LearningCycle[] = [];

  const HE = 'he-x-NoNikud';

  const weekdayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי (שבת)'];
  const dayOfWeek = date.getDay();
  const aliyahNum = dayOfWeek === 6 ? 7 : dayOfWeek + 1;
  cycles.push({
    id: 'shnayim',
    hebrewName: 'שניים מקרא ואחד תרגום',
    shortName: 'שמו"ת',
    description: 'מעקב שבועי - עליה ביום',
    todayLabel: `היום: עליה ${aliyahNum} - ${weekdayNames[aliyahNum - 1]}`,
    source: 'חומש + תרגום',
  });

  cycles.push({
    id: 'halacha-yomit-kosharot',
    hebrewName: 'הלכה יומית',
    shortName: 'הלכה יומית',
    description: 'הלכה יומית לפי תאריך עברי',
    todayLabel: getHalachaTodayLabel(date),
    source: 'הלכה יומית',
  });

  cycles.push({
    id: 'dafyomi',
    hebrewName: 'דף יומי',
    shortName: 'דף יומי',
    description: 'מחזור בבלי - דף ביום',
    todayLabel: safeLabel(() => {
      const daf = new DafYomi(date);
      return daf.render(HE).replace(/^Daf Yomi:?\s*/, '');
    }),
    source: 'תלמוד בבלי',
  });

  cycles.push({
    id: 'mishnayomit',
    hebrewName: 'משנה יומית',
    shortName: 'משנה',
    description: 'שתי משניות ביום',
    todayLabel: safeLabel(() => {
      const ev = new MishnaYomiEvent(hd, mishnaIndex.lookup(date));
      return ev.render(HE).replace(/^Mishna Yomi:?\s*/, '');
    }),
    source: 'משנה',
  });

  cycles.push({
    id: 'tehillim-chodesh',
    hebrewName: 'תהילים חודשי',
    shortName: 'תהילים',
    description: 'חלוקה לפי ימי החודש',
    todayLabel: safeLabel(() => {
      const ev = new PsalmsEvent(hd, dailyPsalms(date));
      return ev.render(HE).replace(/^Daily Tehillim:?\s*/, '');
    }),
    source: 'ספר תהילים',
  });

  cycles.push({
    id: 'yerushalmi',
    hebrewName: 'דף יומי ירושלמי',
    shortName: 'ירושלמי',
    description: 'מחזור ירושלמי - דף ביום',
    todayLabel: safeLabel(() => {
      const reading = yerushalmiYomi(date, vilna);
      if (!reading) return 'אין דף היום';
      const ev = new YerushalmiYomiEvent(hd, reading);
      return ev.render(HE).replace(/^Yerushalmi(:?|\sYomi:?)\s*/, '');
    }),
    source: 'תלמוד ירושלמי',
  });

  cycles.push({
    id: 'chofetzchaim',
    hebrewName: 'חפץ חיים יומי',
    shortName: 'חפץ חיים',
    description: 'לימוד יומי בהלכות שמירת הלשון',
    todayLabel: safeLabel(() => {
      const reading = chofetzChaim(hd);
      const ev = new ChofetzChaimEvent(hd, reading);
      return ev.render(HE).replace(/^Chofetz Chaim:?\s*/, '');
    }),
    source: 'חפץ חיים',
    externalOnly: true,
  });

  cycles.push({
    id: 'shemirat-halashon',
    hebrewName: 'שמירת הלשון',
    shortName: 'שמ"ה',
    description: 'לימוד יומי בספר שמירת הלשון',
    todayLabel: safeLabel(() => {
      const reading = shemiratHaLashon(hd);
      const ev = new ShemiratHaLashonEvent(hd, reading);
      return ev.render(HE).replace(/^Shemirat HaLashon:?\s*/, '');
    }),
    source: 'שמירת הלשון',
    externalOnly: true,
  });

  cycles.push({
    id: 'parsha',
    hebrewName: 'פרשת השבוע',
    shortName: 'פרשה',
    description: 'לימוד יומי בפרשה',
    todayLabel: 'פרשה + רש"י',
    source: 'חומש',
  });

  return cycles;
}

const SEFARIA_CYCLE_MAP: Record<string, { id: string; hebrewName: string; shortName: string; description: string; source: string }> = {
  'Daily Rambam': {
    id: 'rambam-1',
    hebrewName: 'רמב"ם יומי',
    shortName: 'רמב"ם',
    description: 'פרק אחד במשנה תורה ביום',
    source: 'משנה תורה',
  },
  'Daily Rambam (3 Chapters)': {
    id: 'rambam-3',
    hebrewName: 'רמב"ם יומי (ג׳ פרקים)',
    shortName: 'רמב"ם ג׳',
    description: 'שלושה פרקים במשנה תורה ביום',
    source: 'משנה תורה',
  },
  'Halakhah Yomit': {
    id: 'halacha-yomit',
    hebrewName: 'הלכה יומית',
    shortName: 'הלכה',
    description: 'הלכה יומית מהשולחן ערוך',
    source: 'שולחן ערוך',
  },
  'Arukh HaShulchan Yomi': {
    id: 'arukh-hashulchan',
    hebrewName: 'ערוך השולחן היומי',
    shortName: 'ערוה"ש',
    description: 'לימוד יומי בספר ערוך השולחן',
    source: 'ערוך השולחן',
  },
  'Tanya Yomi': {
    id: 'tanya',
    hebrewName: 'תניא יומי',
    shortName: 'תניא',
    description: 'לימוד יומי בספר התניא',
    source: 'תניא',
  },
  'Daf a Week': {
    id: 'daf-week',
    hebrewName: 'דף השבוע',
    shortName: 'דף שבוע',
    description: 'דף תלמוד בשבוע',
    source: 'תלמוד בבלי',
  },
  'Tanakh Yomi': {
    id: 'tanakh-yomi',
    hebrewName: 'תנ"ך יומי',
    shortName: 'תנ"ך',
    description: 'פרק תנ"ך יומי',
    source: 'תנ"ך',
  },
  Haftarah: {
    id: 'haftarah',
    hebrewName: 'הפטרת השבוע',
    shortName: 'הפטרה',
    description: 'הפטרת פרשת השבוע',
    source: 'נביאים',
  },
  'Nach Yomi': {
    id: 'nach-yomi',
    hebrewName: 'נ"ך יומי',
    shortName: 'נ"ך',
    description: 'פרק יומי בנביאים וכתובים (~2 שנים)',
    source: 'נביאים וכתובים',
  },
  '929': {
    id: '929',
    hebrewName: '929 - תנ"ך יומי',
    shortName: '929',
    description: 'פרק תנ"ך ביום, 5 ימים בשבוע, מחזור 3.5 שנים',
    source: 'תנ"ך',
  },
  'Chok LeYisrael': {
    id: 'chok-leyisrael',
    hebrewName: 'חק לישראל',
    shortName: 'חק',
    description: 'קטעי חומש, נביאים, כתובים, משנה, גמרא, זוהר וספר המוסר ביום',
    source: 'חק לישראל',
  },
};

export type HalachaBook = {
  id: string;
  hebrewName: string;
  author: string;
  description: string;
  url: string;
};

/** Contemporary / classic halacha books available for browsing on Sefaria.
 *  No daily cycle - direct link to the book on Sefaria. */
export const HALACHA_BOOKS: HalachaBook[] = [
  {
    id: 'mishnah-berurah',
    hebrewName: 'משנה ברורה',
    author: 'החפץ חיים',
    description: 'ביאור על שולחן ערוך אורח חיים',
    url: 'https://www.sefaria.org.il/Mishnah_Berurah?lang=he',
  },
  {
    id: 'ben-ish-hai',
    hebrewName: 'בן איש חי',
    author: 'הרב יוסף חיים מבגדאד',
    description: 'הלכות לפי סדר הפרשיות',
    url: 'https://www.sefaria.org.il/Ben_Ish_Hai?lang=he',
  },
  {
    id: 'kitzur-shulchan-arukh',
    hebrewName: 'קצור שולחן ערוך',
    author: 'הרב שלמה גנצפריד',
    description: 'תמצית השולחן ערוך לכל יום',
    url: 'https://www.sefaria.org.il/Kitzur_Shulchan_Arukh?lang=he',
  },
  {
    id: 'chayei-adam',
    hebrewName: 'חיי אדם',
    author: 'הרב אברהם דנציג',
    description: 'הלכות שבת, מועדים וברכות',
    url: 'https://www.sefaria.org.il/Chayei_Adam?lang=he',
  },
  {
    id: 'kaf-hachaim',
    hebrewName: 'כף החיים',
    author: 'הרב יעקב חיים סופר',
    description: 'הלכות אורח חיים ויורה דעה',
    url: 'https://www.sefaria.org.il/Kaf_HaChaim?lang=he',
  },
  {
    id: 'arukh-hashulchan-full',
    hebrewName: 'ערוך השולחן',
    author: 'הרב יחיאל מיכל אפשטיין',
    description: 'כל ארבעת חלקי השולחן ערוך',
    url: 'https://www.sefaria.org.il/Arukh_HaShulchan?lang=he',
  },
];

export async function fetchSefariaCycles(date: Date = new Date()): Promise<LearningCycle[]> {
  const items = await fetchSefariaCalendar(date);
  const byId = new Map<string, LearningCycle>();
  for (const item of items) {
    const map = SEFARIA_CYCLE_MAP[item.titleEn];
    if (!map) continue;
    const refForUrl = (item.url || item.ref || '').replace(/\s/g, '_');
    const label = item.displayValueHe || translateRef(item.ref) || '—';
    const url = refForUrl ? `https://www.sefaria.org.il/${refForUrl}?lang=he` : undefined;
    const existing = byId.get(map.id);
    if (existing) {
      // Same cycle appeared twice today (e.g. Rambam crossing books).
      // Combine display labels; keep the first URL for the external link.
      existing.todayLabel = `${existing.todayLabel} · ${label}`;
    } else {
      byId.set(map.id, {
        id: map.id,
        hebrewName: map.hebrewName,
        shortName: map.shortName,
        description: map.description,
        source: map.source,
        todayLabel: label,
        externalOnly: true,
        externalUrl: url,
      });
    }
  }
  return Array.from(byId.values());
}

export type LearnedEntry = {
  cycleId: string;
  dateISO: string;
  label: string;
};

export function entryKey(cycleId: string, dateISO: string): string {
  return `${cycleId}::${dateISO}`;
}

export function todayISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
