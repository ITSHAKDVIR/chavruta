import { DafYomi, MishnaYomiIndex, yerushalmiYomi, vilna, dailyPsalms, chofetzChaim, shemiratHaLashon } from '@hebcal/learning';
import { HDate, HebrewCalendar, Sedra } from '@hebcal/core';
import { getJSON, setJSON } from '../storage/storage';

const CACHE_KEY = '@yahadut/sefaria-cache';

export type SefariaText = {
  ref: string;
  heRef: string;
  heText: string[];
  url: string;
};

const TRACTATE_TO_EN: Record<string, string> = {
  'ברכות': 'Berakhot', 'שבת': 'Shabbat', 'עירובין': 'Eruvin', 'פסחים': 'Pesachim',
  'שקלים': 'Shekalim', 'יומא': 'Yoma', 'סוכה': 'Sukkah', 'ביצה': 'Beitzah',
  'ראש השנה': 'Rosh_Hashanah', 'תענית': 'Taanit', 'מגילה': 'Megillah', 'מועד קטן': 'Moed_Katan',
  'חגיגה': 'Chagigah', 'יבמות': 'Yevamot', 'כתובות': 'Ketubot', 'נדרים': 'Nedarim',
  'נזיר': 'Nazir', 'סוטה': 'Sotah', 'גיטין': 'Gittin', 'קידושין': 'Kiddushin',
  'בבא קמא': 'Bava_Kamma', 'בבא מציעא': 'Bava_Metzia', 'בבא בתרא': 'Bava_Batra',
  'סנהדרין': 'Sanhedrin', 'מכות': 'Makkot', 'שבועות': 'Shevuot', 'עבודה זרה': 'Avodah_Zarah',
  'הוריות': 'Horayot', 'זבחים': 'Zevachim', 'מנחות': 'Menachot', 'חולין': 'Chullin',
  'בכורות': 'Bekhorot', 'ערכין': 'Arakhin', 'תמורה': 'Temurah', 'כריתות': 'Keritot',
  'מעילה': 'Meilah', 'נדה': 'Niddah',
};

type Cache = Record<string, { ts: number; data: SefariaText }>;

async function loadCache(): Promise<Cache> {
  return getJSON<Cache>(CACHE_KEY, {});
}

async function saveCache(c: Cache): Promise<void> {
  await setJSON(CACHE_KEY, c);
}

export async function fetchSefariaText(ref: string): Promise<SefariaText | null> {
  const cache = await loadCache();
  const cached = cache[ref];
  if (cached && Date.now() - cached.ts < 30 * 86_400_000) {
    return cached.data;
  }
  try {
    const url = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(ref)}?version=hebrew`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: any = await res.json();
    const raw = json.versions?.[0]?.text;
    const text = Array.isArray(raw) ? flatten(raw) : typeof raw === 'string' && raw ? [raw] : [];
    const data: SefariaText = {
      ref: json.ref || ref,
      heRef: json.heRef || ref,
      heText: text,
      url: `https://www.sefaria.org/${ref.replace(/\s/g, '_')}?lang=he`,
    };
    cache[ref] = { ts: Date.now(), data };
    await saveCache(cache);
    return data;
  } catch {
    return null;
  }
}

function flatten(arr: any[]): string[] {
  const out: string[] = [];
  for (const item of arr) {
    if (typeof item === 'string') out.push(item);
    else if (Array.isArray(item)) out.push(...flatten(item));
  }
  return out;
}

const HTML_ENTITIES: Record<string, string> = {
  '&thinsp;': ' ',
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hellip;': '…',
  '&shy;': '',
  '&zwnj;': '',
  '&zwj;': '',
  '&lrm;': '',
  '&rlm;': '',
};

export function cleanSefariaText(text: string): string {
  if (!text) return '';
  let out = text;
  out = out.replace(/<[^>]*>/g, '');
  out = out.replace(/&(thinsp|nbsp|amp|quot|#39|apos|lt|gt|ndash|mdash|hellip|shy|zwnj|zwj|lrm|rlm);/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? '');
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
  out = out.replace(/[​-‏‪-‮]/g, '');
  return out.trim();
}

function tractateToEnglish(heName: string): string {
  return TRACTATE_TO_EN[heName] || heName;
}

const mishnaIndex = new MishnaYomiIndex();

export function refForCycle(cycleId: string, date: Date = new Date()): string | null {
  const hd = new HDate(date);
  try {
    switch (cycleId) {
      case 'dafyomi': {
        const daf = new DafYomi(date);
        return `${tractateToEnglish(daf.getName())}.${daf.getBlatt()}a`;
      }
      case 'mishnayomit': {
        const m = mishnaIndex.lookup(date);
        if (!m || m.length === 0) return null;
        const first = m[0];
        const last = m[m.length - 1];
        const tract = first.k.replace(/\s/g, '_');
        if (m.length > 1 && first.k === last.k) {
          return `Mishnah_${tract}.${first.v}-${last.v}`;
        }
        return `Mishnah_${tract}.${first.v}`;
      }
      case 'tehillim-chodesh': {
        const range = dailyPsalms(date);
        return `Psalms.${range[0]}`;
      }
      case 'yerushalmi': {
        const r = yerushalmiYomi(date, vilna);
        if (!r) return null;
        return `Jerusalem_Talmud_${r.name.replace(/\s/g, '_')}.${r.blatt}a`;
      }
      case 'chofetzchaim':
      case 'shemirat-halashon':
        // These are "complex texts" on Sefaria that the V3 API doesn't support via simple ref.
        // Return null so the reader shows an "open in Sefaria" link instead.
        return null;
      case 'parsha':
      case 'shnayim': {
        try {
          const sedra = new Sedra(hd.getFullYear(), true);
          const result = sedra.lookup(hd);
          if (!result || !result.parsha || result.parsha.length === 0) return null;
          const PARSHA_REF: Record<string, string> = {
            'Bereshit': 'Genesis.1', 'Noach': 'Genesis.6.9', 'Lech-Lecha': 'Genesis.12', 'Vayera': 'Genesis.18',
            'Chayei Sara': 'Genesis.23', 'Toldot': 'Genesis.25.19', 'Vayetzei': 'Genesis.28.10', 'Vayishlach': 'Genesis.32.4',
            'Vayeshev': 'Genesis.37', 'Miketz': 'Genesis.41', 'Vayigash': 'Genesis.44.18', 'Vayechi': 'Genesis.47.28',
            'Shemot': 'Exodus.1', 'Vaera': 'Exodus.6.2', 'Bo': 'Exodus.10', 'Beshalach': 'Exodus.13.17',
            'Yitro': 'Exodus.18', 'Mishpatim': 'Exodus.21', 'Terumah': 'Exodus.25', 'Tetzaveh': 'Exodus.27.20',
            'Ki Tisa': 'Exodus.30.11', 'Vayakhel': 'Exodus.35', 'Pekudei': 'Exodus.38.21',
            'Vayikra': 'Leviticus.1', 'Tzav': 'Leviticus.6', 'Shmini': 'Leviticus.9', 'Tazria': 'Leviticus.12',
            'Metzora': 'Leviticus.14', 'Achrei Mot': 'Leviticus.16', 'Kedoshim': 'Leviticus.19', 'Emor': 'Leviticus.21',
            'Behar': 'Leviticus.25', 'Bechukotai': 'Leviticus.26.3',
            'Bamidbar': 'Numbers.1', 'Nasso': 'Numbers.4.21', "Beha'alotcha": 'Numbers.8', "Sh'lach": 'Numbers.13',
            'Korach': 'Numbers.16', 'Chukat': 'Numbers.19', 'Balak': 'Numbers.22.2', 'Pinchas': 'Numbers.25.10',
            'Matot': 'Numbers.30.2', 'Masei': 'Numbers.33',
            'Devarim': 'Deuteronomy.1', "Va'etchanan": 'Deuteronomy.3.23', 'Eikev': 'Deuteronomy.7.12', "Re'eh": 'Deuteronomy.11.26',
            'Shoftim': 'Deuteronomy.16.18', 'Ki Teitzei': 'Deuteronomy.21.10', 'Ki Tavo': 'Deuteronomy.26',
            'Nitzavim': 'Deuteronomy.29.9', 'Vayeilech': 'Deuteronomy.31', "Ha'azinu": 'Deuteronomy.32',
            'Vezot Haberakhah': 'Deuteronomy.33',
          };
          return PARSHA_REF[result.parsha[0]] ?? null;
        } catch {
          return null;
        }
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export type ParshaInfo = {
  name: string;
  ref: string;
  aliyot: string[];
};

export type CalendarItem = {
  titleEn: string;
  titleHe: string;
  displayValueHe: string;
  ref: string;
  url: string;
  category: string;
};

let _calendarCache: { date: string; items: CalendarItem[] } | null = null;

export async function fetchSefariaCalendar(date: Date = new Date()): Promise<CalendarItem[]> {
  const dateStr = date.toISOString().slice(0, 10);
  if (_calendarCache && _calendarCache.date === dateStr) return _calendarCache.items;
  try {
    const res = await fetch(`https://www.sefaria.org/api/calendars?year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}&diaspora=1`);
    if (!res.ok) return [];
    const json: any = await res.json();
    const items: CalendarItem[] = (json.calendar_items ?? []).map((i: any) => ({
      titleEn: i.title?.en ?? '',
      titleHe: i.title?.he ?? '',
      displayValueHe: i.displayValue?.he ?? i.displayValue?.en ?? '',
      ref: i.ref ?? '',
      url: i.url ?? '',
      category: i.category ?? '',
    }));
    _calendarCache = { date: dateStr, items };
    return items;
  } catch {
    return [];
  }
}

export async function fetchParshaAliyot(date: Date = new Date()): Promise<ParshaInfo | null> {
  try {
    const dateStr = date.toISOString().slice(0, 10);
    const res = await fetch(`https://www.sefaria.org/api/calendars?year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}&diaspora=1`);
    if (!res.ok) return null;
    const json: any = await res.json();
    const parsha = json.calendar_items?.find((i: any) => i.title?.en === 'Parashat Hashavua');
    if (!parsha) return null;
    return {
      name: parsha.displayValue?.he ?? parsha.displayValue?.en ?? '',
      ref: parsha.ref ?? parsha.url ?? '',
      aliyot: parsha.extraDetails?.aliyot ?? [],
    };
  } catch {
    return null;
  }
}

export function sefariaUrlFor(cycleId: string, date: Date = new Date()): string | null {
  if (cycleId === 'chofetzchaim') {
    const r = chofetzChaim(new HDate(date));
    if (!r) return 'https://www.sefaria.org.il/Chafetz_Chaim';
    const sectionMap: Record<string, string> = {
      HilchosLH: 'Chafetz_Chaim%2C_Negative_Commandments',
      HilchosRechilus: 'Chafetz_Chaim%2C_Hilkhot_Rechilut',
      Tziyurim: 'Chafetz_Chaim',
    };
    const section = sectionMap[r.k] ?? 'Chafetz_Chaim';
    return `https://www.sefaria.org.il/${section}.${r.b}?lang=he`;
  }
  if (cycleId === 'shemirat-halashon') {
    return 'https://www.sefaria.org.il/Shemirat_HaLashon?lang=he';
  }
  const ref = refForCycle(cycleId, date);
  if (!ref) return null;
  return `https://www.sefaria.org/${ref}?lang=he`;
}
