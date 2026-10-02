/* ─────────────────────────────────────────────────────────────────────────
 * daven-audit.ts — "המתפלל האוטומטי" (v2)
 *
 * Walks EVERY service × EVERY nusach × a calendar of representative days (Israel
 * AND diaspora), and renders each prayer through a FAITHFUL replica of
 * app/tfilon/read.tsx:
 *   leaves:  augmentLeavesForToday → isSectionRelevantToday(service) → prefs
 *   lines:   Song-of-Day filter → Omer filter (tonight) → Maariv ברוך-ה'-לעולם
 *            strip → monolithic Amidah split (+allSmall, Anenu scoping, Chazan
 *            Anenu inject) | Tachanun strip → parseParagraphs
 *   display: shouldRender(active rolled for Maariv) → enhanceConditionalText /
 *            stripInactiveInlineParens — in THREE modes: silent (notes off),
 *            notes on, and the Chazara (repetition) view of the Amidah/Musaf.
 * Then runs STRUCTURAL checks (missing/order/duplication/Tachanun/nusach-mix)
 * and CONTENT checks on the visible words (wrong festival, Shabbat inserts,
 * season, Yaaleh/Al-HaNisim/day-name, AYT inserts, Maariv leaks, Omer count,
 * Nachem, render artifacts, duplicated Amidah paragraphs).
 *
 * Flags SUSPECTS for the posek; it does not pasken.
 *
 * Run:  npx --yes tsx@4.23.15 --tsconfig tsconfig.dump.json siddur-audit/daven-audit.ts [hebrewYear] [--fast]
 * Out:  .siddur-audit-report.md   (ranked, most severe first)
 * ───────────────────────────────────────────────────────────────────────── */
import * as fs from 'fs';
import * as https from 'https';
import { HDate, months } from '@hebcal/core';
import {
  getNodesAtPath, collectLeaves, getHashkamatHaBokerNode, Nusach, FlatLeaf, SiddurNode,
} from '../src/data/siddurTree';
import { augmentLeavesForToday } from '../src/data/siddurAugment';
import { isSectionRelevantToday } from '../src/data/siddurRelevance';
import { shouldHideForPrefs, DEFAULT_SIDDUR_PREFS } from '../src/storage/siddurPrefs';
import {
  parseParagraphs, activeTags, shouldRender, enhanceConditionalText, stripInactiveInlineParens,
  stripLongTachanunSupplication, splitMonolithicAmidah, stripMaarivBaruchHashemLeolam,
} from '../src/services/siddurParser';
import { filterDailyPsalmForToday } from '../src/services/songOfDay';
import { omerDay } from '../src/data/hebcal';
import { ANENU_TEXT } from '../src/data/specialDayContent';
import { setJerusalemPurim } from '../src/data/purimDay';

const prefs = DEFAULT_SIDDUR_PREFS;
const KNOWN_EMPTY_REFS = new Set<string>([
  'Siddur Ashkenaz, Weekday, Minchah, Post Amidah, Vidui and 13 Middot',
  'Siddur Ashkenaz, Weekday, Shacharit, Torah Reading, Reading from Sefer, Prayers for Welfare of the People',
]);
const NIK = /[֑-ׇ]/g;
const strip = (s: string) => (s || '').replace(NIK, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');

type Service = 'shacharit' | 'mincha' | 'maariv';
const SERVICES: Record<Nusach, Record<Service, string[]>> = {
  ashkenazi: { shacharit: ['weekday', 'shacharit'], mincha: ['weekday', 'minchah'], maariv: ['weekday', 'maariv'] },
  sephardi: { shacharit: ['weekday-shacharit'], mincha: ['weekday-mincha'], maariv: ['weekday-maariv'] },
  'edot-mizrach': { shacharit: ['weekday-shacharit'], mincha: ['weekday-mincha'], maariv: ['weekday-arvit'] },
  chabad: { shacharit: ['shacharit'], mincha: ['mincha'], maariv: ['maariv'] },
} as any;
const NUSCHAOT: Nusach[] = ['ashkenazi', 'sephardi', 'edot-mizrach', 'chabad'];

const OTHER_SIDDUR: Record<Nusach, RegExp> = {
  sephardi: /Siddur Edot HaMizrach|Weekday Siddur Chabad/i,
  'edot-mizrach': /Siddur Sefard\b|Weekday Siddur Chabad/i,
  chabad: /Siddur Sefard\b|Siddur Edot HaMizrach/i,
  ashkenazi: /Siddur Sefard\b|Siddur Edot HaMizrach|Weekday Siddur Chabad/i,
} as any;

function chanukahDayOf(date: Date): number {
  const hd = new HDate(date); const m = hd.getMonth(), d = hd.getDate();
  if (m === months.KISLEV && d >= 25) return d - 24;
  if (m === months.TEVET) return (hd.prev().getDate() === 29 ? 5 : 6) + d;
  return 0;
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());

/* ── leaves (replica of read.tsx allLeavesFiltered) ─────────────────────── */
function buildLeaves(nusach: Nusach, slugs: string[], date: Date, il: boolean, service: Service): FlatLeaf[] {
  const { here } = getNodesAtPath(nusach, slugs);
  if (!here) return [];
  let own: FlatLeaf[];
  if ((here as any).ref) own = [{ ref: (here as any).ref, he: here.he, en: here.en, trail: [] }];
  else if ((here as SiddurNode).children) {
    own = collectLeaves(here as SiddurNode);
    if ((nusach === 'sephardi' || nusach === 'edot-mizrach') && /^Weekday Shacharit$/i.test(here.en)) {
      const h = getHashkamatHaBokerNode(nusach); if (h) own = [...collectLeaves(h), ...own];
    }
  } else return [];
  return augmentLeavesForToday(own, here as SiddurNode, nusach, date, il).filter((l) =>
    !KNOWN_EMPTY_REFS.has(l.ref) && !shouldHideForPrefs(l.en, prefs) &&
    !l.trail.some((t) => shouldHideForPrefs(t.en, prefs)) &&
    isSectionRelevantToday(l.en, date, il, l.he, service) &&
    !l.trail.some((t) => !isSectionRelevantToday(t.en, date, il, t.he, service)));
}

/* ── text fetch (cached) ─────────────────────────────────────────────────── */
const cache: Record<string, string[]> = {};
function fetchSefaria(ref: string): Promise<string[]> {
  if (cache[ref]) return Promise.resolve(cache[ref]);
  return new Promise((res) => {
    https.get('https://www.sefaria.org/api/v3/texts/' + encodeURIComponent(ref) + '?version=hebrew', (r) => {
      const ch: Buffer[] = []; r.on('data', (c: Buffer) => ch.push(c)); r.on('end', () => {
        try {
          const j = JSON.parse(Buffer.concat(ch).toString('utf8'));
          const v = j.versions && j.versions[0]; const text = v ? v.text : j.text;
          const flat: string[] = []; const walk = (a: any) => { if (Array.isArray(a)) a.forEach(walk); else if (typeof a === 'string') flat.push(a); };
          walk(text); cache[ref] = flat; res(flat);
        } catch { cache[ref] = []; res([]); }
      });
    }).on('error', () => { cache[ref] = []; res([]); });
  });
}

/* ── replica of read.tsx helpers ─────────────────────────────────────────── */
function filterOmerForToday(lines: string[], omerCount: number | null): string[] {
  if (!omerCount) return lines;
  const bareOf = (l: string) => l.replace(/<[^>]+>/g, '').replace(NIK, '');
  const dayIdx = lines.map((l, i) => ({ i, b: bareOf(l) }))
    .filter(({ b }) => /[לב]ע[ֹו]?מר/.test(b) && !/ספירת/.test(b)).map(({ i }) => i);
  if (dayIdx.length === 0) return lines;
  let keepIdx = -1;
  for (const i of dayIdx) { const m = bareOf(lines[i]).match(/(\d+)\.\s*היום/); if (m && parseInt(m[1], 10) === omerCount) { keepIdx = i; break; } }
  if (keepIdx < 0 && dayIdx.length >= omerCount) keepIdx = dayIdx[omerCount - 1];
  const drop = new Set(dayIdx.filter((i) => i !== keepIdx));
  return lines.filter((_, i) => !drop.has(i));
}
const isMonolithicAmidah = (l: FlatLeaf) =>
  /^(The\s+)?Amid(ah|a)$/i.test(l.en.trim()) || /\bMuss?af\b/i.test(l.en.trim()) ||
  /^Rosh Chodesh$/i.test(l.en.trim()) ||
  /^(עמידה|תפילת עמידה|שמונה עשרה|ראש חודש)$/.test((l.he || '').trim()) ||
  /מוסף/.test((l.he || '').trim());
const isAnenuPara = (p: any) =>
  /עננו\s+\S{1,6}\s+עננו ביום צום|עננו ביום צום תעני/.test((p.body || '').replace(NIK, ''));
const isAmidahTrailLeaf = (l: FlatLeaf) => {
  const t = l.trail.map((x) => `${x.en} ${x.he}`).join(' ');
  return /\bAmid(ah|a)\b|עמידה|שמונה עשרה|Musaf|Mussaf|מוסף/i.test(t) && !/Post[\s-]?Amid|שלאחר.עמידה/i.test(t);
};

type Pseudo = { sec: string; amidah: boolean; paras: any[] };
async function appLeaves(H: FlatLeaf[], date: Date, active: Set<any>): Promise<Pseudo[]> {
  const out: Pseudo[] = [];
  const dow = date.getDay();
  for (const leaf of H) {
    const inline = (leaf as any).inlineHe as string[] | undefined;
    if (inline && inline.length) { out.push({ sec: leaf.he || leaf.en, amidah: isAmidahTrailLeaf(leaf), paras: parseParagraphs(inline) }); continue; }
    let lines = await fetchSefaria(leaf.ref);
    if (!lines.length) continue;
    if (/Song of the Day|שיר של יום|Daily Psalm|Psalm of the Day/i.test(`${leaf.en} ${leaf.he}`)) lines = filterDailyPsalmForToday(lines, dow);
    if (/Sefirat HaOmer|Sefirat Ha'?Omer|ספירת הע[ומ]מר|Omer/i.test(`${leaf.en} ${leaf.he}`)) lines = filterOmerForToday(lines, omerDay(addDays(date, 1)));
    const leafBlob = `${leaf.en} ${leaf.he} ${leaf.trail.map((tr) => `${tr.en} ${tr.he}`).join(' ')}`;
    const inMaariv = /Maariv|Arvit|מעריב|ערבית/i.test(leafBlob);
    const inMincha = /Min(c?h)ah?|מנחה/i.test(leafBlob);
    if (inMaariv) lines = stripMaarivBaruchHashemLeolam(lines);
    if (isMonolithicAmidah(leaf)) {
      const sections = splitMonolithicAmidah(lines);
      if (sections.length >= 6) {
        const allSmall = lines.some((l) => /^\s*<small>/.test(l) && /(מגן אברהם|מחיה ה?מתים|האל הקדוש)/.test(l.replace(NIK, '')));
        const subs: Pseudo[] = sections.map((s: any) => {
          const paras = parseParagraphs(s.lines, { amidah: allSmall });
          const isSK = /^Response to Prayer$/i.test(s.en) || /שומע תפילה|שמע קולנו|קבלת תפילה/.test(s.he);
          const scoped = paras.flatMap((p: any) => {
            if (!isAnenuPara(p)) return [p];
            if (inMaariv) return [];
            if (isSK) return inMincha ? [{ ...p, _chazaraScope: 'silent' }] : [];
            return [{ ...p, _chazaraScope: 'chazara' }];
          });
          return { sec: s.he || s.en, amidah: true, paras: scoped, _en: s.en } as any;
        });
        if (active.has('fast') && !inMaariv) {
          const hasChazan = subs.some((sl) => sl.paras.some((p: any) => p._chazaraScope === 'chazara' && isAnenuPara(p)));
          if (!hasChazan) {
            const g = subs.findIndex((sl: any) => /^Redemption$/i.test(sl._en) || /^גאולה$|גאל ישראל/.test(sl.sec));
            const at = g >= 0 ? g + 1 : subs.findIndex((sl: any) => /^Healing$/i.test(sl._en) || /^רפואה$/.test(sl.sec));
            if (at >= 0) subs.splice(at, 0, { sec: 'עננו (חזרת הש״ץ)', amidah: true,
              paras: [{ body: ANENU_TEXT, kind: 'conditional', marker: 'בתענית ציבור — הש״ץ בחזרה', tags: ['fast'], _chazaraScope: 'chazara' }] });
          }
        }
        out.push(...subs);
        continue;
      }
    }
    const isTach = /^(לשני וחמישי|תחנון|וידוי)$/.test((leaf.he || '').trim()) || /^(Tac?hnun|Tachanun|Vidui)$/i.test(leaf.en.trim());
    if (isTach && dow !== 1 && dow !== 4) lines = stripLongTachanunSupplication(lines);
    let parsed: any[] = parseParagraphs(lines);
    if (parsed.some(isAnenuPara)) {
      const isSK = /Response to Prayer|שומע תפילה|שמע קולנו/.test(leafBlob);
      parsed = parsed.flatMap((p) => {
        if (!isAnenuPara(p)) return [p];
        if (inMaariv) return [];
        if (isSK) return inMincha ? [{ ...p, _chazaraScope: 'silent' }] : [];
        return [{ ...p, _chazaraScope: 'chazara' }];
      });
    }
    out.push({ sec: leaf.he || leaf.en, amidah: isAmidahTrailLeaf(leaf), paras: parsed });
  }
  return out;
}

type Mode = 'silent' | 'notes' | 'chazara';
const MODE_HE: Record<Mode, string> = { silent: 'לחש', notes: 'עם הערות', chazara: 'חזרת הש״ץ' };
type Shown = { sec: string; amidah: boolean; raw: string[]; text: string };
function renderMode(ps: Pseudo[], mode: Mode, active: Set<any>, date: Date, il: boolean, isMaariv: boolean): Shown[] {
  const opts = mode === 'silent' ? { showAll: false, showNotes: false, chazara: false }
    : mode === 'notes' ? { showAll: false, showNotes: true, chazara: false }
      : { showAll: false, showNotes: false, chazara: true };
  const out: Shown[] = [];
  for (const ps1 of ps) {
    if (mode === 'chazara' && !ps1.amidah) continue;
    const raw: string[] = [];
    for (const p of ps1.paras) {
      if (!shouldRender(p, active, opts)) continue;
      if (mode === 'notes' && p.kind === 'halachic-note') continue; // notes mode: audit PRAYER text only
      let body: string;
      if (p.kind === 'conditional' || p.kind === 'alternative') body = (enhanceConditionalText as any)(p, date, il, isMaariv);
      else if (p.kind === 'halachic-note') body = p.body;
      else body = stripInactiveInlineParens(p.body, active);
      if (body && body.trim()) raw.push(body);
    }
    out.push({ sec: ps1.sec, amidah: ps1.amidah, raw, text: raw.map(strip).join('  ') });
  }
  return out;
}

/* ── section detection (structural) ─────────────────────────────────────── */
const trailJoin = (l: FlatLeaf) => l.trail.map((t) => `${t.he} ${t.en}`).join(' ');
const head = (l: FlatLeaf) => `${l.he} ${l.en}`;
const isMusaf = (l: FlatLeaf) => {
  if (/קדיש|kaddish/i.test(head(l))) return false;
  return /musaf|mussaf|מוסף/i.test(trailJoin(l)) || /musaf|mussaf|מוסף/i.test(head(l)) || /Chabad, Rosh Chodesh$/i.test(l.ref);
};
const isHallel = (l: FlatLeaf) =>
  /(^|\s)(הלל|hallel)(\s|$)|ברכת ההלל|הלל שלם|חצי הלל|הלל לראש|full hallel|half hallel|berakhah before the hallel|,\s*Hallel\b/i.test(head(l) + ' ' + trailJoin(l) + ' ' + l.ref);
const isTorahSvc = (l: FlatLeaf) =>
  /torah reading|קריאת התורה|removing the torah|reading from sefer|הוצאת ספר|החזרת ספר|returning sefer/i.test(trailJoin(l) + ' ' + head(l)) ||
  /עלייה|עליה (ראשונה|שניה|שנייה|שלישית|רביעית)|aliyah|ויהי בנסוע|ויחל|vayechal|ויבא עמלק|vayavo|בן עמיהוד|בן חלון|הגבהה|hagbah|לשני וחמישי|for monday|monday.*thursday/i.test(head(l));
const isUva = (l: FlatLeaf) => /ובא לציון|uva le[sz]ion|בית יעקב/i.test(head(l));
const isSong = (l: FlatLeaf) => /song of the day|שיר של יום/i.test(head(l));
const isBarchi = (l: FlatLeaf) => /barchi|ברכי נפשי/i.test(head(l));
const isAleinu = (l: FlatLeaf) => /^\s*(עלינו|al?einu|alenu)\s*$/i.test(l.he.trim()) || /^\s*(al?einu|alenu)\s*$/i.test(l.en.trim());
const isTachanun = (l: FlatLeaf) =>
  /^\s*(תחנון|וידוי)\s*$/.test(l.he.trim()) || /^\s*(tachanun|tachnun|vidui)\s*$/i.test(l.en.trim()) ||
  /נפילת אפי?ים|^וידוי|^והוא רחום$|^שומר ישראל$/.test(l.he.trim()) || /nefilat|^vidui/i.test(l.en.trim());
const firstIdx = (H: FlatLeaf[], p: (l: FlatLeaf) => boolean) => H.findIndex(p);
const lastIdxP = (H: FlatLeaf[], p: (l: FlatLeaf) => boolean) => { for (let i = H.length - 1; i >= 0; i--) if (p(H[i])) return i; return -1; };
const hasP = (H: FlatLeaf[], p: (l: FlatLeaf) => boolean) => H.some(p);
const countBlocks = (H: FlatLeaf[], p: (l: FlatLeaf) => boolean) => { let n = 0, prev = false; for (const l of H) { const m = p(l); if (m && !prev) n++; prev = m; } return n; };

/* ── day matrix ─────────────────────────────────────────────────────────── */
type Feat = { torah?: boolean; musaf?: boolean; hallel?: boolean; barchi?: boolean; noTachanunSh?: boolean };
type Fest = 'pesach' | 'shavuot' | 'sukkot' | 'shminiatzeret' | 'roshhashana';
type Case = {
  id: string; label: string; il: boolean; services: Service[]; feat: Feat;
  minchaNoTachanun?: boolean;
  fest?: Fest; yaaleh?: boolean; alhanisim?: boolean; rcName?: boolean;
  chonantanu?: boolean; omer?: boolean; question?: string;
  jerusalem?: boolean; noAmalek?: boolean;
  dow?: number; notDow?: number[]; leapOnly?: boolean; allowShabbat?: boolean;
  hd: (y: number) => HDate;
};
const noon = (hd: HDate) => { const d = hd.greg(); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0); };
const onOrAfterDow = (hd: HDate, dow: number) => { let h = hd; for (let i = 0; i < 7 && h.greg().getDay() !== dow; i++) h = h.next(); return h; };
const ADAR = (y: number) => (HDate.isLeapYear(y) ? months.ADAR_II : months.ADAR_I);
const NOFRI = [5, 6];

const BASE: Case[] = [
  { id: 'plain-tue', label: 'חול רגיל (ג׳)', il: true, services: ['shacharit', 'mincha', 'maariv'], feat: { noTachanunSh: false }, hd: (y) => onOrAfterDow(new HDate(12, months.CHESHVAN, y), 2) },
  { id: 'plain-mon', label: 'חול — יום ב׳ (קריאת התורה)', il: true, services: ['shacharit'], feat: { torah: true, noTachanunSh: false }, dow: 1, hd: (y) => new HDate(8, months.CHESHVAN, y) },
  { id: 'plain-summer', label: 'חול בקיץ (תמוז)', il: true, services: ['shacharit', 'mincha'], feat: {}, notDow: NOFRI, hd: (y) => new HDate(10, months.TAMUZ, y) },
  { id: 'tal-gap', label: 'בין שמ״ע לז׳ חשון (ד׳ חשון)', il: true, services: ['shacharit', 'mincha'], feat: {}, hd: (y) => new HDate(4, months.CHESHVAN, y) },
  { id: 'tal-25cheshvan', label: 'כ״ה חשון (א״י: ותן טל ומטר)', il: true, services: ['shacharit'], feat: {}, hd: (y) => new HDate(25, months.CHESHVAN, y) },
  { id: 'rc1', label: 'ראש חודש (יום אחד)', il: true, services: ['shacharit', 'mincha'], feat: { torah: true, musaf: true, hallel: true, barchi: true, noTachanunSh: true }, yaaleh: true, rcName: true, hd: (y) => new HDate(1, months.AV, y) },
  { id: 'rc-day1', label: 'ר״ח יומיים — יום א׳ (ל׳)', il: true, services: ['shacharit'], feat: { torah: true, musaf: true, hallel: true, barchi: true, noTachanunSh: true }, yaaleh: true, rcName: true, hd: (y) => new HDate(30, months.CHESHVAN, y) },
  { id: 'rc-day2', label: 'ר״ח יומיים — יום ב׳ (א׳)', il: true, services: ['shacharit'], feat: { torah: true, musaf: true, hallel: true, barchi: true, noTachanunSh: true }, yaaleh: true, rcName: true, hd: (y) => new HDate(1, months.KISLEV, y) },
  { id: 'chm-sukkot', label: 'חול המועד סוכות', il: true, services: ['shacharit', 'mincha'], feat: { torah: true, musaf: true, hallel: true, noTachanunSh: true }, fest: 'sukkot', yaaleh: true, hd: (y) => new HDate(19, months.TISHREI, y) },
  { id: 'hoshana-rabba', label: 'הושענא רבה', il: true, services: ['shacharit'], feat: { torah: true, musaf: true, hallel: true, noTachanunSh: true }, fest: 'sukkot', yaaleh: true, hd: (y) => new HDate(21, months.TISHREI, y) },
  { id: 'isru-chag', label: 'אסרו חג (כ״ג תשרי, א״י)', il: true, services: ['shacharit'], feat: { noTachanunSh: true }, hd: (y) => new HDate(23, months.TISHREI, y) },
  { id: 'chm-pesach', label: 'חול המועד פסח', il: true, services: ['shacharit', 'mincha'], feat: { torah: true, musaf: true, hallel: true, noTachanunSh: true }, fest: 'pesach', yaaleh: true, hd: (y) => new HDate(18, months.NISAN, y) },
  { id: 'erev-pesach', label: 'ערב פסח', il: true, services: ['shacharit'], feat: { noTachanunSh: true }, hd: (y) => new HDate(14, months.NISAN, y) },
  { id: 'chanukah3', label: 'חנוכה (יום ג׳)', il: true, services: ['shacharit', 'mincha'], feat: { torah: true, hallel: true, noTachanunSh: true }, alhanisim: true, hd: (y) => new HDate(27, months.KISLEV, y) },
  { id: 'chanukah8', label: 'חנוכה (יום ח׳)', il: true, services: ['shacharit'], feat: { torah: true, hallel: true, noTachanunSh: true }, alhanisim: true, hd: (y) => new HDate(25, months.KISLEV, y).add(7, 'd') },
  { id: 'chanukah-rc', label: 'חנוכה שחל בר״ח טבת', il: true, services: ['shacharit'], feat: { torah: true, musaf: true, hallel: true, barchi: true, noTachanunSh: true }, yaaleh: true, rcName: true, alhanisim: true, hd: (y) => new HDate(1, months.TEVET, y) },
  { id: 'purim', label: 'פורים', il: true, services: ['shacharit', 'mincha'], feat: { torah: true, noTachanunSh: true }, alhanisim: true, hd: (y) => new HDate(14, ADAR(y), y) },
  { id: 'shushan-purim', label: 'שושן פורים (א״י, מחוץ לירושלים)', il: true, services: ['shacharit'], feat: { noTachanunSh: true }, alhanisim: false, noAmalek: true, hd: (y) => new HDate(15, ADAR(y), y) },
  { id: 'purim-14-jerusalem', label: 'י״ד אדר — מתפלל בירושלים', il: true, jerusalem: true, services: ['shacharit', 'mincha'], feat: { noTachanunSh: true }, alhanisim: false, noAmalek: true, hd: (y) => new HDate(14, ADAR(y), y) },
  { id: 'shushan-purim-jerusalem', label: 'שושן פורים — מתפלל בירושלים', il: true, jerusalem: true, services: ['shacharit', 'mincha'], feat: { torah: true, noTachanunSh: true }, alhanisim: true, hd: (y) => new HDate(15, ADAR(y), y) },
  { id: 'shushan-maariv-jerusalem', label: 'ערבית ליל שושן פורים — מתפלל בירושלים', il: true, jerusalem: true, services: ['maariv'], feat: {}, alhanisim: true, notDow: NOFRI, hd: (y) => new HDate(14, ADAR(y), y) },
  { id: 'purim-maariv-jerusalem', label: 'ערבית ליל י״ד — מתפלל בירושלים', il: true, jerusalem: true, services: ['maariv'], feat: {}, alhanisim: false, notDow: NOFRI, hd: (y) => new HDate(13, ADAR(y), y) },
  { id: 'purim-katan', label: 'פורים קטן', il: true, services: ['shacharit'], feat: { noTachanunSh: true }, alhanisim: false, leapOnly: true, hd: (y) => new HDate(14, months.ADAR_I, y) },
  { id: 'taanit-esther', label: 'תענית אסתר', il: true, services: ['shacharit', 'mincha'], feat: { torah: true }, hd: (y) => new HDate(13, ADAR(y), y) },
  { id: 'tzom-gedalia', label: 'צום גדליה', il: true, services: ['shacharit', 'mincha'], feat: { torah: true }, hd: (y) => new HDate(3, months.TISHREI, y) },
  { id: 'asara-tevet', label: 'עשרה בטבת', il: true, services: ['shacharit', 'mincha', 'maariv'], feat: { torah: true }, notDow: [5], hd: (y) => new HDate(10, months.TEVET, y) },
  { id: '17-tamuz', label: 'י״ז בתמוז', il: true, services: ['shacharit', 'mincha', 'maariv'], feat: { torah: true }, notDow: [5], hd: (y) => new HDate(17, months.TAMUZ, y) },
  { id: 'tisha-bav', label: 'תשעה באב', il: true, services: ['shacharit', 'mincha'], feat: { torah: true, noTachanunSh: true }, hd: (y) => new HDate(9, months.AV, y) },
  { id: 'yom-atzmaut', label: 'יום העצמאות', il: true, services: ['shacharit'], feat: { hallel: true, noTachanunSh: true }, hd: (y) => new HDate(5, months.IYYAR, y) },
  { id: 'yom-yerushalayim', label: 'יום ירושלים', il: true, services: ['shacharit'], feat: { hallel: true, noTachanunSh: true }, hd: (y) => new HDate(28, months.IYYAR, y) },
  { id: 'pesach-sheni', label: 'פסח שני', il: true, services: ['shacharit'], feat: { noTachanunSh: true }, hd: (y) => new HDate(14, months.IYYAR, y) },
  { id: 'lag-baomer', label: 'ל״ג בעומר', il: true, services: ['shacharit'], feat: { noTachanunSh: true }, hd: (y) => new HDate(18, months.IYYAR, y) },
  { id: 'tu-beav', label: 'ט״ו באב', il: true, services: ['shacharit'], feat: { noTachanunSh: true }, hd: (y) => new HDate(15, months.AV, y) },
  { id: 'tu-bishvat', label: 'ט״ו בשבט', il: true, services: ['shacharit'], feat: { noTachanunSh: true }, hd: (y) => new HDate(15, months.SHVAT, y) },
  { id: 'ayt', label: 'עשרת ימי תשובה (ו׳ תשרי)', il: true, services: ['shacharit', 'mincha'], feat: {}, notDow: NOFRI, hd: (y) => new HDate(6, months.TISHREI, y) },
  // Erev days — Mincha-before-a-no-Tachanun-day rule (avoid Fri: erev-Shabbat).
  { id: 'erev-rc', label: 'ערב ראש חודש', il: true, services: ['shacharit', 'mincha'], feat: {}, minchaNoTachanun: true, notDow: NOFRI, hd: (y) => new HDate(29, months.TAMUZ, y) },
  { id: 'erev-chanukah', label: 'ערב חנוכה', il: true, services: ['mincha'], feat: {}, minchaNoTachanun: true, notDow: NOFRI, hd: (y) => new HDate(24, months.KISLEV, y) },
  { id: 'erev-yk', label: 'ח׳ תשרי (מנחה לפני ערב יוה״כ — תחנון כן)', il: true, services: ['mincha'], feat: {}, minchaNoTachanun: false, notDow: NOFRI, hd: (y) => new HDate(8, months.TISHREI, y) },
  { id: 'erev-rh', label: 'כ״ח אלול (מנחה לפני ערב ר״ה — תחנון כן)', il: true, services: ['mincha'], feat: {}, minchaNoTachanun: false, notDow: NOFRI, hd: (y) => new HDate(28, months.ELUL, y) },
  // Maariv — the NIGHT belongs to the next Hebrew day (flags describe that night).
  { id: 'erev-rc-maariv', label: 'ערבית של ליל ראש חודש', il: true, services: ['maariv'], feat: {}, yaaleh: true, rcName: true, notDow: NOFRI, hd: (y) => new HDate(29, months.TAMUZ, y) },
  { id: 'erev-chanukah-maariv', label: 'ערבית של ליל א׳ דחנוכה', il: true, services: ['maariv'], feat: {}, alhanisim: true, notDow: NOFRI, hd: (y) => new HDate(24, months.KISLEV, y) },
  { id: 'motzei-shabbat', label: 'ערבית מוצאי שבת', il: true, services: ['maariv'], feat: {}, chonantanu: true, allowShabbat: true, hd: (y) => onOrAfterDow(new HDate(10, months.CHESHVAN, y), 6) },
  { id: 'maariv-winter', label: 'ערבית בחורף (שבט)', il: true, services: ['maariv'], feat: {}, notDow: NOFRI, hd: (y) => new HDate(10, months.SHVAT, y) },
  { id: 'omer-maariv', label: 'ערבית בספירת העומר (ליל כ״א אייר)', il: true, services: ['maariv'], feat: {}, omer: true, notDow: NOFRI, hd: (y) => new HDate(20, months.IYYAR, y) },
];
// Diaspora (חו״ל) runs of the cases most affected by Israel/diaspora differences.
const CHUL_IDS = ['plain-tue', 'tal-25cheshvan', 'rc1', 'chm-sukkot', 'chm-pesach', 'chanukah3', 'purim', 'maariv-winter'];
const CASES: Case[] = [
  ...BASE,
  ...BASE.filter((c) => CHUL_IDS.includes(c.id)).map((c) => ({ ...c, id: c.id + '-chul', label: c.label + ' — חו״ל', il: false })),
];

function resolveDate(c: Case, startYear: number): Date | null {
  for (let y = startYear; y < startYear + 19; y++) {
    if (c.leapOnly && !HDate.isLeapYear(y)) continue;
    const hd = c.hd(y); const g = hd.greg().getDay();
    if (!c.allowShabbat && g === 6) continue;
    if (c.dow !== undefined && g !== c.dow) continue;
    if (c.notDow && c.notDow.includes(g)) continue;
    return noon(hd);
  }
  return null;
}

/* ── independent calendar expectations (NOT taken from the app) ──────────── */
function inGeshem(date: Date): boolean { // מוריד הגשם: כ״ב תשרי → ט״ו ניסן
  const hd = new HDate(date); const m = hd.getMonth(), d = hd.getDate();
  return (m === 7 && d >= 22) || (m >= 8 && m <= 13) || (m === 1 && d < 15);
}
function inTalUmatar(date: Date, il: boolean): boolean { // ותן טל ומטר
  const hd = new HDate(date); const m = hd.getMonth(), d = hd.getDate();
  const beforePesach = (m >= 8 && m <= 13) || (m === 1 && d < 15);
  if (!beforePesach) return false;
  if (il) return !(m === 8 && d < 7);
  // Diaspora: from the 60th day after Tekufat Tishrei — Dec 4 (Dec 5 when the
  // following civil year is a leap year) — until Pesach.
  const gy = date.getFullYear(), gm = date.getMonth() + 1, gd = date.getDate();
  const leapNext = ((gy + 1) % 4 === 0 && (gy + 1) % 100 !== 0) || (gy + 1) % 400 === 0;
  return (gm === 12 && gd >= (leapNext ? 5 : 4)) || gm <= 4;
}
function inAYT(date: Date): boolean { const hd = new HDate(date); return hd.getMonth() === 7 && hd.getDate() >= 1 && hd.getDate() <= 10; }

/* ── content signatures ─────────────────────────────────────────────────── */
const FEST_SIG: Record<Fest, RegExp> = {
  pesach: /חג המצות הזה|חג הפסח הזה/,
  shavuot: /חג השבועות הזה/,
  sukkot: /חג הסכות הזה|חג הסוכות הזה/,
  shminiatzeret: /שמיני עצרת הזה|שמיני חג העצרת הזה|שמיני חג עצרת הזה/,
  roshhashana: /יום הזכרון הזה|יום תרועה/,
};
const FEST_HE: Record<Fest, string> = { pesach: 'פסח', shavuot: 'שבועות', sukkot: 'סוכות', shminiatzeret: 'שמיני עצרת', roshhashana: 'ראש השנה' };
const SHABBAT_SIG = /רצה והחליצנו|מגן אבות בדברו|ושמרו בני ישראל את השבת|ישמחו במלכותך שומרי שבת|אתה קדשת את יום השביעי|תכנת שבת/;
const YAALEH_SIG = /יעלה ויבא|יעלה ויבוא/;
const ALHANISIM_SIG = /(על|ועל) הני?סים/;
const GESHEM_SIG = /מוריד הגשם/;
const TALUMATAR_SIG = /טל ומטר/;
const CHOONANTANU_SIG = /אתה חוננתנו/;
const ANENU_SIG = /(?<![א-ת])עננו(?![א-ת])/;
// The T"B Amidah insert — not the verse "כי נחם ה׳ ציון" (in ויתן לך).
const NACHEM_SIG = /נחם (יהוה|יי|ה['׳]) אלהינו את|העיר האבלה|אבלי ציון|מנחם ציון/;
const RC_NAME_SIG = /ראש החדש הזה|ראש חדש הזה|ראש החודש הזה/;
const EMPTY_DAYNAME_SIG = /ביום\s*[,.:]?\s*זכרנו/;
// Vocalized (= PRAYER text, not an unpointed rubric) AYT inserts.
const N = '[\\u0591-\\u05C7]*';
const voc = (s: string) => new RegExp(s.split('').map((ch) => (ch === ' ' ? '\\s+' : ch + N)).join(''), 'g');
const VOWEL = /[ְ-ׇּׁׂ]/;
const vocalizedHit = (raw: string, rx: RegExp) => { const ms = raw.match(rx) || []; return ms.some((m) => VOWEL.test(m)); };
// Amidah-specific AYT forms only. ("אבינו מלכנו זכרנו לחיים טובים" is the correct
// FAST-DAY wording of Avinu Malkeinu — not an AYT leak.)
const AYT_VOC = [voc('המלך הקדוש'), voc('המלך המשפט'), voc('זכרנו לחיים מלך'), voc('מי כמוך אב הרחמים')];
// Lines legitimately repeated inside one section (Kaddish lines; יהיו לרצון; the
// per-day "ומנחתם…" — counted separately by the korban check).
const isKaddishLine = (t: string) => /יתגדל|יתברך וישתבח|יהא שמה|יהא שמיה|תתקבל|יהא שלמא|עשה שלום|עושה שלום|יהיו לרצון|^ומנחתם/.test(t);

const excludeFromScan = (sec: string) =>
  /קריאת התורה|torah reading|עליה|ויהי בנסוע|הוצאת|החזרת|reading from sefer|לשני וחמישי|ויחל|ויבא עמלק|נשיא|הפטרה|haftar|קרבנות|korbanot|תמיד|ברייתא|משנה|דיני זבחים|פטום|סדר המערכה|הקטרת|תפילין|tefill?in/i.test(sec);

/* ── findings ───────────────────────────────────────────────────────────── */
type Sev = 'CRITICAL' | 'HIGH' | 'MED' | 'LOW';
const SEV_RANK: Record<Sev, number> = { CRITICAL: 0, HIGH: 1, MED: 2, LOW: 3 };
type Finding = { sev: Sev; nusach: Nusach; service: Service; day: string; date: string; msg: string; ctx?: string; modes: Set<string> };
const findings = new Map<string, Finding>();
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function push(sev: Sev, nusach: Nusach, service: Service, c: Case, date: Date, msg: string, ctx?: string, mode = '') {
  const key = `${nusach}|${service}|${c.id}|${msg}`;
  const f = findings.get(key);
  if (f) { if (mode) f.modes.add(mode); return; }
  findings.set(key, { sev, nusach, service, day: c.label, date: fmt(date), msg, ctx, modes: new Set(mode ? [mode] : []) });
}
const tailOrder = (H: FlatLeaf[]) => {
  const i = lastIdxP(H, (l) => /אלה?י נצור|elohai netzor|סיום עמידה/i.test(head(l)));
  const s = i >= 0 ? i : 0;
  return (s > 0 ? '…→ ' : '') + H.slice(s).map((l) => l.he || l.en).join(' → ');
};

/* ── structural audit ───────────────────────────────────────────────────── */
function auditStructure(nusach: Nusach, service: Service, c: Case, date: Date, H: FlatLeaf[]) {
  const add = (sev: Sev, msg: string) => push(sev, nusach, service, c, date, msg, tailOrder(H));
  if (H.length === 0) { add('CRITICAL', 'התפילה ריקה — לא נוצר אף חלק'); return; }
  const bad = H.filter((l) => OTHER_SIDDUR[nusach].test(l.ref));
  if (bad.length) push('CRITICAL', nusach, service, c, date, `ערבוב נוסח: ${bad.length} עלים מנוסח אחר`, bad.slice(0, 3).map((l) => `${l.he}: ${l.ref}`).join(' | '));
  if (/^chanukah/.test(c.id)) {
    const want = chanukahDayOf(date);
    const nasi = H.find((l) => /יום\s*\d+/.test(l.he));
    if (nasi) { const got = Number((nasi.he.match(/יום\s*(\d+)/) || [])[1]); if (want && got && got !== want) add('HIGH', `נשיא חנוכה שגוי: "יום ${got}" אך היום יום ${want}`); }
  }
  const f = c.feat;
  const iMusaf = firstIdx(H, isMusaf), iTorah = firstIdx(H, isTorahSvc), iHallel = firstIdx(H, isHallel);
  const iUva = lastIdxP(H, isUva), iSong = firstIdx(H, isSong), iBarchi = firstIdx(H, isBarchi);
  if (service === 'shacharit') {
    if (f.musaf && iMusaf < 0) add('CRITICAL', 'חסר מוסף ביום שיש בו מוסף');
    if (f.hallel && iHallel < 0) add('HIGH', 'חסר הלל ביום שיש בו הלל');
    if (f.torah && iTorah < 0) add('HIGH', 'חסרה קריאת התורה ביום קריאה');
    if (f.barchi && iBarchi < 0) add('MED', 'חסר ברכי נפשי בראש חודש');
    if (iMusaf >= 0 && iTorah >= 0 && iMusaf < iTorah) add('HIGH', 'מוסף לפני קריאת התורה');
    if (iMusaf >= 0 && iUva >= 0 && iMusaf < iUva) add('HIGH', 'מוסף לפני אשרי/ובא לציון');
    if (iHallel >= 0 && iTorah >= 0 && iHallel > iTorah) add('MED', 'הלל אחרי קריאת התורה');
    if (iBarchi >= 0 && iSong >= 0 && iBarchi < iSong) add('MED', 'ברכי נפשי לפני שיר של יום');
    if (iBarchi >= 0 && iSong >= 0 && iBarchi > iSong + 2) add('LOW', 'ברכי נפשי אינו מיד אחרי שיר של יום');
    for (const [name, p] of [['ובא לציון', isUva], ['שיר של יום', isSong], ['מוסף', isMusaf], ['הלל', isHallel], ['עלינו', isAleinu], ['ברכי נפשי', isBarchi]] as [string, (l: FlatLeaf) => boolean][]) {
      const n = countBlocks(H, p); if (n >= 2) add('HIGH', `כפילות: "${name}" ${n} פעמים`);
    }
    if (f.noTachanunSh && hasP(H, isTachanun)) add('HIGH', 'תחנון ביום שאין בו תחנון');
    if (f.noTachanunSh === false && !hasP(H, isTachanun) && date.getDay() !== 5) add('MED', 'חסר תחנון ביום חול רגיל');
  }
  if (service === 'mincha' && c.minchaNoTachanun === true && hasP(H, isTachanun)) add('HIGH', 'תחנון במנחה שלפני יום שאין בו תחנון');
  if (service === 'mincha' && c.minchaNoTachanun === false && !hasP(H, isTachanun)) add('MED', 'חסר תחנון במנחה שלפני ערב-יוה״כ/ערב-ר״ה');
}

/* ── content audit (per display mode) ───────────────────────────────────── */
function auditContent(nusach: Nusach, service: Service, c: Case, date: Date, shown: Shown[], mode: Mode) {
  const scan = shown.filter((v) => !excludeFromScan(v.sec));
  const all = scan.map((v) => v.text).join('  ');
  const allRaw = scan.map((v) => v.raw.join('  ')).join('  ');
  const eff = service === 'maariv' ? addDays(date, 1) : date;
  const ctxOf = (re: RegExp) => { const h = scan.find((v) => re.test(v.text)); if (!h) return undefined; const m = h.text.match(re); const i = m ? h.text.indexOf(m[0]) : 0; return `סעיף "${h.sec}": …${h.text.slice(Math.max(0, i - 30), i + 45).trim()}…`; };
  const add = (sev: Sev, msg: string, re?: RegExp) => push(sev, nusach, service, c, date, msg, re ? ctxOf(re) : undefined, MODE_HE[mode]);
  const isChaz = mode === 'chazara';

  // Festival names that don't belong today.
  const badF = (Object.keys(FEST_SIG) as Fest[]).filter((k) => k !== c.fest && FEST_SIG[k].test(all));
  if (badF.length) add('HIGH', `שם-חג שלא שייך להיום גלוי: ${badF.map((k) => FEST_HE[k]).join(', ')}`, FEST_SIG[badF[0]]);
  if (SHABBAT_SIG.test(all)) add('HIGH', 'טקסט של שבת גלוי ביום חול', SHABBAT_SIG);
  if (EMPTY_DAYNAME_SIG.test(all)) add('HIGH', 'יעלה ויבא בלי שם היום ("ביום … זכרנו")', EMPTY_DAYNAME_SIG);
  if (/<\/?[a-z]+[^>]*>|&[a-z]+;|&#\d+;/i.test(allRaw.replace(/<br\s*\/?>/gi, ''))) add('MED', 'שאריות HTML/ישויות בטקסט המוצג', /./);
  // Display artifacts a davener would notice.
  for (const v of scan) for (const r of v.raw) {
    const t = strip(r).replace(/\s+/g, ' ').trim();
    if (/\s(בקיץ|בחורף|בשבת|לשבת|בר["״]?ח|ביו["״]?ט|בחוה["״]?מ|בפסח|בסוכות|בשבועות)\s*[:：]\s*$/.test(t)) {
      push('MED', nusach, service, c, date, 'תווית-יום יתומה בסוף שורה', `סעיף "${v.sec}": …${t.slice(-70)}`, MODE_HE[mode]);
    }
    if (/[א-הז-ת]בחזרת הש|[א-ת]{2}בעשי["״]ת/.test(t)) {
      push('MED', nusach, service, c, date, 'מילים מודבקות (תווית צמודה למילה)', `סעיף "${v.sec}": …${t.slice(0, 80)}`, MODE_HE[mode]);
    }
  }

  // Amidah-level checks (the silent Amidah lives in silent/notes; chazara its own).
  if (!c.yaaleh && YAALEH_SIG.test(all)) add('HIGH', '"יעלה ויבא" גלוי ביום שאין בו', YAALEH_SIG);
  if (c.yaaleh && !isChaz && !YAALEH_SIG.test(all)) add('HIGH', 'חסר "יעלה ויבא"');
  if (c.yaaleh && c.rcName && YAALEH_SIG.test(all) && !RC_NAME_SIG.test(all)) add('HIGH', 'ביעלה ויבא חסר "ראש החודש הזה"', YAALEH_SIG);
  if (c.fest && !isChaz && !FEST_SIG[c.fest].test(all)) add('HIGH', `חסר שם החג של היום ("${FEST_HE[c.fest]}")`);
  if (!c.alhanisim && ALHANISIM_SIG.test(all)) add('HIGH', '"על הנסים" גלוי שלא בחנוכה/פורים', ALHANISIM_SIG);
  if (c.alhanisim && !isChaz && !ALHANISIM_SIG.test(all)) add('HIGH', 'חסר "על הנסים"');

  // Season (computed independently from the calendar, for the effective day).
  const geshem = inGeshem(eff), tal = inTalUmatar(eff, c.il);
  if (!isChaz || shown.length) {
    if (geshem && !isChaz && !GESHEM_SIG.test(all)) add('HIGH', 'חסר "משיב הרוח ומוריד הגשם"');
    if (!geshem && GESHEM_SIG.test(all)) add('HIGH', '"מוריד הגשם" גלוי בקיץ', GESHEM_SIG);
    if (tal && !isChaz && !TALUMATAR_SIG.test(all)) add('HIGH', 'חסר "ותן טל ומטר"');
    if (!tal && TALUMATAR_SIG.test(all)) add('HIGH', `"ותן טל ומטר" גלוי שלא בעונתו${c.il ? '' : ' (חו״ל)'}`, TALUMATAR_SIG);
  }
  // Aseret Yemei Teshuva — judge by VOCALIZED text (prayer), not the unpointed rubric.
  const aytHit = AYT_VOC.some((rx) => vocalizedHit(allRaw, rx));
  if (!inAYT(eff) && aytHit) {
    let where = '';
    for (const v of scan) for (const r of v.raw) for (const rx of AYT_VOC) {
      const ms = r.match(rx) || [];
      if (!where && ms.some((m) => VOWEL.test(m))) { const s = strip(r); where = `סעיף "${v.sec}": …${s.slice(0, 110)}…`; }
    }
    push('HIGH', nusach, service, c, date, 'תוספת עשי״ת (המלך הקדוש/זכרנו לחיים) גלויה כנוסח-תפילה מחוץ לעשי״ת', where, MODE_HE[mode]);
  }
  if (inAYT(eff) && !isChaz && service !== 'maariv' && !aytHit) add('MED', 'חסרות תוספות עשי״ת המנוקדות (המלך הקדוש/זכרנו)');
  // An AYT rubric shown INSIDE prayer text on an ordinary day ("עשה שלום בעשרת
  // ימי תשובה אומר: השלום במרומיו") — unvocalized, so the check above misses it.
  if (!inAYT(eff)) {
    const AYT_RUBRIC = /בעשרת ימי תשובה|בעשי["״׳']?ת/;
    if (AYT_RUBRIC.test(all)) add('MED', 'הוראת עשי״ת מוצגת בתוך התפילה ביום רגיל', AYT_RUBRIC);
  }

  // Maariv.
  if (service === 'maariv') {
    if (c.chonantanu && !CHOONANTANU_SIG.test(all)) add('HIGH', 'חסר "אתה חוננתנו" במוצאי שבת');
    if (!c.chonantanu && CHOONANTANU_SIG.test(all)) add('HIGH', '"אתה חוננתנו" בערבית שאינה מוצ״ש', CHOONANTANU_SIG);
    if (ANENU_SIG.test(all)) add('HIGH', '"עננו" בערבית', ANENU_SIG);
    if (c.omer) {
      const omerLines = shown.flatMap((v) => v.raw).map(strip).filter((t) => /[לב]עו?מר/.test(t) && !/ספירת/.test(t) && /יום|ימים|שבוע/.test(t));
      if (omerLines.length === 0) add('HIGH', 'חסרה ספירת העומר של הלילה');
      if (omerLines.length > 1) add('HIGH', `מוצגות ${omerLines.length} שורות-ספירה במקום אחת`);
    }
  }
  if (c.id !== 'tisha-bav' && NACHEM_SIG.test(all)) add('HIGH', '"נחם" גלוי שלא בתשעה באב', NACHEM_SIG);

  // Sukkot Musaf: exactly TODAY's korban (Israel) / today's + the doubtful
  // previous day's (diaspora, ספיקא דיומא). Never the first-day korban on ChM.
  if (c.fest === 'sukkot' && service === 'shacharit' && mode !== 'notes') {
    const s = new HDate(eff).getDate() - 14;
    const ORD: Record<string, number> = { 'השני': 2, 'השלישי': 3, 'הרביעי': 4, 'החמישי': 5, 'הששי': 6, 'השישי': 6, 'השביעי': 7 };
    const want = new Set<number>(c.il ? [s] : [s - 1, s].filter((x) => x >= 2));
    const got = new Set<number>();
    for (const m of all.matchAll(/וביום (השני|השלישי|הרביעי|החמישי|הששי|השישי|השביעי)[\s.,:]/g)) got.add(ORD[m[1]]);
    const same = want.size === got.size && [...want].every((x) => got.has(x));
    // Edot HaMizrach's Musaf says "כמו שכתבת עלינו בתורתך" without the korban
    // verses — that is the nusach, so "none shown" is correct there.
    const emNoVerses = nusach === 'edot-mizrach' && got.size === 0;
    if (!same && !emNoVerses) add('HIGH', `קרבן מוסף סוכות: צריך יום ${[...want].join('+')} אך מוצג ${got.size ? [...got].sort().join(',') : 'אף אחד'}`, /וביום ה/);
    if (/ובחמשה עשר יום לחדש השביעי/.test(all)) add('HIGH', 'קרבן יום א׳ דסוכות מוצג בחול המועד', /ובחמשה עשר יום לחדש השביעי/);
  }
  // Festival Musaf korbanot must belong to TODAY's festival (Kedushat HaYom).
  if ((c.fest === 'sukkot' || c.fest === 'pesach') && service === 'shacharit' && mode !== 'notes' && nusach !== 'edot-mizrach') {
    const mus = shown.filter((v) => /קדושת היום|Sanctity|מוסף/.test(v.sec)).map((v) => v.text).join('  ');
    const m2 = (re: RegExp) => { const h = shown.find((v) => /קדושת היום|Sanctity|מוסף/.test(v.sec) && re.test(v.text)); if (!h) return undefined; const mm = h.text.match(re)!; const i = h.text.indexOf(mm[0]); return `סעיף "${h.sec}": …${h.text.slice(Math.max(0, i - 25), i + 50)}…`; };
    if (c.fest === 'sukkot') {
      for (const re of [/ובחדש הראשון בארבעה עשר/, /פרים בני ?בקר שנים[.,]?\s*ו?איל/]) if (re.test(mus)) push('HIGH', nusach, service, c, date, 'קרבן של פסח/שבועות במוסף סוכות', m2(re), MODE_HE[mode]);
    } else {
      for (const re of [/ובחדש הראשון בארבעה עשר/, /ובחמשה עשר יום לחדש השביעי/, /וביום (השני|השלישי|הרביעי|החמישי|הששי|השביעי)[.,]? פרים/]) if (re.test(mus)) push('HIGH', nusach, service, c, date, 'קרבן שאינו של חוה״מ פסח במוסף', m2(re), MODE_HE[mode]);
      if (!/פרים בני ?בקר שנים/.test(mus)) push('HIGH', nusach, service, c, date, 'חסר קרבן חוה״מ פסח ("והקרבתם… פרים שנים") במוסף', undefined, MODE_HE[mode]);
    }
    const nM = (mus.match(/ומנחתם/g) || []).length;
    const wantM = c.fest === 'sukkot' && !c.il ? 2 : 1;
    if (nM !== wantM) push('HIGH', nusach, service, c, date, `"ומנחתם" מופיע ${nM} פעמים במוסף (צ״ל ${wantM})`, m2(/ומנחתם/), MODE_HE[mode]);
  }

  // Duplicated paragraph inside the Amidah/Musaf.
  if (mode !== 'notes') {
    for (const v of shown.filter((x) => x.amidah)) {
      const seen = new Map<string, number>();
      for (const r of v.raw) {
        const t = strip(r).replace(/\s+/g, ' ').trim();
        if (t.length < 40 || isKaddishLine(t)) continue;
        seen.set(t, (seen.get(t) || 0) + 1);
      }
      const dup = [...seen.entries()].find(([, n]) => n > 1);
      if (dup) { push('HIGH', nusach, service, c, date, 'פסקה כפולה בתוך אותו סעיף בעמידה/מוסף', `סעיף "${v.sec}": …${dup[0].slice(0, 90)}…`, MODE_HE[mode]); break; }
    }
  }
}

/* ── run ────────────────────────────────────────────────────────────────── */
const startYear = Number(process.argv.find((a) => /^\d{4}$/.test(a))) || 5787;
const structuralOnly = process.argv.includes('--fast');
let cells = 0;
// --dump <nusach> <shacharit|mincha|maariv> <YYYY-MM-DD> [chul]
//   Render ONE prayer exactly as the app shows it (silent + chazara views) to
//   .siddur-dump.md — for reading it as a davener.
const di = process.argv.indexOf('--dump');
// --snap <outDir> <nusach:service:YYYY-MM-DD[:chul]> … — snapshot many prayers
// (silent view, one paragraph per line) for before/after regression diffs.
const si = process.argv.indexOf('--snap');
if (si >= 0) {
  (async () => {
    const outDir = process.argv[si + 1];
    fs.mkdirSync(outDir, { recursive: true });
    for (const spec of process.argv.slice(si + 2)) {
      const [nus, svc, ds, chul] = spec.split(':') as [Nusach, Service, string, string?];
      const il = chul !== 'chul';
      const [y, mo, d] = ds.split('-').map(Number);
      const date = new Date(y, mo - 1, d, 12, 0);
      const H = buildLeaves(nus, SERVICES[nus][svc], date, il, svc);
      const active = activeTags(date, il, svc === 'maariv');
      const ps = await appLeaves(H, date, active);
      const lines: string[] = [];
      for (const v of renderMode(ps, 'silent', active, date, il, svc === 'maariv')) {
        lines.push(`## ${v.sec}`);
        for (const r of v.raw) lines.push(strip(r).replace(/\s+/g, ' ').trim());
      }
      fs.writeFileSync(`${outDir}/${spec.replace(/:/g, '_')}.txt`, lines.join('\n'), 'utf8');
    }
    console.log('snapshots written to ' + outDir);
  })();
} else if (di >= 0) {
  (async () => {
    const [nus, svc, ds, chul] = process.argv.slice(di + 1) as [Nusach, Service, string, string?];
    const il = chul !== 'chul';
    const [y, mo, d] = ds.split('-').map(Number);
    const date = new Date(y, mo - 1, d, 12, 0);
    const H = buildLeaves(nus, SERVICES[nus][svc], date, il, svc);
    const active = activeTags(date, il, svc === 'maariv');
    const ps = await appLeaves(H, date, active);
    let md = `# ${nus} · ${svc} · ${ds}${il ? '' : ' (חו״ל)'} — כפי שהאפליקציה מציגה\n`;
    for (const mode of (svc === 'maariv' ? ['silent'] : ['silent', 'chazara']) as Mode[]) {
      md += `\n\n# ===== ${MODE_HE[mode]} =====\n`;
      for (const v of renderMode(ps, mode, active, date, il, svc === 'maariv')) {
        if (!v.raw.length) continue;
        md += `\n## ${v.sec}\n` + v.raw.map((r) => strip(r).replace(/\s+/g, ' ').trim()).join('\n') + '\n';
      }
    }
    fs.writeFileSync('.siddur-dump.md', md, 'utf8');
    console.log('wrote .siddur-dump.md');
  })();
} else (async () => {
  for (const c of CASES) {
    const date = resolveDate(c, startYear);
    if (!date) { console.log('skip (no date):', c.id); continue; }
    for (const nusach of NUSCHAOT) {
      for (const service of c.services) {
        cells++;
        setJerusalemPurim(!!c.jerusalem);
        let H: FlatLeaf[];
        try { H = buildLeaves(nusach, SERVICES[nusach][service], date, c.il, service); }
        catch (e: any) { push('CRITICAL', nusach, service, c, date, 'קריסה בבניית התפילה: ' + (e?.message || e)); continue; }
        auditStructure(nusach, service, c, date, H);
        if (c.noAmalek && H.some((l) => /^Exodus 17:/.test(l.ref))) push('HIGH', nusach, service, c, date, 'קריאת "ויבא עמלק" שלא ביום הפורים של המתפלל');
        if (structuralOnly || !H.length) continue;
        const isMaariv = service === 'maariv';
        const active = activeTags(date, c.il, isMaariv);
        let ps: Pseudo[];
        try { ps = await appLeaves(H, date, active); }
        catch (e: any) { push('CRITICAL', nusach, service, c, date, 'קריסה ברינדור: ' + (e?.message || e)); continue; }
        for (const mode of (isMaariv ? ['silent', 'notes'] : ['silent', 'notes', 'chazara']) as Mode[]) {
          auditContent(nusach, service, c, date, renderMode(ps, mode, active, date, c.il, isMaariv), mode);
        }
      }
    }
  }

  const list = [...findings.values()].sort((a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev] || a.nusach.localeCompare(b.nusach));
  const by = (s: Sev) => list.filter((f) => f.sev === s);
  let md = `# דו״ח הגהת-סידור אוטומטי (v2 — צינור זהה לאפליקציה)\n\n`;
  md += `נבדקו **${cells}** תפילות (נוסח × שירות × יום, א״י וחו״ל) בשלושה מצבי תצוגה (לחש / עם הערות / חזרת הש״ץ) · שנת בדיקה ${startYear} · ${new Date().toLocaleString('he-IL')}\n\n`;
  md += `סה״כ חריגות: **${list.length}** — 🔴 ${by('CRITICAL').length} · 🟠 ${by('HIGH').length} · 🟡 ${by('MED').length} · ⚪ ${by('LOW').length}\n\n`;
  md += `> הכלי "מתפלל" כל תפילה וקורא את הטקסט הגלוי. הפסק ההלכתי הוא של הרב.\n\n---\n`;
  const emoji: Record<Sev, string> = { CRITICAL: '🔴', HIGH: '🟠', MED: '🟡', LOW: '⚪' };
  for (const s of ['CRITICAL', 'HIGH', 'MED', 'LOW'] as Sev[]) {
    const fs2 = by(s); if (!fs2.length) continue;
    md += `\n## ${emoji[s]} ${s} (${fs2.length})\n\n`;
    for (const f of fs2) {
      md += `- **[${f.nusach} · ${f.service} · ${f.day}]** (${f.date}) — ${f.msg}${f.modes.size ? ` _(מצב: ${[...f.modes].join(', ')})_` : ''}\n`;
      if (f.ctx) md += `  - ${f.ctx}\n`;
    }
  }
  const qs = CASES.filter((c) => c.question);
  if (qs.length) { md += `\n## ❓ שאלות לפוסק (לא נבדקות אוטומטית כבאג)\n\n`; for (const c of qs) md += `- **${c.label}:** ${c.question}\n`; }
  if (!list.length) md += `\n✅ לא נמצאו חריגות.\n`;
  fs.writeFileSync('.siddur-audit-report.md', md, 'utf8');
  console.log(`audited ${cells} cells → ${list.length} findings (🔴${by('CRITICAL').length} 🟠${by('HIGH').length} 🟡${by('MED').length} ⚪${by('LOW').length})`);
})();
