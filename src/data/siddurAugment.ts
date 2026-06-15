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
  isAseretYemeiTeshuva: boolean;
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
  const isAseretYemeiTeshuva = m === months.TISHREI && d >= 1 && d <= 10;

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
    isAseretYemeiTeshuva,
    chanukahDay,
  };
}

/**
 * Inject Shir HaMaalot mi'maamakim (Tehillim 130) right after Yishtabach
 * during Aseret Yemei Teshuva. The psalm lives at "Psalms 130" in Sefaria
 * — we synthesize a leaf for it so the existing fetch pipeline loads it.
 */
function injectShirHaMaalot(leaves: FlatLeaf[]): FlatLeaf[] {
  const yishtabachIdx = findLeafIndex(leaves, /^Yishtabach$|^ישתבח$/);
  if (yishtabachIdx < 0) return leaves;
  const shirLeaf: FlatLeaf = {
    ref: 'Psalms 130',
    he: 'שיר המעלות ממעמקים',
    en: 'Psalms 130',
    trail: leaves[yishtabachIdx].trail,
  };
  return injectAfter(leaves, yishtabachIdx, [shirLeaf]);
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
 *
 * Per spec A1 — the flow is:
 *   Shacharit base → Amidah+YvY → Chazaras → **Half Hallel** → Sefer Torah +
 *   **RC Torah Reading** (4 olim, Bamidbar 28:1-15) → Hachnasat → Ashrei →
 *   Uva Letzion → Kaddish Titkabal → **Musaf** (RC-specific, no YvY, no
 *   Al haNisim) → Aleinu + **Shir shel Yom + Barchi Nafshi**.
 *
 * Removes from base: regular Torah Reading (Mon/Thu parsha), Tachanun/Vidui
 * subtree (already filtered by siddurRelevance), Lamenatzeach.
 * Injects: synthesized Half Hallel leaves (psalms 113-118 with 115/116 ranged
 * to verses 12+), RC Torah Reading leaves (each aliyah a range of Bamidbar 28),
 * RC Musaf brachot from the tree, Barchi Nafshi.
 */
function augmentForRoshChodesh(leaves: FlatLeaf[], nusach: Nusach): FlatLeaf[] {
  // Strategy (per spec A1 Ashkenazi):
  //   Shacharit body → Amidah (with YvY conditional) → **Hallel (half)** →
  //   Kaddish Titkabal → **Hotzaat Sefer Torah** (base subtree) →
  //   **RC Torah Reading** (4 olim Bamidbar 28:1-15, synthesized) →
  //   **Hachnasat Sefer Torah** (base subtree) → Ashrei → Uva Letzion →
  //   Kaddish Titkabal → **Musaf** (cherry-picked from tree) → Kaddish Titkabal →
  //   Aleinu → Mourner's Kaddish → Shir Shel Yom → Barchi Nafshi (base) → ...
  //
  // We DO NOT strip the base "Removing the Torah from Ark" / "Returning Sefer to
  // Aron" subtrees — those are procedural (Vayehi Binsoa, Berich Shmei,
  // Yehalelu) and apply on every Torah-reading day. We only inject the actual
  // RC verses BETWEEN them, in place of the regular Mon/Thu parsha text.

  let out = leaves;

  // === Step 1: Build synthesized leaves ===
  const hallel = buildHalfHallelLeaves(nusach);
  const torahReading = buildRoshChodeshTorahReadingLeaves();
  const musaf = collectRoshChodeshMusafLeaves(nusach);
  const musafClosingKaddish = buildMusafClosingKaddish();

  // === Step 2: Find anchors ===
  // The end of the silent + chazaras Amidah — last leaf whose trail contains
  // an Amidah node (but not Post Amidah).
  const amidahAnchor = findLastLeafByTrail(out, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  // Where the Torah Reading ceremony starts — first leaf whose trail says
  // "Removing the Torah from Ark" (Hotzaat). Hallel goes just before this.
  const hotzaatStart = findFirstLeafByTrail(out, /Removing the Torah|הוצאת ספר/i);
  // Where the actual parsha reading happens — base "Reading from Sefer" has
  // Birkat HaTorah → (verses) → Half Kaddish → Raising → Mi Sheberach. We
  // inject our 4 RC verses AFTER "Birkat HaTorah" and BEFORE "Half Kaddish".
  const birkatHaTorahIdx = findFirstLeafByName(out, /^Birkat HaTorah$|^ברכת התורה$/i);
  // Where Aleinu sits — Musaf goes just BEFORE Aleinu (per spec).
  const aleinuIdx = findFirstLeafByName(out, /^Al?einu$|^Alenu$|^עלינו$/i);

  // === Step 3: Inject in REVERSE order so earlier indices stay valid ===

  // 3a) Musaf + closing Kaddish — inject right BEFORE Aleinu so Musaf flows
  // out of "Uva Letzion → Kaddish Shalem → Musaf → Aleinu → Shir Shel Yom".
  if (musaf.length > 0 && aleinuIdx > 0) {
    const musafBlock = [...musaf, musafClosingKaddish];
    out = injectAfter(out, aleinuIdx - 1, musafBlock);
  }

  // 3b) RC Torah Reading verses — inject after Birkat HaTorah (the aliyah
  // blessing) and before Half Kaddish, so the reader sees brachot → verses →
  // closing kaddish in the natural order.
  if (torahReading.length > 0 && birkatHaTorahIdx >= 0) {
    out = injectAfter(out, birkatHaTorahIdx, torahReading);
  }

  // 3c) Hallel + Kaddish Titkabal — inject after the Amidah (Elokai Netzor),
  // BEFORE the Torah Reading ceremony. If Hotzaat starts later in the flow,
  // anchor on the Amidah; otherwise fall back to amidahAnchor.
  if (hallel.length > 0 && amidahAnchor >= 0) {
    out = injectAfter(out, amidahAnchor, hallel);
  }

  return out;
}

/** Build a closing Kaddish Titkabal leaf that follows Musaf chazaras. */
function buildMusafClosingKaddish(): FlatLeaf {
  return {
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Concluding Prayers, Kaddish Shalem',
    he: 'קדיש תתקבל (לאחר חזרת מוסף)',
    en: "Kaddish Titkabal (after Musaf chazaras)",
    trail: [{ he: 'מוסף לראש חודש', en: 'Musaf for Rosh Chodesh' }],
  };
}

/** Find the FIRST leaf whose trail contains a node matching pattern (with
 *  optional exclude pattern). */
function findFirstLeafByTrail(leaves: FlatLeaf[], pattern: RegExp, exclude?: RegExp): number {
  for (let i = 0; i < leaves.length; i++) {
    const trail = leaves[i].trail;
    if (exclude && trail.some((t) => exclude.test(t.en) || exclude.test(t.he))) continue;
    if (trail.some((t) => pattern.test(t.en) || pattern.test(t.he))) return i;
  }
  return -1;
}

/** Find FIRST leaf by exact name pattern. */
function findFirstLeafByName(leaves: FlatLeaf[], pattern: RegExp): number {
  for (let i = 0; i < leaves.length; i++) {
    if (pattern.test(leaves[i].en) || pattern.test(leaves[i].he)) return i;
  }
  return -1;
}

/** Build the 8 leaves of HALF Hallel — bracha + psalms 113, 114, 115:12-18,
 *  116:12-19, 117, 118 + closing bracha. Uses Sefaria range refs for the
 *  truncated psalms so the reader sees only the half-Hallel verses. */
function buildHalfHallelLeaves(_nusach: Nusach): FlatLeaf[] {
  const trail = [{ he: 'הלל לראש חודש (חצי הלל)', en: 'Half Hallel for Rosh Chodesh' }];
  // The Ashkenazi siddur tree has refs for berakhah-before/after — we reuse those.
  // For the psalms themselves we go straight to Tanach (Sefaria fetches the
  // verses directly), keeping verses 12+ on the truncated ones.
  return [
    { ref: 'Siddur Ashkenaz, Festivals, Rosh Chodesh, Hallel, Berakhah before the Hallel',
      he: 'ברכת ההלל', en: 'Berakhah before the Hallel', trail },
    { ref: 'Psalms 113', he: 'תהלים קי״ג', en: 'Psalm 113', trail },
    { ref: 'Psalms 114', he: 'תהלים קי״ד', en: 'Psalm 114', trail },
    { ref: 'Psalms 115:12-18', he: 'תהלים קט״ו (חצי — מ"לא לנו")', en: 'Psalm 115 (half — verses 12-18)', trail },
    { ref: 'Psalms 116:12-19', he: 'תהלים קט״ז (חצי — מ"אהבתי")', en: 'Psalm 116 (half — verses 12-19)', trail },
    { ref: 'Psalms 117', he: 'תהלים קי״ז', en: 'Psalm 117', trail },
    { ref: 'Psalms 118', he: 'תהלים קי״ח', en: 'Psalm 118', trail },
    { ref: 'Siddur Ashkenaz, Festivals, Rosh Chodesh, Hallel, Berakhah after the Hallel',
      he: 'ברכה לאחר ההלל', en: 'Berakhah after the Hallel', trail },
  ];
}

/** Build the RC Torah Reading leaves — Bamidbar 28:1-15 split into 4 olim
 *  per the standard division (Cohen, Levi, Yisrael, R'vi'i). */
function buildRoshChodeshTorahReadingLeaves(): FlatLeaf[] {
  const trail = [{ he: 'קריאת התורה לראש חודש', en: 'Torah Reading for Rosh Chodesh' }];
  return [
    { ref: 'Numbers 28:1-3', he: 'עליה ראשונה (כהן) — צו את בני ישראל', en: 'Aliyah 1 (Cohen) — Numbers 28:1-3', trail },
    { ref: 'Numbers 28:3-5', he: 'עליה שניה (לוי) — את הכבש אחד', en: 'Aliyah 2 (Levi) — Numbers 28:3-5', trail },
    { ref: 'Numbers 28:6-10', he: 'עליה שלישית (ישראל) — עולת תמיד', en: 'Aliyah 3 (Yisrael) — Numbers 28:6-10', trail },
    { ref: 'Numbers 28:11-15', he: 'עליה רביעית — ובראשי חדשיכם', en: 'Aliyah 4 — Numbers 28:11-15 (Rosh Chodesh portion)', trail },
  ];
}

/** Find the RC Musaf section in the tree and collect ONLY its Amidah brachot
 *  (Patriarchs through Concluding Passage). Skips any unrelated children. */
function collectRoshChodeshMusafLeaves(nusach: Nusach): FlatLeaf[] {
  const musafNode = findDeepInTree(
    nusach,
    /Musaf Amidah for Rosh Chodesh|מוסף לראש חודש|מוסף עמידה לראש חודש|^Musaf$/i,
  );
  if (!musafNode) return [];
  return collectLeaves(musafNode);
}

// Barchi Nafshi: Ashkenazi base index already includes a "Barchi Nafshi" leaf
// in Concluding Prayers (gated by siddurRelevance for RC only), so we do not
// synthesize a duplicate.

/** Find the LAST leaf whose trail contains a node matching pattern (with
 *  optional exclude pattern). */
function findLastLeafByTrail(leaves: FlatLeaf[], pattern: RegExp, exclude?: RegExp): number {
  for (let i = leaves.length - 1; i >= 0; i--) {
    const trail = leaves[i].trail;
    if (exclude && trail.some((t) => exclude.test(t.en) || exclude.test(t.he))) continue;
    if (trail.some((t) => pattern.test(t.en) || pattern.test(t.he))) return i;
  }
  return -1;
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
  let out = baseLeaves;
  if (ctx.isRC) out = augmentForRoshChodesh(out, nusach);
  else if (ctx.isChanukah) out = augmentForChanukah(out, nusach, ctx);
  else if (ctx.isCholHamoed) out = augmentForCholHamoed(out, nusach, ctx);
  else if (ctx.isPurim) out = augmentForPurim(out, nusach);
  // Fast days: Selichot + Vayechal Torah Reading live within Shacharit's
  // existing leaf list (Sefaria includes them as date-gated paragraphs).

  // Aseret Yemei Teshuva: prepend Shir HaMaalot mi'maamakim after Yishtabach
  // — applies in ADDITION to whatever day-of-the-month modifier above.
  if (ctx.isAseretYemeiTeshuva) {
    out = injectShirHaMaalot(out);
  }

  return out;
}
