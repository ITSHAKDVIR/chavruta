/* Renders the FULL visible prayer text per section, exactly as the app shows it
 * (Sefaria text → parseParagraphs → shouldRender(showAll/showNotes=false) →
 * inline-paren strip / conditional enhance). Args: <nusach> <service-slugs> <date>
 * e.g.  npx tsx --tsconfig tsconfig.dump.json siddur-audit/render-text.ts sephardi weekday-shacharit 2026-06-23 */
import * as fs from 'fs';
import * as https from 'https';
import {
  getNodesAtPath, collectLeaves, getHashkamatHaBokerNode, Nusach, FlatLeaf, SiddurNode,
} from '../src/data/siddurTree';
import { augmentLeavesForToday } from '../src/data/siddurAugment';
import { isSectionRelevantToday } from '../src/data/siddurRelevance';
import { shouldHideForPrefs, DEFAULT_SIDDUR_PREFS } from '../src/storage/siddurPrefs';
import {
  parseParagraphs, activeTags, shouldRender, enhanceConditionalText,
  stripInactiveInlineParens, hasNikud, stripLongTachanunSupplication,
} from '../src/services/siddurParser';
import { filterDailyPsalmForToday } from '../src/services/songOfDay';

const KNOWN_EMPTY_REFS = new Set<string>([
  'Siddur Ashkenaz, Weekday, Minchah, Post Amidah, Vidui and 13 Middot',
  'Siddur Ashkenaz, Weekday, Shacharit, Torah Reading, Reading from Sefer, Prayers for Welfare of the People',
  'Siddur Ashkenaz, Shabbat, Shacharit, Amidah, Holiness of God',
  'Siddur Ashkenaz, Shabbat, Shacharit, Pesukei Dezimra, Mizmor Letoda',
  'Siddur Ashkenaz, Shabbat, Shacharit, Torah Reading, Reading from Sefer, Mi Sheberach, Bat Mitzvah',
]);
let IL = true; // overridden to false by a 4th CLI arg "chul"
const prefs = DEFAULT_SIDDUR_PREFS;

function fetchSefaria(ref: string): Promise<string[]> {
  return new Promise((res) => {
    https.get('https://www.sefaria.org/api/v3/texts/' + encodeURIComponent(ref) + '?version=hebrew', (r) => {
      const chunks: Buffer[] = []; r.on('data', (c: Buffer) => chunks.push(c)); r.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        try {
          const j = JSON.parse(d); const v = j.versions && j.versions[0]; const text = v ? v.text : j.text;
          const flat: string[] = []; const walk = (a: any) => { if (Array.isArray(a)) a.forEach(walk); else if (typeof a === 'string') flat.push(a); };
          walk(text); res(flat);
        } catch { res([]); }
      });
    }).on('error', () => res([]));
  });
}

function buildLeaves(nusach: Nusach, slugs: string[], date: Date): FlatLeaf[] {
  const slugStr = slugs.join(' ');
  const service: 'shacharit' | 'mincha' | 'maariv' =
    /mincha|minchah|מנחה/i.test(slugStr) ? 'mincha'
      : /maariv|arvit|ערבית|מעריב/i.test(slugStr) ? 'maariv' : 'shacharit';
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
  return augmentLeavesForToday(own, here as SiddurNode, nusach, date, IL).filter((l) =>
    !KNOWN_EMPTY_REFS.has(l.ref) && !shouldHideForPrefs(l.en, prefs) &&
    !l.trail.some((t) => shouldHideForPrefs(t.en, prefs)) &&
    isSectionRelevantToday(l.en, date, IL, l.he, service) &&
    !l.trail.some((t) => !isSectionRelevantToday(t.en, date, IL, t.he, service)));
}

(async () => {
  const [nusach, slugStr, dateStr, ilArg] = process.argv.slice(2) as [Nusach, string, string, string?];
  if (ilArg === 'chul') IL = false;
  const slugs = slugStr.split('/');
  const date = new Date(dateStr + 'T10:00:00');
  const dow = date.getDay();
  const svc = /mincha|minchah|מנחה/i.test(slugStr) ? "mincha" : /maariv|arvit|ערבית|מעריב/i.test(slugStr) ? "maariv" : "shacharit";
  const active = activeTags(date, IL, svc === "maariv");
  const leaves = buildLeaves(nusach, slugs, date);
  let md = `# טקסט מלא כפי שהאפליקציה מציגה — ${nusach} · ${slugStr} · ${dateStr}\n\n`;
  md += `> נשלף מספריא ועבר את פרסור-האפליקציה (סינון לפי-היום, הסתרת הערות, חזרת-ש"ץ מוסתרת).\n`;
  md += `> תוכן-מותנה מוצג עם תווית 🔹. שיר-של-יום: מוצג כפי שספריא מחזיר (כל הימים).\n\n`;
  const cache: Record<string, string[]> = {};
  for (const l of leaves) {
    md += `\n## ${l.he || l.en}${l.he && l.en ? `  — ${l.en}` : ''}\n\`${l.ref}\`\n\n`;
    let lines = cache[l.ref] || (cache[l.ref] = await fetchSefaria(l.ref));
    if (!lines.length) { md += `*(אין טקסט בספריא לכתובת זו)*\n`; continue; }
    const isTach = /^(לשני וחמישי|תחנון|וידוי)$/.test((l.he || '').trim());
    if (isTach && dow !== 1 && dow !== 4) lines = stripLongTachanunSupplication(lines);
    if (/Song of the Day|שיר של יום|Daily Psalm|Psalm of the Day/i.test(`${l.en} ${l.he}`)) {
      lines = filterDailyPsalmForToday(lines, dow);
    }
    const paras = parseParagraphs(lines);
    let any = false;
    for (const p of paras) {
      if (!shouldRender(p, active, { showAll: false, showNotes: false, chazara: false })) continue;
      let body: string;
      if (p.kind === 'conditional' || p.kind === 'alternative') {
        body = (p.marker ? `🔹 ${p.marker}${p.kind === 'alternative' ? ' (במקום)' : ''}:\n` : '') +
          (enhanceConditionalText as any)(p, date, IL, svc === "maariv");
      } else if (p.kind === 'halachic-note') {
        body = `«${p.body.trim()}»`;
      } else {
        body = stripInactiveInlineParens(p.body, active);
      }
      const sm = (p as any).small ? '·small· ' : '';
      if (body.trim()) { md += sm + body.trim() + '\n\n'; any = true; }
    }
    if (!any) md += `*(אין שורות מוצגות היום)*\n`;
  }
  const out = `siddur-audit/text-${nusach}-${slugStr.replace(/\//g, '_')}-${dateStr}${IL ? '' : '-chul'}.md`;
  fs.writeFileSync(out, md, 'utf8');
  console.log('wrote ' + out + ' (' + leaves.length + ' sections)');
})();
