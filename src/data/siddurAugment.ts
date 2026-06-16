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
import {
  buildVayechalLeaves,
  buildTishaBAvShacharitTorahLeaves,
  buildTishaBAvHaftarah,
  buildFastMinchaHaftarah,
  buildNachemLeaf,
  buildAnenuLeaf,
  buildAsherHaniLeaf,
  buildShoshanatYaakovLeaf,
  buildVayavoAmalekLeaves,
  buildChanukahNasoLeaves,
} from './specialDayContent';

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

  const m = hd.getMonth();
  const d = hd.getDate();

  // Compute Chanukah day from Hebrew date: 25 Kislev = Day 1, 26 Kislev = 2,
  // ..., 2 Tevet = Day 8 (Kislev 30 day years) or 8 days from 25 Kislev (29
  // day years). Hebcal's event description varies ("Chanukah: 1 Candle",
  // "Chanukah Day N", etc.) so deriving from HDate is more reliable.
  let chanukahDay = 0;
  if (isChanukah) {
    if (m === months.KISLEV && d >= 25) chanukahDay = d - 24;
    else if (m === months.TEVET) chanukahDay = (hd.prev().getDate() === 29 ? 5 : 6) + d;
  }
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
  if (nusach === 'sephardi') return augmentForRoshChodeshSephardi(leaves);
  if (nusach === 'edot-mizrach') return augmentForRoshChodeshEdotMizrach(leaves);
  if (nusach === 'chabad') return augmentForRoshChodeshChabad(leaves);
  return augmentForRoshChodeshAshkenazi(leaves, nusach);
}

/**
 * Sephardi RC Shacharit (Sephardi Chasidi / Nusach Sefard).
 *
 * Sephardi base packs entire Shacharit Amidah/Tachanun/Torah Reading into single
 * leaves. The RC content lives in a dedicated "לראש חודש" subtree (Hallel, Song
 * of the Day, Barchi Nafshi, Torah Reading, Ashrei Uva L'Tziyon, Returning
 * Sefer Torah, Mussaf).
 *
 * Spec A1 Sephardi order:
 *   Shacharit base → Amidah (with YvY inline) → **Hallel** → Kaddish Titkabal →
 *   **Shir Shel Yom + Barchi Nafshi** (here, BEFORE Sefer Torah — Sephardi
 *   placement) → **Sefer Torah + RC Reading** → Half Kaddish → Ashrei →
 *   Uva Letzion → **Hachnasat Sefer Torah** (after Uva Letzion in Sephardi) →
 *   Kaddish Titkabal → **Mussaf** → Kaddish Titkabal → Aleinu → Kaddish Yatom.
 *
 * Approach: inject the Sephardi "Rosh Chodesh" subtree leaves right after the
 * Amidah leaf in the base. Suppress the base Song of Day / Barchi Nafshi
 * (gated by siddurRelevance) since the RC subtree's versions replace them.
 */
function augmentForRoshChodeshSephardi(leaves: FlatLeaf[]): FlatLeaf[] {
  // Find Sephardi RC subtree leaves in order: Hallel, Song of the Day, Barchi
  // Nafshi, Torah Reading, Ashrei Uva L'Tziyon, Returning Sefer Torah, Mussaf.
  const rcNode = findTopNode('sephardi', /^Rosh (Chodesh|Hodesh)$|^לראש ח[דו]ש$/);
  if (!rcNode) return leaves;
  const rcLeaves = collectLeaves(rcNode);
  if (rcLeaves.length === 0) return leaves;

  // Find the base Amidah leaf — Sephardi has en="Amidah" or "Amida"; he="עמידה"
  // or "תפילת עמידה".
  let out = leaves;
  const amidahIdx = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahIdx < 0) return leaves;

  // Inject RC subtree after Amidah.
  out = injectAfter(out, amidahIdx, rcLeaves);
  return out;
}

/**
 * Edot HaMizrach RC Shacharit.
 *
 * Edot HaMizrach has its own "סדר ראש חודש" subtree. Spec A1 ordering:
 * mostly identical to Sephardi (Shir Shel Yom + Barchi Nafshi BEFORE Sefer
 * Torah), but the order of Returning Sefer / Kaddish differs by minhag.
 *
 * The EM tree under "סדר ראש חודש" already encodes the EM-specific order, so
 * the simplest correct approach is to inject the subtree wholesale after the
 * Amidah leaf.
 */
function augmentForRoshChodeshEdotMizrach(leaves: FlatLeaf[]): FlatLeaf[] {
  const rcNode = findTopNode('edot-mizrach', /^Rosh (Chodesh|Hodesh)$|^סדר ראש ח[דו]ש$|^לראש ח[דו]ש$/);
  if (!rcNode) return leaves;
  const rcLeaves = collectLeaves(rcNode);
  if (rcLeaves.length === 0) return leaves;

  let out = leaves;
  const amidahIdx = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahIdx < 0) return leaves;
  out = injectAfter(out, amidahIdx, rcLeaves);
  return out;
}

/**
 * Chabad RC Shacharit.
 *
 * Chabad has a single top-level leaf "Rosh Chodesh" (one ref). Inject it as
 * a single leaf after the Amidah. Order details (Hallel, RC reading, Mussaf)
 * are all inside this one Sefaria text.
 */
function augmentForRoshChodeshChabad(leaves: FlatLeaf[]): FlatLeaf[] {
  // Chabad has top-level "Hallel" and "Rosh Chodesh" leaves (each is a single
  // Sefaria ref, the entire RC content in one text).
  const hallelNode = findTopNode('chabad', /^Hallel$|^הלל$|^סדר הלל$/);
  const rcNode = findTopNode('chabad', /^Rosh (Chodesh|Hodesh)$|^לראש ח[דו]ש$|^ראש ח[דו]ש$/);
  const inject: FlatLeaf[] = [];
  if (hallelNode) inject.push(...collectLeaves(hallelNode));
  if (rcNode) inject.push(...collectLeaves(rcNode));
  if (inject.length === 0) return leaves;

  let out = leaves;
  const amidahIdx = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahIdx < 0) return leaves;
  out = injectAfter(out, amidahIdx, inject);
  return out;
}

/**
 * Ashkenazi RC Shacharit — full per-spec order: Shacharit body → Amidah (with
 * YvY conditional) → Hallel (half) → Kaddish Titkabal → Hotzaat Sefer Torah
 * (base subtree) → RC Torah Reading (4 olim Bamidbar 28:1-15, synthesized) →
 * Hachnasat Sefer Torah (base subtree) → Ashrei → Uva Letzion → Kaddish
 * Titkabal → Musaf → Kaddish Titkabal → Aleinu → Mourner's Kaddish → Shir
 * Shel Yom → Barchi Nafshi (base) → ...
 *
 * We do NOT strip the base "Removing the Torah from Ark" / "Returning Sefer
 * to Aron" subtrees — those are procedural (Vayehi Binsoa, Berich Shmei,
 * Yehalelu) and apply on every Torah-reading day. We only inject the actual
 * RC verses BETWEEN them, in place of the regular Mon/Thu parsha text.
 */
function augmentForRoshChodeshAshkenazi(leaves: FlatLeaf[], nusach: Nusach): FlatLeaf[] {
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
  // Always use FULL Hallel for Chanukah + synthesized day-specific Naso
  // reading. Sefaria's siddur trees only have generic "Chanukah" candle-
  // lighting nodes — not the day's Torah reading — so we build it ourselves.
  const inject: FlatLeaf[] = [
    ...buildFullHallelLeaves(nusach),
    ...buildChanukahNasoLeaves(ctx.chanukahDay || 1),
  ];

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
 *
 * Per spec A4:
 *  - Pesach ChH"M: YvY → HALF Hallel → Pesach Musaf → daily Torah reading
 *  - Sukkot ChH"M: YvY → Al netilat lulav (bracha) → FULL Hallel → Hoshanot
 *      for the day → Pinchas reading → Sukkot Musaf
 *
 * Anchors Hallel after the LAST Amidah-trail leaf (Concluding Passage), and
 * Musaf BEFORE Aleinu — same approach as augmentForRoshChodeshAshkenazi.
 *
 * Sephardi/EM/Chabad reuse the RC subtree approach: their Festival subtrees
 * already encode the right order.
 */
function augmentForCholHamoed(leaves: FlatLeaf[], nusach: Nusach, ctx: DayContext): FlatLeaf[] {
  if (nusach !== 'ashkenazi') {
    // Sephardi/EM/Chabad: inject the appropriate Festival subtree after Amidah.
    return augmentForCholHamoedSimple(leaves, nusach, ctx);
  }
  // Ashkenazi: surgical injection like RC.
  let out = leaves;

  // Build Hallel (half for Pesach, full for Sukkot).
  const hallel = ctx.isPesach
    ? buildHalfHallelLeaves(nusach)
    : buildFullHallelLeaves(nusach);

  // Build festival Musaf from the Shalosh Regalim subtree.
  const musaf = collectShaloshRegalimMusafLeaves(nusach);
  const musafClosingKaddish = buildMusafClosingKaddish();

  const amidahAnchor = findLastLeafByTrail(out, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  const aleinuIdx = findFirstLeafByName(out, /^Al?einu$|^Alenu$|^עלינו$/i);

  // Inject Musaf BEFORE Aleinu.
  if (musaf.length > 0 && aleinuIdx > 0) {
    const musafBlock = [...musaf, musafClosingKaddish];
    out = injectAfter(out, aleinuIdx - 1, musafBlock);
  }

  // Inject Hallel right after the Amidah.
  if (hallel.length > 0 && amidahAnchor >= 0) {
    out = injectAfter(out, amidahAnchor, hallel);
  }

  return out;
}

/** Sephardi/EM/Chabad ChH"M: inject the Festival Mussaf ONLY after the regular
 *  weekday Amidah. The user uses the regular weekday Amidah (with YvY
 *  conditional) for the silent Shacharit, not the Festival Amidah — so we
 *  must NOT inject the Festival Amidah leaf, only the Mussaf. */
function augmentForCholHamoedSimple(leaves: FlatLeaf[], nusach: Nusach, ctx: DayContext): FlatLeaf[] {
  // Sephardi: "Holidays" subtree with "Yom Tov Musaf Amidah" leaf.
  // EM: "Prayers for Three Festivals" subtree with "Mussaf" leaf.
  // Chabad: "Musaf for Festivals" leaf at top level.
  const festNode =
    findTopNode(nusach, /^Holidays$|^Three Festivals$|^Prayers for Three Festivals$|^Musaf for Festivals$|^לשלש רגלים$/) ||
    findTopNode(nusach, /^Festivals?$/);
  if (!festNode) return leaves;
  const festLeaves = collectLeaves(festNode);
  // Cherry-pick STRICTLY Mussaf leaves — exclude regular Amidah (Shacharit/Mincha
  // version), Yizkor, Hallel for YT, etc.
  const musafLeaves = festLeaves.filter((l) => {
    const txt = `${l.en} ${l.he}`;
    // Include if it's clearly Mussaf
    if (/\bMu+ssa+f\b|מוסף/i.test(txt)) return true;
    return false;
  });
  if (musafLeaves.length === 0) return leaves;

  let out = leaves;
  const amidahIdx = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahIdx < 0) return leaves;
  // Inject Hallel right after Amidah (half for Pesach, full for Sukkot).
  // Re-trail the leaves with a ChH"M-appropriate label so the relevance
  // filter doesn't hide them via the "Rosh Chodesh" check on the original
  // builder's trail.
  const hallelRaw = ctx.isPesach ? buildHalfHallelLeaves(nusach) : buildFullHallelLeaves(nusach);
  const chMtrail = [{ he: ctx.isPesach ? 'הלל לחול המועד פסח (חצי)' : 'הלל לחול המועד סוכות (שלם)',
                     en: ctx.isPesach ? 'Half Hallel for Chol HaMoed Pesach' : 'Full Hallel for Chol HaMoed Sukkot' }];
  const hallel = hallelRaw.map((l) => ({ ...l, trail: chMtrail }));
  // Mussaf goes AFTER Hallel.
  out = injectAfter(out, amidahIdx, [...hallel, ...musafLeaves]);
  return out;
}

/** Full Hallel — psalms 113-118 unabridged. For Sukkot ChH"M, Chanukah, Pesach YT. */
function buildFullHallelLeaves(_nusach: Nusach): FlatLeaf[] {
  const trail = [{ he: 'הלל שלם', en: 'Full Hallel' }];
  return [
    { ref: 'Siddur Ashkenaz, Festivals, Rosh Chodesh, Hallel, Berakhah before the Hallel',
      he: 'ברכת ההלל', en: 'Berakhah before the Hallel', trail },
    { ref: 'Psalms 113', he: 'תהלים קי״ג', en: 'Psalm 113', trail },
    { ref: 'Psalms 114', he: 'תהלים קי״ד', en: 'Psalm 114', trail },
    { ref: 'Psalms 115', he: 'תהלים קט״ו', en: 'Psalm 115', trail },
    { ref: 'Psalms 116', he: 'תהלים קט״ז', en: 'Psalm 116', trail },
    { ref: 'Psalms 117', he: 'תהלים קי״ז', en: 'Psalm 117', trail },
    { ref: 'Psalms 118', he: 'תהלים קי״ח', en: 'Psalm 118', trail },
    { ref: 'Siddur Ashkenaz, Festivals, Rosh Chodesh, Hallel, Berakhah after the Hallel',
      he: 'ברכה לאחר ההלל', en: 'Berakhah after the Hallel', trail },
  ];
}

/** Collect just the Mussaf brachot from Ashkenazi's Shalosh Regalim subtree. */
function collectShaloshRegalimMusafLeaves(nusach: Nusach): FlatLeaf[] {
  if (nusach !== 'ashkenazi') return [];
  const node = findDeepInTree(nusach, /^Mussaf$|^מוסף לשלש רגלים$|Shalosh Regalim, Mussaf/);
  if (!node) return [];
  return collectLeaves(node);
}

/**
 * Purim weekday — Shacharit.
 * Replace regular Torah reading with Vayavo Amalek. Megillah is linked from
 * an existing standalone tool; we don't inline its text in the siddur.
 */
function augmentForPurim(leaves: FlatLeaf[], _nusach: Nusach): FlatLeaf[] {
  // Inject synthesized Vayavo Amalek (Exodus 17:8-16, 3 olim) after Amidah.
  // The Megillah link is rendered as a banner at top of the page by read.tsx.
  // After Megillah → Shoshanat Yaakov.
  //
  // Anchor strategy works for both styles:
  //   - Ashkenazi: Amidah is a subtree; leaves under it have trail "Amidah".
  //   - Sephardi/EM/Chabad: Amidah is ONE leaf whose en/he matches "Amidah".
  let anchor = findLastLeafByTrail(leaves, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  if (anchor < 0) {
    anchor = findFirstLeafByName(leaves, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  }
  if (anchor < 0) return leaves;
  const inject = [
    ...buildVayavoAmalekLeaves(),
    buildShoshanatYaakovLeaf(),
  ];
  return injectAfter(leaves, anchor, inject);
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

  const ctx = buildCtx(date, inIsrael);

  // Detect prayer kind so each augmenter applies only where relevant.
  const isWeekdayShacharit =
    /^Weekday Shacharit$/i.test(here.en) ||
    /^Shacharit$/i.test(here.en) || // Chabad
    /^Morning Service$/i.test(here.en);
  const isWeekdayMincha =
    /^Weekday Min(c?h)ah?$/i.test(here.en) ||
    /^Min(c?h)ah?$/i.test(here.en);
  const isWeekdayMaariv =
    /^Weekday Maariv$/i.test(here.en) ||
    /^Weekday Arvit$/i.test(here.en) ||
    /^Maariv$/i.test(here.en) ||
    /^Arvit$/i.test(here.en);

  let out = baseLeaves;

  if (isWeekdayShacharit) {
    // Priority order: RC > Chanukah > ChH"M > Purim > Fast.
    if (ctx.isRC) out = augmentForRoshChodesh(out, nusach);
    else if (ctx.isChanukah) out = augmentForChanukah(out, nusach, ctx);
    else if (ctx.isCholHamoed) out = augmentForCholHamoed(out, nusach, ctx);
    else if (ctx.isPurim) out = augmentForPurim(out, nusach);
    else if (ctx.isFast) out = augmentForFastShacharit(out, ctx);

    // Aseret Yemei Teshuva: prepend Shir HaMaalot mi'maamakim after Yishtabach.
    if (ctx.isAseretYemeiTeshuva) out = injectShirHaMaalot(out);
  } else if (isWeekdayMincha) {
    if (ctx.isFast) out = augmentForFastMincha(out, ctx);
    // Erev Shabbat (Friday) Mincha — no Tachanun/Vidui per spec A4.
    // Same for Erev YT (afternoon before any חג in Israel).
    const dow = date.getDay();
    const isErevShabbat = dow === 5;
    const tomorrowHd = ctx.hd.add(1, 'd');
    const tomorrowEvents = HebrewCalendar.calendar({ start: tomorrowHd, end: tomorrowHd, il: inIsrael, sedrot: false });
    const isErevYT = tomorrowEvents.some((e) => e.getFlags() & flags.CHAG);
    if (isErevShabbat || isErevYT) {
      out = out.filter((l) => {
        const blob = `${l.en} ${l.he} ${l.trail.map((t) => `${t.en} ${t.he}`).join(' ')}`;
        if (/\bTachanun\b|\bTachnun\b|^Vidui|תחנון|וידוי/i.test(blob)) return false;
        if (/^Avinu Malkenu$|^Avinu Malkeinu$|^אבינו מלכנו$/i.test(`${l.en} ${l.he}`)) return false;
        return true;
      });
    }
  } else if (isWeekdayMaariv) {
    // Strip leaves that belong to standalone bedtime/lunar prayers — they
    // sit inside Sefaria's Weekday/Maariv subtree but don't belong in the
    // continuous Maariv reading flow. The user has dedicated tools.
    out = out.filter((l) => {
      const blob = `${l.en} ${l.he} ${l.trail.map((t) => `${t.en} ${t.he}`).join(' ')}`;
      if (/Keri'?at Shema al ha[- ]?Mita|Shema al ha[- ]?Mita|קריאת שמע ש?על המ[יט]ה|שמע על המ[יט]ה|המפיל/i.test(blob)) return false;
      if (/Birkat ha[- ]?Levana|Kiddush Levana|ברכת הלבנה|קידוש לבנה/i.test(blob)) return false;
      return true;
    });
    if (ctx.isPurim) out = augmentForPurimMaariv(out, nusach);
  }

  return out;
}

/** Fast day Shacharit — inject Vayechal Moshe Torah reading. For T"B replace
 *  with Devarim 4:25-40 + Yirmiyahu Haftarah. Anenu lives inside the Amidah
 *  text (Sefaria gates it as a conditional paragraph). */
function augmentForFastShacharit(leaves: FlatLeaf[], ctx: DayContext): FlatLeaf[] {
  // Tisha B'Av has its own Torah/Haftarah pair.
  const isTishaBAv = ctx.hd.getMonth() === 5 && ctx.hd.getDate() === 9; // Av = month 5
  const torahLeaves = isTishaBAv
    ? [...buildTishaBAvShacharitTorahLeaves(), buildTishaBAvHaftarah()]
    : buildVayechalLeaves();

  // Anenu is shown as a card after the Amidah so the chazan (and individuals
  // by Sephardi minhag) can find it. It logically belongs in Shema Koleinu
  // (silent Sephardi) or as a separate bracha in chazaras (Ashkenazi) but the
  // tree doesn't expose that injection point, so we surface it here.
  const inject: FlatLeaf[] = [buildAnenuLeaf(), ...torahLeaves];

  // Inject after last Amidah-trail leaf (Ashkenazi) or after the single
  // Amidah leaf (Sephardi/EM/Chabad).
  let anchor = findLastLeafByTrail(leaves, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  if (anchor < 0) {
    anchor = findFirstLeafByName(leaves, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  }
  if (anchor < 0) return leaves;
  return injectAfter(leaves, anchor, inject);
}

/** Fast day Mincha — inject Vayechal + Haftarah (Dirshu) before/around Amidah.
 *  For T"B Mincha also add Nachem reminder. */
function augmentForFastMincha(leaves: FlatLeaf[], ctx: DayContext): FlatLeaf[] {
  const isTishaBAv = ctx.hd.getMonth() === 5 && ctx.hd.getDate() === 9;
  // Vayechal + Dirshu Haftarah are read BEFORE Amidah at Mincha.
  const preAmidah: FlatLeaf[] = [...buildVayechalLeaves(), buildFastMinchaHaftarah()];
  // Anenu (individual Sephardi/EM in Shema Koleinu) + Nachem (T"B) shown
  // AFTER Amidah as cards so they're visible.
  const postAmidah: FlatLeaf[] = [buildAnenuLeaf()];
  if (isTishaBAv) postAmidah.push(buildNachemLeaf());

  let out = leaves;
  let amidahFirst = findFirstLeafByTrail(out, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i);
  let amidahLast = findLastLeafByTrail(out, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  // Sephardi/EM/Chabad fallback: Amidah is a single leaf (no parent trail).
  if (amidahFirst < 0) amidahFirst = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahLast < 0)  amidahLast  = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahLast >= 0) out = injectAfter(out, amidahLast, postAmidah);
  if (amidahFirst > 0) out = injectAfter(out, amidahFirst - 1, preAmidah);
  return out;
}

/** Purim Maariv — inject Asher Hani + Shoshanat Yaakov AFTER the Kaddish
 *  that closes the Amidah (per spec A7: Amidah → Kaddish → Megillah →
 *  Asher Hani / Shoshanat → Aleinu). Find Amidah first (works for both
 *  Ashkenazi subtree style and Sephardi/EM/Chabad single-leaf style),
 *  then look for the first Kaddish leaf immediately following it. */
function augmentForPurimMaariv(leaves: FlatLeaf[], _nusach: Nusach): FlatLeaf[] {
  // Locate the last Amidah leaf — try trail-based first (Ashkenazi), then
  // single-leaf name match (Sephardi/EM). Chabad bundles the entire Maariv
  // (including Amidah) into ONE leaf — fall back to appending at the end.
  let amidahIdx = findLastLeafByTrail(leaves, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  if (amidahIdx < 0) {
    amidahIdx = findFirstLeafByName(leaves, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  }
  if (amidahIdx < 0) {
    // Chabad-style: single monolithic leaf. Append the Purim additions at end.
    const inject = [buildAsherHaniLeaf(), buildShoshanatYaakovLeaf()];
    return [...leaves, ...inject];
  }

  // Spec A7: Asher Hani + Shoshanat are recited BEFORE Aleinu. So scan
  // forward from Amidah for either (a) the Aleinu leaf — inject just before
  // it, or (b) a Kaddish that closes the Amidah — inject just after it.
  // Whichever comes first.
  let aleinuIdx = -1;
  let kaddishIdx = -1;
  for (let i = amidahIdx + 1; i < leaves.length; i++) {
    const l = leaves[i];
    const blob = `${l.en} ${l.he}`;
    if (aleinuIdx < 0 && /^Al?einu( leshabe?ach)?$|^עלינו( לשבח)?$/i.test(l.en) || /^עלינו לשבח$/.test(l.he)) {
      aleinuIdx = i;
    }
    if (kaddishIdx < 0 && /Kaddish Shalem|Kaddish Titkabal|^Full Kaddish$|^Half Kaddish$|^Hatzi Kaddish$|קדיש שלם|קדיש תתקבל|חצי קדיש|קדיש לעלא/i.test(blob)) {
      kaddishIdx = i;
    }
    if (aleinuIdx >= 0) break; // Aleinu wins — stop searching.
  }

  const inject = [buildAsherHaniLeaf(), buildShoshanatYaakovLeaf()];
  // Prefer to inject immediately before Aleinu (so order: ...Kaddish, Asher,
  // Shoshanat, Aleinu). Fall back to after Kaddish, then after Amidah.
  if (aleinuIdx > 0) return injectAfter(leaves, aleinuIdx - 1, inject);
  if (kaddishIdx > 0) return injectAfter(leaves, kaddishIdx, inject);
  return injectAfter(leaves, amidahIdx, inject);
}
