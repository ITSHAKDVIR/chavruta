/**
 * Per-day siddur leaf augmentation.
 *
 * Given the BASE leaves the user navigated to (e.g. "Weekday Shacharit") and
 * today's calendar context, inject the relevant SPECIAL-DAY leaves at the
 * right position so the whole prayer reads as ONE continuous flow.
 *
 * Examples:
 *   • Rosh Chodesh weekday → insert Hallel, Barchi Nafshi, RC Torah reading,
 *     Mussaf (and remove the regular weekday Torah reading + Tachanun).
 *   • Chol HaMoed Pesach   → insert Half-Hallel + festival Mussaf.
 *   • Chol HaMoed Sukkot   → insert Full Hallel + festival Mussaf + Hoshanot.
 *   • Chanukah weekday     → insert Full Hallel + Naso reading for the day.
 *   • Purim weekday        → insert Vayavo Amalek Torah reading.
 *   • Fast day             → no inject (Selichot, Anenu live in the Amidah text).
 *
 * The augmenter is BEST-EFFORT: when the JSON tree doesn't contain the
 * needed leaf (e.g. some nuschach don't have a separate RC Hallel leaf),
 * the function silently skips it. Worst case the user sees the base flow
 * unchanged — no crash.
 */
import { HDate, HebrewCalendar, flags, months } from '@hebcal/core';
import {
  FlatLeaf,
  Nusach,
  SiddurNode,
  collectLeaves,
  getNusachTree,
} from './siddurTree';

/* ────────────────────────── tree helpers ──────────────────────────── */

/** Find a top-level node by Hebrew or English name pattern. */
function findTopNode(nusach: Nusach, pattern: RegExp): SiddurNode | undefined {
  return getNusachTree(nusach).find((n) => pattern.test(n.en) || pattern.test(n.he));
}

/** Recursively find the first node whose en or he matches pattern. */
function findDeep(node: SiddurNode | undefined, pattern: RegExp): SiddurNode | undefined {
  if (!node) return undefined;
  if (pattern.test(node.en) || pattern.test(node.he)) return node;
  for (const c of node.children ?? []) {
    const found = findDeep(c, pattern);
    if (found) return found;
  }
  return undefined;
}

function findDeepInTree(nusach: Nusach, pattern: RegExp): SiddurNode | undefined {
  for (const top of getNusachTree(nusach)) {
    const found = findDeep(top, pattern);
    if (found) return found;
  }
  return undefined;
}

/* ────────────────────────── calendar helpers ──────────────────────── */

type DayContext = {
  date: Date;
  hd: HDate;
  inIsrael: boolean;
  isRC: boolean;
  isCholHamoed: boolean;
  isPesach: boolean;          // chol-hamoed pesach or YT (we exclude YT siddur from app)
  isSukkot: boolean;          // chol-hamoed sukkot
  isChanukah: boolean;
  isPurim: boolean;
  isFast: boolean;
  isMonOrThu: boolean;
  chanukahDay: number;        // 1..8 (0 = not chanukah)
};

function buildCtx(date: Date, inIsrael: boolean): DayContext {
  const hd = new HDate(date);
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  const isRC = events.some((e) => e.getFlags() & flags.ROSH_CHODESH);
  const isCholHamoed = events.some((e) => e.getFlags() & flags.CHOL_HAMOED);
  const isFast = events.some((e) => e.getFlags() & (flags.MAJOR_FAST | flags.MINOR_FAST));
  const isChanukah = events.some((e) => /Chanukah|Hanukkah/i.test(e.getDesc()));
  const isPurim = events.some((e) => /Purim|Shushan/i.test(e.getDesc()));

  let chanukahDay = 0;
  if (isChanukah) {
    const ch = events.find((e) => /Chanukah/i.test(e.getDesc()));
    if (ch) {
      const m = /Day (\d)/i.exec(ch.getDesc());
      if (m) chanukahDay = parseInt(m[1], 10);
    }
  }

  const m = hd.getMonth();
  const d = hd.getDate();
  const isPesach = isCholHamoed && m === months.NISAN;
  const isSukkot = isCholHamoed && m === months.TISHREI && d >= 15 && d <= 21;

  return {
    date,
    hd,
    inIsrael,
    isRC,
    isCholHamoed,
    isPesach,
    isSukkot,
    isChanukah,
    isPurim,
    isFast,
    isMonOrThu: date.getDay() === 1 || date.getDay() === 4,
    chanukahDay,
  };
}

/* ────────────────────────── inject helpers ────────────────────────── */

/** Last index of a leaf whose en (or he) matches pattern. -1 if not found. */
function findLeafIndex(leaves: FlatLeaf[], pattern: RegExp): number {
  for (let i = 0; i < leaves.length; i++) {
    if (pattern.test(leaves[i].en) || pattern.test(leaves[i].he)) return i;
  }
  return -1;
}

function injectAfter(leaves: FlatLeaf[], afterIdx: number, injected: FlatLeaf[]): FlatLeaf[] {
  if (afterIdx < 0 || injected.length === 0) return leaves;
  return [...leaves.slice(0, afterIdx + 1), ...injected, ...leaves.slice(afterIdx + 1)];
}

function removeMatching(leaves: FlatLeaf[], pattern: RegExp): FlatLeaf[] {
  return leaves.filter((l) => !(pattern.test(l.en) || pattern.test(l.he)));
}

/* ────────────────────────── per-day augmenters ────────────────────── */

/**
 * Rosh Chodesh weekday — Shacharit.
 * Replaces the regular Torah-Reading leaf with the Rosh Chodesh one and
 * injects Hallel + Barchi Nafshi + RC Torah Reading + Mussaf after Amidah.
 */
function augmentForRoshChodesh(leaves: FlatLeaf[], nusach: Nusach): FlatLeaf[] {
  // Find the per-nusach RC container. Locations vary:
  //   • Ashkenazi   : Festivals → Rosh Chodesh (deep)
  //   • Sephardi    : לראש חודש (top-level)
  //   • Edot-Mizrach: סדר ראש חודש (top-level)
  //   • Chabad      : ראש חודש (top-level leaf)
  const rcNode =
    findTopNode(nusach, /^Rosh (Chodesh|Hodesh)$/i) ||
    findTopNode(nusach, /^לראש חדש$|^לראש חודש$|^סדר ראש חודש$|^ראש חודש$|^ראש חדש$/) ||
    findDeepInTree(nusach, /^Rosh (Chodesh|Hodesh)$/i);
  if (!rcNode) return leaves;
  const rcLeaves = collectLeaves(rcNode);
  if (rcLeaves.length === 0) return leaves;

  // Remove the regular weekday Torah reading — RC has its own.
  // Keep RC torah-reading leaves (their trail mentions Rosh Chodesh).
  let out = leaves.filter((l) => {
    const isTorahLeaf = /^Torah Reading$/i.test(l.en) || /קריאת התורה$/.test(l.he);
    if (!isTorahLeaf) return true;
    const inRcTrail = l.trail.some((t) => /Rosh Chodesh|לראש חדש|לראש חודש/.test(t.en + t.he));
    return inRcTrail; // keep only if part of RC tree (extremely rare in base leaves)
  });

  // Anchor: insert after Amidah. If no Amidah found, try Yishtabach. Last resort: end.
  let anchor = findLeafIndex(out, /^Amidah$|^עמידה$/);
  if (anchor < 0) anchor = findLeafIndex(out, /Yishtabach|ישתבח/);
  if (anchor < 0) anchor = out.length - 1;

  out = injectAfter(out, anchor, rcLeaves);
  return out;
}

/**
 * Chanukah weekday — Shacharit.
 * Inject Hallel (full) + the day's Naso reading.
 * Al haNisim lives in the Amidah text itself (Sefaria includes it as a
 * conditional paragraph parsed by siddurParser).
 */
function augmentForChanukah(leaves: FlatLeaf[], nusach: Nusach, ctx: DayContext): FlatLeaf[] {
  // Find Hallel leaf
  const hallelNode = findDeepInTree(nusach, /^Hallel$|^הלל$|סדר הלל|הלל לראש חודש|הלל לראש חדש/);
  // Find Chanukah Torah reading (Naso) — keep this best-effort.
  const chanukahTorahNode = findDeepInTree(
    nusach,
    new RegExp(`חנוכה|Chanukah|Day ${ctx.chanukahDay}|Nasi`),
  );

  const inject: FlatLeaf[] = [];
  if (hallelNode) inject.push(...collectLeaves(hallelNode));
  if (chanukahTorahNode) {
    const t = collectLeaves(chanukahTorahNode);
    if (t.length > 0) inject.push(...t);
  }

  if (inject.length === 0) return leaves;

  // Remove the regular weekday Torah reading (Chanukah has its own).
  let out = leaves.filter((l) => !(/^Torah Reading$/i.test(l.en) || /קריאת התורה$/.test(l.he)));

  let anchor = findLeafIndex(out, /^Amidah$|^עמידה$/);
  if (anchor < 0) anchor = findLeafIndex(out, /Yishtabach|ישתבח/);
  if (anchor < 0) anchor = out.length - 1;

  out = injectAfter(out, anchor, inject);
  return out;
}

/**
 * Chol HaMoed Pesach or Sukkot — Shacharit.
 * Inject Hallel (full for Sukkot, half for Pesach) + festival Mussaf.
 */
function augmentForCholHamoed(leaves: FlatLeaf[], nusach: Nusach, ctx: DayContext): FlatLeaf[] {
  const hallelNode = findDeepInTree(nusach, /^Hallel$|^הלל$|סדר הלל/);
  const festivalNode = findTopNode(nusach, /Three Festivals|שלש רגלים|לשלש רגלים|Mussaf for Festivals|מוסף לשלש רגלים/);

  const inject: FlatLeaf[] = [];
  if (hallelNode) inject.push(...collectLeaves(hallelNode));
  if (festivalNode) {
    const fest = collectLeaves(festivalNode);
    // Trim to just the Mussaf portion if we can identify it
    const mussafLeaves = fest.filter((l) => /Mussaf|מוסף/i.test(`${l.en} ${l.he}`));
    if (mussafLeaves.length > 0) inject.push(...mussafLeaves);
    else if (fest.length <= 12) inject.push(...fest);
  }

  if (inject.length === 0) return leaves;

  let out = leaves.filter((l) => !(/^Torah Reading$/i.test(l.en) || /קריאת התורה$/.test(l.he)));
  let anchor = findLeafIndex(out, /^Amidah$|^עמידה$/);
  if (anchor < 0) anchor = findLeafIndex(out, /Yishtabach|ישתבח/);
  if (anchor < 0) anchor = out.length - 1;
  out = injectAfter(out, anchor, inject);
  return out;
}

/**
 * Purim weekday — Shacharit.
 * Replace regular Torah reading with Vayavo Amalek. Megillah is linked from
 * an existing standalone tool; we don't inline its text in the siddur.
 */
function augmentForPurim(leaves: FlatLeaf[], nusach: Nusach): FlatLeaf[] {
  // The Purim parasha Vayavo Amalek (Shemot 17) may live under a festival
  // node. Best-effort search; otherwise leave the leaves untouched.
  const purimTorah = findDeepInTree(nusach, /Purim Torah|Vayavo Amalek|ויבא עמלק|פורים/);
  if (!purimTorah) return leaves;
  const torahLeaves = collectLeaves(purimTorah);
  if (torahLeaves.length === 0) return leaves;

  let out = leaves.filter((l) => !(/^Torah Reading$/i.test(l.en) || /קריאת התורה$/.test(l.he)));
  let anchor = findLeafIndex(out, /^Amidah$|^עמידה$/);
  if (anchor < 0) anchor = out.length - 1;
  out = injectAfter(out, anchor, torahLeaves);
  return out;
}

/* ────────────────────────── entry point ───────────────────────────── */

/**
 * Return augmented leaves for today's prayer flow.
 *
 * Operates ONLY on the weekday Shacharit container (and its analogues across
 * nuschach). For every other navigation target (Mincha, Maariv, individual
 * blessings) returns the input untouched — those don't have day-injection
 * needs beyond what siddurRelevance already filters.
 */
export function augmentLeavesForToday(
  baseLeaves: FlatLeaf[],
  here: SiddurNode | undefined,
  nusach: Nusach,
  date: Date = new Date(),
  inIsrael = true,
): FlatLeaf[] {
  if (!here?.en) return baseLeaves;

  // Only act on Shacharit. Mincha/Maariv inserts (Yaaleh v'Yavo / Al haNisim
  // / Anenu) live in the Amidah text — siddurParser handles them.
  const isWeekdayShacharit =
    /^Weekday Shacharit$/i.test(here.en) ||
    /^Shacharit$/i.test(here.en) || // Chabad
    /^Morning Service$/i.test(here.en);
  if (!isWeekdayShacharit) return baseLeaves;

  const ctx = buildCtx(date, inIsrael);

  // Priority order: RC > Chanukah > ChH"M > Purim > Fast.
  // Only one match wins (you can't have ChH"M overlap with RC except RC Chol
  // Hamoed which exists for Pesach 1+2 and Sukkot 1+2 — those are Yom Tov,
  // not in the app).
  if (ctx.isRC) return augmentForRoshChodesh(baseLeaves, nusach);
  if (ctx.isChanukah) return augmentForChanukah(baseLeaves, nusach, ctx);
  if (ctx.isCholHamoed) return augmentForCholHamoed(baseLeaves, nusach, ctx);
  if (ctx.isPurim) return augmentForPurim(baseLeaves, nusach);
  // Fast days: Selichot + Vayechal Torah Reading live within Shacharit's
  // existing leaf list (Sefaria includes them as date-gated paragraphs).
  // No structural injection needed.

  return baseLeaves;
}
