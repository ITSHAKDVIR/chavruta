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
  buildFastMinchaHotzaa,
  buildFastMinchaHachnasa,
  buildFastMinchaReadingKaddish,
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
  isYomAtzmaut: boolean;      // Hallel (with bracha) + Haftarah, no Musaf
  isYomYerushalayim: boolean; // Hallel (with bracha), no Musaf
};

function buildCtx(date: Date, inIsrael: boolean): DayContext {
  const hd = new HDate(date);
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  const isRC = events.some((e) => e.getFlags() & flags.ROSH_CHODESH);
  const isCholHamoed = events.some((e) => e.getFlags() & flags.CHOL_HAMOED);
  const isFast = events.some((e) => e.getFlags() & (flags.MAJOR_FAST | flags.MINOR_FAST));
  const isChanukah = events.some((e) => /Chanukah|Hanukkah/i.test(e.getDesc()));
  // NOTE: exclude "Erev Purim" — that's Ta'anit Esther (a FAST), which must get
  // the fast flow (Anenu + Vayechal), not the Purim flow (Vayavo Amalek).
  const isPurim = events.some((e) => /Purim|Shushan/i.test(e.getDesc()) && !/Erev/i.test(e.getDesc()));

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
  // Yom HaAtzmaut / Yom Yerushalayim — hebcal places the event on the OBSERVED
  // day (handles the Fri/Sat/Mon shift), so detect by event description.
  const isYomAtzmaut = events.some((e) => /Yom HaAtzma|Atzma'?ut/i.test(e.getDesc()));
  const isYomYerushalayim = events.some((e) => /Yom Yerushalayim|Jerusalem Day/i.test(e.getDesc()));

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
    isYomAtzmaut,
    isYomYerushalayim,
  };
}

// NOTE: We do NOT synthesize a Shir HaMaalot (Tehillim 130) leaf for Aseret
// Yemei Teshuva. Every nusach already carries it natively, gated by its own
// "בעשרת ימי תשובה מוסיפין" marker: Sefard inside the Yishtabach leaf,
// Ashkenaz as a "Psalm 130" leaf in Pesukei Dezimra. Injecting one duplicated
// it (the user saw שיר המעלות twice in AYT Shacharit).

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
function augmentForRoshChodesh(leaves: FlatLeaf[], nusach: Nusach, ctx: DayContext): FlatLeaf[] {
  if (nusach === 'sephardi') return augmentForRoshChodeshSephardi(leaves, ctx);
  if (nusach === 'edot-mizrach') return augmentForRoshChodeshEdotMizrach(leaves, ctx);
  if (nusach === 'chabad') return augmentForRoshChodeshChabad(leaves, ctx);
  return augmentForRoshChodeshAshkenazi(leaves, nusach, ctx);
}

/** Rosh Chodesh Tevet falls during Chanukah. On those days Hallel is FULL
 *  (Chanukah overrides RC's half-Hallel) and a 4th oleh reads the Chanukah
 *  Nasi portion of the day after the 3 Rosh Chodesh aliyot. This helper
 *  returns the day's Chanukah Naso leaves to append, or [] when not Chanukah. */
function rcChanukahExtraReading(ctx: DayContext): FlatLeaf[] {
  if (!ctx.isChanukah) return [];
  return buildChanukahNasoLeaves(ctx.chanukahDay || 1);
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
function augmentForRoshChodeshSephardi(leaves: FlatLeaf[], ctx: DayContext): FlatLeaf[] {
  const rcNode = findTopNode('sephardi', /^Rosh (Chodesh|Hodesh)$|^לראש ח[דו]ש$/);
  if (!rcNode) return leaves;
  const rc = collectLeaves(rcNode);
  const pick = (re: RegExp) => rc.filter((l) => re.test(l.en) || re.test(l.he));
  // The Sephardi RC subtree carries the RC-specific pieces. Its Hallel and
  // Mussaf texts ALREADY end with their own Kaddish (Shalem/Titkabal), so we
  // do NOT append a synthetic one. The subtree's OWN order (leaf indices) is
  // the correct Sephardi sequence: Hallel → Torah Reading → Ashrei/Uva Letzion
  // → Returning Sefer → Mussaf. (Its Song of Day + Barchi Nafshi leaves are
  // mis-placed near the top, so we ignore them and use the base copies at the
  // very end instead.)
  const hallel = pick(/^Hallel$|^סדר הלל$|הלל/);
  const rcTorah = pick(/^Torah Reading$|קריאת התורה/);
  const ashreiUva = pick(/^Ashrei Uva|אשרי ובא/);
  const returning = pick(/^Returning|החזרת ספר/);
  const musaf = pick(/^Muss?af$|^מוסף/);
  if (hallel.length === 0 || musaf.length === 0) return leaves;

  // Remove the base weekday copies of pieces the RC subtree supplies (Torah
  // Reading, the Mon/Thu reading preamble, Ashrei, Uva Letzion/Beit Yaakov).
  // Relocate the base Song of the Day + Barchi Nafshi to the very END so the
  // closing reads ...Musaf → Aleinu → Song of Day → Barchi Nafshi (one closing,
  // no duplication — the previous bug injected the subtree as one block, so
  // Song/Barchi rendered right after Hallel and again after Musaf).
  const isReplaced = (l: FlatLeaf) =>
    /Weekday Shacharit/i.test(l.ref) &&
    /^(Torah Reading|For Monday & Thursday|Ashrei|Beit Yaakov|Uva Le[SZ]ion)$/i.test(l.en);
  const isTailSong = (l: FlatLeaf) =>
    /Weekday Shacharit/i.test(l.ref) && /^(Song of the Day|Barchi Nafshi)$/i.test(l.en);
  const songBarchi = leaves.filter(isTailSong);
  let out = leaves.filter((l) => !isReplaced(l) && !isTailSong(l));

  const amidahIdx = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahIdx < 0) return leaves;

  const closing = [
    ...hallel,
    ...rcTorah, ...rcChanukahExtraReading(ctx),
    ...ashreiUva, ...returning,
    ...musaf,
  ];
  out = injectAfter(out, amidahIdx, closing);
  return [...out, ...songBarchi];
}

/**
 * Edot HaMizrach RC Shacharit.
 *
 * Keep the base weekday flow (Torah Reading, Ashrei, Uva Letzion are correct
 * there) and surgically interleave the RC-specific pieces from the "סדר ראש
 * חודש" subtree at Ashkenazi-style anchors:
 *   Amidah → Hallel → [base Torah Reading] → Ashrei/Uva Letzion → **Musaf**
 *   → ... → Aleinu → **Song of Day → Barchi Nafshi** (at the END).
 * The previous bug anchored Musaf just before Aleinu — but the base Song of
 * Day sits before Aleinu, so Musaf landed AFTER Song of Day ("Musaf too late").
 * The EM subtree Musaf has NO trailing Kaddish, so we append one; its Hallel
 * already ends with Kaddish.
 */
function augmentForRoshChodeshEdotMizrach(leaves: FlatLeaf[], ctx: DayContext): FlatLeaf[] {
  const rcNode = findTopNode('edot-mizrach', /^Rosh (Chodesh|Hodesh)$|^סדר ראש ח[דו]ש$|^לראש ח[דו]ש$/);
  if (!rcNode) return leaves;
  const rcAll = collectLeaves(rcNode);
  const hallel = rcAll.filter((l) => /^Hallel$/i.test(l.en) || /הלל/.test(l.he));
  const musaf = rcAll.filter((l) => /^Muss?af$/i.test(l.en) || /^מוסף/.test(l.he));
  const barchi = rcAll.filter((l) => /^Barchi Nafshi$/i.test(l.en) || /ברכי נפשי/.test(l.he));
  const chanukahReading = rcChanukahExtraReading(ctx);
  if (hallel.length === 0 && musaf.length === 0) return leaves;

  // Relocate the base Song of the Day to the very END (Barchi Nafshi follows it).
  const isTailSong = (l: FlatLeaf) =>
    /Weekday Shacharit/i.test(l.ref) && /^Song of the Day$/i.test(l.en);
  const song = leaves.filter(isTailSong);
  let out = leaves.filter((l) => !isTailSong(l));

  // Anchors on the (Song-removed) base — all before Song, so still valid.
  const amidahIdx = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahIdx < 0) return leaves;
  const uvaIdx = findLastLeafByName(out, /^(Ashrei|Uva Le[SZ]ion|Beit Yaakov)$/i);
  const torahIdx = findFirstLeafByName(out, /^Torah Reading$|^קריאת התורה$/i);

  // Inject from the LATEST anchor to the earliest so indices stay valid.
  // 1) Musaf (+ Kaddish Titkabal) right after the Ashrei/Uva Letzion block.
  if (musaf.length && uvaIdx >= 0) out = injectAfter(out, uvaIdx, [...musaf, buildMusafClosingKaddish()]);
  // 2) RC-Tevet (Chanukah) extra Nasi reading right after the base Torah Reading.
  if (chanukahReading.length && torahIdx >= 0) out = injectAfter(out, torahIdx, chanukahReading);
  // 3) Hallel right after the Amidah (its text ends with its own Kaddish).
  if (hallel.length) out = injectAfter(out, amidahIdx, hallel);
  // 4) Song of the Day + Barchi Nafshi at the very END.
  return [...out, ...song, ...barchi];
}

/**
 * Chabad RC Shacharit.
 *
 * Chabad's "ראש חודש" leaf is ONLY the Musaf (Kedusha "כתר" + RC brachot +
 * Kaddish Shalem). Its base weekday Shacharit has a Song of the Day but NO
 * Barchi Nafshi. Interleave Ashkenazi-style:
 *   Amidah → Hallel → [base Torah Reading] → Ashrei/Uva Letzion → **Musaf**
 *   → ... → Aleinu → **Song of Day → Barchi Nafshi (synthesized, Ps 104)**.
 * The previous bug injected Hallel + Musaf together right after the Amidah, so
 * Musaf came BEFORE the reading; and Barchi Nafshi was missing entirely.
 */
function augmentForRoshChodeshChabad(leaves: FlatLeaf[], ctx: DayContext): FlatLeaf[] {
  const hallelNode = findTopNode('chabad', /^Hallel$|^הלל$|^סדר הלל$/);
  const rcNode = findTopNode('chabad', /^Rosh (Chodesh|Hodesh)$|^לראש ח[דו]ש$|^ראש ח[דו]ש$/);
  const hallel = hallelNode ? collectLeaves(hallelNode) : [];
  const musaf = rcNode ? collectLeaves(rcNode) : []; // Chabad "Rosh Chodesh" = Musaf only
  const chanukahReading = rcChanukahExtraReading(ctx);
  if (hallel.length === 0 && musaf.length === 0) return leaves;

  // Relocate the base Song of the Day to the very END; a synthesized Barchi
  // Nafshi (Chabad has none) follows it.
  const isTailSong = (l: FlatLeaf) =>
    /^Song of the Day$|^שיר של יום$/i.test(l.en) && !/Rosh Chodesh|ראש ח[דו]ש/i.test(l.ref);
  const song = leaves.filter(isTailSong);
  let out = leaves.filter((l) => !isTailSong(l));

  const amidahIdx = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahIdx < 0) return leaves;
  const uvaIdx = findLastLeafByName(out, /^Ashrei|^Uva Le[SZ]ion|^אשרי|ובא לציון/i);
  const torahIdx = findFirstLeafByName(out, /^Torah Reading$|^קריאת התורה$/i);

  // Inject from latest anchor to earliest. Musaf after Ashrei/Uva Letzion.
  if (musaf.length && uvaIdx >= 0) out = injectAfter(out, uvaIdx, musaf);
  else if (musaf.length) out = injectAfter(out, torahIdx >= 0 ? torahIdx : amidahIdx, musaf);
  if (chanukahReading.length && torahIdx >= 0) out = injectAfter(out, torahIdx, chanukahReading);
  if (hallel.length) out = injectAfter(out, amidahIdx, hallel);
  // Song of the Day + synthesized Barchi Nafshi at the very END.
  return [...out, ...song, buildBarchiNafshiLeaf()];
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
function augmentForRoshChodeshAshkenazi(leaves: FlatLeaf[], nusach: Nusach, ctx: DayContext): FlatLeaf[] {
  let out = leaves;

  // === Step 1: Build synthesized leaves ===
  // RC Tevet falls during Chanukah → FULL Hallel (Chanukah overrides RC's
  // half Hallel), and a 4th oleh reads the day's Chanukah Nasi portion after
  // the 3 Rosh Chodesh aliyot.
  const hallel = ctx.isChanukah ? buildFullHallelLeaves(nusach) : buildHalfHallelLeaves(nusach);
  const torahReading = [...buildRoshChodeshTorahReadingLeaves(), ...rcChanukahExtraReading(ctx)];
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
  // RC has Musaf → Kaddish Titkabal closes the Hallel.
  if (hallel.length > 0 && amidahAnchor >= 0) {
    out = injectAfter(out, amidahAnchor, [...hallel, buildHallelClosingKaddish(true)]);
  }

  return out;
}

/** Kaddish after Hallel. Rule (per R. Dvir): when there's a Musaf today →
 *  Kaddish Titkabal; when there's no Musaf → Half Kaddish. Hallel-without-Musaf
 *  days are Chanukah (non-RC), Yom HaAtzmaut, Yom Yerushalayim. The synthesized
 *  Hallel (buildHalf/FullHallelLeaves) carries no kaddish, so we append one. */
function buildHallelClosingKaddish(hasMusaf: boolean): FlatLeaf {
  const trail = [{ he: 'הלל', en: 'Hallel' }];
  return hasMusaf
    ? { ref: 'Siddur Ashkenaz, Weekday, Shacharit, Concluding Prayers, Kaddish Shalem',
        he: 'קדיש תתקבל (אחרי הלל)', en: 'Kaddish Titkabal after Hallel', trail }
    : { ref: 'Siddur Ashkenaz, Kaddish, Half Kaddish',
        he: 'חצי קדיש (אחרי הלל)', en: 'Half Kaddish after Hallel', trail };
}

/** Build a closing Kaddish Titkabal leaf that follows Musaf chazaras. */
function buildMusafClosingKaddish(): FlatLeaf {
  return {
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Concluding Prayers, Kaddish Shalem',
    he: 'קדיש תתקבל (לאחר חזרת מוסף)',
    en: "Kaddish Titkabal (after Musaf chazaras)",
    // Neutral trail — this kaddish is injected on every Musaf day (RC AND Chol
    // HaMoed), so the trail must NOT be "Musaf for Rosh Chodesh" (which the
    // relevance filter rejects on Chol HaMoed, dropping the kaddish).
    trail: [{ he: 'אחרי מוסף', en: 'Concluding Kaddish' }],
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

/** Find LAST leaf by name pattern (for anchoring after a multi-leaf block). */
function findLastLeafByName(leaves: FlatLeaf[], pattern: RegExp): number {
  for (let i = leaves.length - 1; i >= 0; i--) {
    if (pattern.test(leaves[i].en) || pattern.test(leaves[i].he)) return i;
  }
  return -1;
}

/** Synthesized Barchi Nafshi (Psalm 104) — for nuschaot whose base has no
 *  Barchi Nafshi leaf (Chabad). Real Tanach; said at the END of RC Shacharit,
 *  immediately after the Song of the Day. */
function buildBarchiNafshiLeaf(): FlatLeaf {
  return {
    ref: 'Psalms 104',
    he: 'ברכי נפשי — תהלים ק״ד',
    en: 'Barchi Nafshi — Psalm 104',
    trail: [{ he: 'ברכי נפשי לראש חודש', en: 'Barchi Nafshi for Rosh Chodesh' }],
  };
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
  // Chanukah (non-RC) has NO Musaf → Half Kaddish closes the Hallel, then the
  // day's Torah reading. (RC Tevet during Chanukah goes through the RC path,
  // which has Musaf and uses Kaddish Titkabal.)
  const inject: FlatLeaf[] = [
    ...buildFullHallelLeaves(nusach),
    buildHallelClosingKaddish(false),
    ...buildChanukahNasoLeaves(ctx.chanukahDay || 1),
  ];

  if (inject.length === 0) return leaves;

  // Remove the regular weekday Torah reading (Chanukah has its own).
  let out = leaves.filter((l) => !(/^Torah Reading$/i.test(l.en) || /קריאת התורה$/.test(l.he)));

  // Anchor on the END of the Amidah (last Amidah leaf by trail), so Hallel +
  // reading flow out of the Amidah. The old `findLeafIndex(/^Amidah$/)` failed in
  // Ashkenaz (the Amidah is split into per-bracha leaves with no leaf literally
  // named "Amidah"), so it fell back to Yishtabach and injected Hallel BEFORE
  // Barchu / the Shema blessings.
  let anchor = findLastLeafByTrail(out, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i, /Post[\s-]?Amid|שלאחר.עמידה/i);
  if (anchor < 0) anchor = findLeafIndex(out, /^Amidah$|^עמידה$/);
  if (anchor < 0) anchor = findLeafIndex(out, /Yishtabach|ישתבח/);
  if (anchor < 0) anchor = out.length - 1;

  out = injectAfter(out, anchor, inject);
  return out;
}

/** Yom HaAtzmaut Haftarah — "עוד היום בנוב לעמוד" (Isaiah 10:32-12:6). */
function buildYomAtzmautHaftarah(): FlatLeaf {
  return {
    ref: 'Isaiah 10:32-12:6',
    he: 'הפטרה ליום העצמאות — עוד היום בנֹב לעמֹד',
    en: 'Yom HaAtzmaut Haftarah — Isaiah 10:32-12:6',
    trail: [{ he: 'הפטרת יום העצמאות', en: 'Yom HaAtzmaut Haftarah' }],
  };
}

/**
 * Yom HaAtzmaut / Yom Yerushalayim — Shacharit (religious-Zionist minhag,
 * per R. Dvir): FULL Hallel WITH a bracha → Half Kaddish (no Musaf these days)
 * → on Yom HaAtzmaut also the Haftarah "עוד היום בנֹב". Injected after the
 * Amidah, like the other Hallel days.
 */
function augmentForYomHaatzmaut(leaves: FlatLeaf[], nusach: Nusach, ctx: DayContext): FlatLeaf[] {
  const inject: FlatLeaf[] = [
    ...buildFullHallelLeaves(nusach),       // includes the berakhah before/after
    buildHallelClosingKaddish(false),       // no Musaf → Half Kaddish
  ];
  if (ctx.isYomAtzmaut) inject.push(buildYomAtzmautHaftarah());

  let anchor = findLastLeafByTrail(leaves, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  if (anchor < 0) anchor = findFirstLeafByName(leaves, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (anchor < 0) return leaves;
  return injectAfter(leaves, anchor, inject);
}

/**
 * Yom HaAtzmaut Maariv (religious-Zionist minhag, per R. Dvir — source sheet
 * Sefaria 310233). The night service adds, around the regular Maariv:
 *  BEFORE: opening psalms 107/97/98 (in the festival tune) + the piyut התעוררי.
 *  AFTER the Amidah: Hallel WITH a berakhah (a widespread custom) → the
 *    ceremonial opening of the ark (שמע ישראל / ה' הוא האלהים / מי שעשה נסים /
 *    וכי תבאו מלחמה) → תהלים קכ"ו.
 *  AT THE END (after Aleinu): אני מאמין + התקווה.
 * The regular Maariv's omer count, Ps 67/Ana BeKoach and Aleinu are native to
 * the nusach text, so they're NOT re-injected here.
 */
const YH_TRAIL = [{ he: 'ערבית ליום העצמאות', en: 'Yom HaAtzmaut Maariv' }];

function buildYomAtzmautMaarivOpening(): FlatLeaf[] {
  const hitoreri = [
    'הִתְעוֹרְרִי, הִתְעוֹרְרִי, כִּי בָא אוֹרֵךְ קוּמִי אוֹרִי, עוּרִי עוּרִי שִׁיר דַּבֵּרִי, כְּבוֹד יהוה עָלַיִךְ נִגְלָה:',
    'זֶה הַיּוֹם עָשָׂה יהוה, נָגִילָה וְנִשְׂמְחָה בּוֹ:',
    'לֹא תֵבוֹשִׁי וְלֹא תִכָּלְמִי, מַה תִּשְׁתּוֹחֲחִי וּמַה תֶּהֱמִי, בָּךְ יֶחֱסוּ עֲנִיֵּי עַמִּי, וְנִבְנְתָה עִיר עַל תִּלָּהּ:',
    'זֶה הַיּוֹם עָשָׂה יהוה, נָגִילָה וְנִשְׂמְחָה בּוֹ:',
    'יָמִין וּשְׂמֹאל תִּפְרוֹצִי, וְאֶת יהוה תַּעֲרִיצִי, עַל יַד אִישׁ בֶּן פַּרְצִי, וְנִשְׂמְחָה וְנָגִילָה:',
    'זֶה הַיּוֹם עָשָׂה יהוה, נָגִילָה וְנִשְׂמְחָה בּוֹ:',
  ];
  return [
    { ref: 'Psalms 107:1-43', he: 'מזמורי פתיחה (במנגינת יום טוב) — תהלים ק״ז', en: 'Yom HaAtzmaut Maariv — Psalm 107', trail: YH_TRAIL },
    { ref: 'Psalms 97:1-12', he: 'תהלים צ״ז', en: 'Yom HaAtzmaut Maariv — Psalm 97', trail: YH_TRAIL },
    { ref: 'Psalms 98:1-9', he: 'תהלים צ״ח', en: 'Yom HaAtzmaut Maariv — Psalm 98', trail: YH_TRAIL },
    { ref: 'yh-maariv-hitoreri', he: 'פיוט: הִתְעוֹרְרִי הִתְעוֹרְרִי', en: 'Yom HaAtzmaut Maariv — Hitoreri', trail: YH_TRAIL, inlineHe: hitoreri },
  ];
}

function buildYomAtzmautMaarivPostAmidah(nusach: Nusach): FlatLeaf[] {
  const shema = [
    'חזן וקהל: שְׁמַע יִשְׂרָאֵל יהוה אֱלֹהֵינוּ יהוה אֶחָד:',
    'יהוה הוּא הָאֱלֹהִים:',
    'מִי שֶׁעָשָׂה נִסִּים לַאֲבוֹתֵינוּ וְגָאַל אוֹתָם מֵעַבְדוּת לְחֵרוּת, הוּא יִגְאַל אוֹתָנוּ בְּקָרוֹב וִיקַבֵּץ נִדָּחֵינוּ מֵאַרְבַּע כַּנְפוֹת הָאָרֶץ, חֲבֵרִים כָּל יִשְׂרָאֵל, וְנֹאמַר אָמֵן:',
  ];
  return [
    // The night-Hallel custom (with a berakhah for those who say it).
    ...buildFullHallelLeaves(nusach).map((l) => ({
      ...l,
      he: l.en === 'Berakhah before the Hallel' ? 'הלל (יש הנוהגים בערב יום העצמאות — ובברכה)' : l.he,
      trail: YH_TRAIL,
    })),
    { ref: 'yh-maariv-shema', he: 'פתיחת ההיכל: שמע ישראל', en: 'Yom HaAtzmaut Maariv — Shema', trail: YH_TRAIL, inlineHe: shema },
    { ref: 'Numbers 10:9-10', he: 'וְכִי תָבֹאוּ מִלְחָמָה (במדבר י׳)', en: 'Yom HaAtzmaut Maariv — Numbers 10:9-10', trail: YH_TRAIL },
    { ref: 'Psalms 126:1-6', he: 'שִׁיר הַמַּעֲלוֹת — תהלים קכ״ו', en: 'Yom HaAtzmaut Maariv — Psalm 126', trail: YH_TRAIL },
  ];
}

function buildYomAtzmautMaarivClosing(): FlatLeaf[] {
  const aniMaamin = [
    'מסיימים בשירת "אני מאמין" ו"התקווה".',
    'אֲנִי מַאֲמִין בֶּאֱמוּנָה שְׁלֵמָה בְּבִיאַת הַמָּשִׁיחַ, וְאַף עַל פִּי שֶׁיִּתְמַהְמֵהַּ, עִם כָּל זֶה אֲחַכֶּה לּוֹ בְּכָל יוֹם שֶׁיָּבוֹא:',
    'כֹּל עוֹד בַּלֵּבָב פְּנִימָה נֶפֶשׁ יְהוּדִי הוֹמִיָּה, וּלְפַאֲתֵי מִזְרָח קָדִימָה עַיִן לְצִיּוֹן צוֹפִיָּה —',
    'עוֹד לֹא אָבְדָה תִּקְוָתֵנוּ, הַתִּקְוָה בַּת שְׁנוֹת אַלְפַּיִם, לִהְיוֹת עַם חָפְשִׁי בְּאַרְצֵנוּ, אֶרֶץ צִיּוֹן וִירוּשָׁלַיִם:',
  ];
  return [
    { ref: 'yh-maariv-animaamin', he: 'סיום: אֲנִי מַאֲמִין וְהַתִּקְוָה', en: 'Yom HaAtzmaut Maariv — Ani Maamin & Hatikvah', trail: YH_TRAIL, inlineHe: aniMaamin },
  ];
}

function augmentForYomHaatzmautMaariv(leaves: FlatLeaf[], nusach: Nusach): FlatLeaf[] {
  const opening = buildYomAtzmautMaarivOpening();
  const postAmidah = buildYomAtzmautMaarivPostAmidah(nusach);
  const closing = buildYomAtzmautMaarivClosing();

  // Inject the Hallel/Shema block right after the Maariv Amidah (before the
  // native omer/Aleinu). If there's no Amidah anchor (monolithic Maariv leaf),
  // append it after the body instead.
  let anchor = findLastLeafByTrail(leaves, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  if (anchor < 0) anchor = findFirstLeafByName(leaves, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  const withPost = anchor >= 0 ? injectAfter(leaves, anchor, postAmidah) : [...leaves, ...postAmidah];
  return [...opening, ...withPost, ...closing];
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

  // Inject Hallel right after the Amidah. ChH"M has Musaf → Kaddish Titkabal.
  if (hallel.length > 0 && amidahAnchor >= 0) {
    out = injectAfter(out, amidahAnchor, [...hallel, buildHallelClosingKaddish(true)]);
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
  // Kaddish Titkabal closes the Hallel (ChH"M has Musaf), then Mussaf.
  out = injectAfter(out, amidahIdx, [...hallel, buildHallelClosingKaddish(true), ...musafLeaves]);
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
 * Per spec A7: Amidah (+ Al haNisim) → Half Kaddish → Sefer Torah ceremony
 * (Hotzaat → Vayavo Amalek, 3 olim → Hagbah → Hachnasat) → Megillah (banner)
 * → Shoshanat Yaakov → Ashrei → Uva Letzion → Aleinu. NO Hallel.
 *
 * Ashkenazi: the base tree has the full Torah-service ceremony (now shown on
 * Purim via siddurRelevance). Inject Vayavo Amalek AFTER "Birkat HaTorah"
 * (the aliyah blessing) so it reads brachot → verses → Half Kaddish → Hagbah
 * → Hachnasat — exactly like the Rosh Chodesh handler. Shoshanat Yaakov goes
 * just before Aleinu.
 *
 * Sephardi/EM/Chabad: monolithic Amidah leaf with no ceremony sub-leaves —
 * fall back to injecting Vayavo Amalek + Shoshanat after the Amidah leaf.
 */
function augmentForPurim(leaves: FlatLeaf[], _nusach: Nusach): FlatLeaf[] {
  let out = leaves;
  const vayavo = buildVayavoAmalekLeaves();
  const shoshanat = buildShoshanatYaakovLeaf();

  // Ashkenazi path: inject into the Torah-service ceremony.
  const birkatHaTorahIdx = findFirstLeafByName(out, /^Birkat HaTorah$|^ברכת התורה$/i);
  if (birkatHaTorahIdx >= 0) {
    // Spec A7: Shoshanat comes after the Megillah/Torah service, BEFORE Ashrei.
    // Anchor it after the last "Returning Sefer to Aron" leaf (Hachnasat).
    // Inject in reverse order (later anchor first) so earlier indexes stay valid.
    const hachnasatLast = findLastLeafByTrail(out, /Returning Sefer|Returning the Torah|הכנסת ספר/i);
    if (hachnasatLast >= 0) out = injectAfter(out, hachnasatLast, [shoshanat]);
    out = injectAfter(out, birkatHaTorahIdx, vayavo);
    return out;
  }

  // Fallback (Sephardi/EM/Chabad monolithic Amidah): after the Amidah leaf.
  let anchor = findLastLeafByTrail(out, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  if (anchor < 0) anchor = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (anchor < 0) return out;
  return injectAfter(out, anchor, [...vayavo, shoshanat]);
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
    // Priority order: RC > Chanukah > ChH"M > Purim > Fast > Yom HaAtzmaut/Yerushalayim.
    if (ctx.isRC) out = augmentForRoshChodesh(out, nusach, ctx);
    else if (ctx.isChanukah) out = augmentForChanukah(out, nusach, ctx);
    else if (ctx.isCholHamoed) out = augmentForCholHamoed(out, nusach, ctx);
    else if (ctx.isPurim) out = augmentForPurim(out, nusach);
    else if (ctx.isFast) out = augmentForFastShacharit(out, ctx, nusach);
    else if (ctx.isYomAtzmaut || ctx.isYomYerushalayim) out = augmentForYomHaatzmaut(out, nusach, ctx);

    // (Shir HaMaalot for AYT is native to every nusach's text — not injected.)
  } else if (isWeekdayMincha) {
    if (ctx.isFast) out = augmentForFastMincha(out, ctx, nusach);
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
    // Yom HaAtzmaut / Yom Yerushalayim Maariv is the EVE service — said the
    // night that BEGINS the day. So it fires when TOMORROW is the day (not
    // today), exactly like Erev Shabbat/YT detection. This also keeps the omer
    // automatic: the night's count is today+1, which the regular Maariv omer
    // already shows. HebrewCalendar reports the OBSERVED day, so postponements
    // (Yom HaAtzmaut isn't always 5 Iyar — it shifts off Fri/Sat/Mon) are
    // handled automatically.
    const tomorrowHdMaariv = ctx.hd.add(1, 'd');
    const tomorrowEventsMaariv = HebrewCalendar.calendar({
      start: tomorrowHdMaariv, end: tomorrowHdMaariv, il: inIsrael, sedrot: false,
    });
    const tomorrowIsYomAtzmaut = tomorrowEventsMaariv.some((e) => /Yom HaAtzma|Atzma'?ut/i.test(e.getDesc()));
    const tomorrowIsYomYerushalayim = tomorrowEventsMaariv.some((e) => /Yom Yerushalayim|Jerusalem Day/i.test(e.getDesc()));
    // Purim Maariv (Al-HaNisim + Megillah) is the EVE service that BEGINS Purim,
    // said the night that enters 14 Adar — i.e. when TODAY is still 13 Adar. So
    // it must fire on tomorrow=Purim, not on ctx.isPurim (whose night is already
    // motzei Purim). Same eve logic as Yom HaAtzmaut Maariv above.
    const tomorrowIsPurim = tomorrowEventsMaariv.some((e) => /Purim|Shushan/i.test(e.getDesc()) && !/Erev/i.test(e.getDesc()));
    if (tomorrowIsPurim) out = augmentForPurimMaariv(out, nusach);
    else if (tomorrowIsYomAtzmaut || tomorrowIsYomYerushalayim) out = augmentForYomHaatzmautMaariv(out, nusach);
  }

  return out;
}

/** Fast day Shacharit — inject Vayechal Moshe Torah reading. For T"B replace
 *  with Devarim 4:25-40 + Yirmiyahu Haftarah. Anenu lives inside the Amidah
 *  text (Sefaria gates it as a conditional paragraph). */
function augmentForFastShacharit(leaves: FlatLeaf[], ctx: DayContext, nusach: Nusach): FlatLeaf[] {
  const m = ctx.hd.getMonth();
  const d = ctx.hd.getDate();
  // Yom Kippur is a fast, but it has its own machzor — the weekday Shacharit
  // flow and the ויחל reading don't apply. Don't inject fast content.
  if (m === months.TISHREI && d === 10) return leaves;

  // Tisha B'Av has its own Torah/Haftarah pair.
  const isTishaBAv = m === 5 && d === 9; // Av = month 5
  const torahLeaves = isTishaBAv
    ? [...buildTishaBAvShacharitTorahLeaves(), buildTishaBAvHaftarah()]
    : buildVayechalLeaves();

  let out = leaves;

  // Anchor on the (silent) Amidah.
  let amidahAnchor = findLastLeafByTrail(out, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  if (amidahAnchor < 0) {
    amidahAnchor = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  }
  if (amidahAnchor < 0) return leaves;

  // The Torah reading (ויחל) on a public fast is read only AFTER chazaras +
  // Tachanun/Selichot + Avinu Malkenu — right before the closing Ashrei / Uva
  // Letzion, NOT straight after the silent Amidah. Anchor it on that closing
  // Ashrei (the one after the Amidah, not the Pesukei-Dezimra Ashrei).
  let ashreiIdx = -1;
  for (let i = amidahAnchor + 1; i < out.length; i++) {
    const l = out[i];
    const isAshrei = /^Ashrei$/i.test(l.en) || /^אשרי$/.test(l.he);
    const inPesukei = l.trail.some((t) => /Pesukei|דזמרה|דזימרא/i.test(`${t.en} ${t.he}`));
    if (isAshrei && !inPesukei) { ashreiIdx = i; break; }
  }

  // Inject high index first so the earlier insert doesn't shift the later one.
  if (ashreiIdx > amidahAnchor) out = injectAfter(out, ashreiIdx - 1, torahLeaves);
  else out = injectAfter(out, amidahAnchor, torahLeaves); // fallback: after Amidah
  // Anenu. Sefard/EM/Chabad (monolithic amida) are handled inside the amida
  // splitter (read.tsx) — individual in Shema Koleinu (Mincha only), Chazan
  // between Geulah/Refuah in the chazara. Only Ashkenaz (pre-split leaves) needs
  // the CHAZAN's Anenu injected here, between Geulah (גאל ישראל) and Refuah
  // (רפאנו); read.tsx scopes it chazara-only.
  if (nusach === 'ashkenazi') {
    const geulaIdx = findFirstLeafByName(out, /^Redemption$|^גאולה$/i);
    if (geulaIdx >= 0) out = injectAfter(out, geulaIdx, [buildAnenuLeaf()]);
  }
  return out;
}

/** Fast day Mincha — inject Vayechal + Haftarah (Dirshu) before/around Amidah.
 *  For T"B Mincha also add Nachem reminder. */
function augmentForFastMincha(leaves: FlatLeaf[], ctx: DayContext, nusach: Nusach): FlatLeaf[] {
  const isTishaBAv = ctx.hd.getMonth() === 5 && ctx.hd.getDate() === 9;
  // (1) FULL Torah service BEFORE the Amidah: Hotzaat → Vayechal (3 olim) →
  // Dirshu Haftarah → Hachnasat → Half Kaddish. (Was: Vayechal+Haftarah only —
  // no procession, and Ashkenaz didn't always get it.)
  const preAmidah: FlatLeaf[] = [
    ...buildFastMinchaHotzaa(),
    ...buildVayechalLeaves(),
    buildFastMinchaHaftarah(),
    ...buildFastMinchaHachnasa(),
    buildFastMinchaReadingKaddish(),
  ];
  // (2) עננו: the INDIVIDUAL's Anenu is native in Shema Koleinu (שומע תפילה) for
  // every nusach — no separate card. Only Ashkenaz lacks the CHAZAN's Anenu
  // (a separate bracha between Geulah and Refuah); inject it there below.
  const postAmidah: FlatLeaf[] = isTishaBAv ? [buildNachemLeaf()] : [];

  let out = leaves;
  let amidahFirst = findFirstLeafByTrail(out, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i);
  let amidahLast = findLastLeafByTrail(out, /\bAmid(ah|a)\b|^עמידה$|^שמונה עשרה$/i,
    /Post[\s-]?Amid|שלאחר.עמידה/i);
  if (amidahFirst < 0) amidahFirst = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahLast < 0)  amidahLast  = findFirstLeafByName(out, /^Amid(ah|a)$|^עמידה$|^תפילת עמידה$/i);
  if (amidahLast >= 0 && postAmidah.length) out = injectAfter(out, amidahLast, postAmidah);
  if (amidahFirst > 0) out = injectAfter(out, amidahFirst - 1, preAmidah);

  // (2b) Ashkenaz Chazan's Anenu — a separate bracha between Geulah (גאל ישראל)
  // and Refuah (רפאנו) in the chazara. Other rites have it natively.
  if (nusach === 'ashkenazi') {
    const geulaIdx = findFirstLeafByName(out, /^Redemption$|^גאולה$/i);
    if (geulaIdx >= 0) out = injectAfter(out, geulaIdx, [buildAnenuLeaf()]);
  }

  // (3) Avinu Malkenu BEFORE Tachanun (per R. Dvir). The base tree orders it
  // Amida → Tachanun → Avinu Malkenu; move the leaf to just before Tachanun.
  const amIdx = findFirstLeafByName(out, /^Avinu Malk(enu|einu)$|^אבינו מלכנו$/i);
  // Loose match so it catches Ashkenaz "Vidui and 13 Middot" / "וידוי וי״ג המידות".
  const tachIdx = findFirstLeafByName(out, /\bTac?hnun\b|\bTachanun\b|\bVidui\b|^תחנון|^וידוי|^לשני וחמישי/i);
  if (amIdx >= 0 && tachIdx >= 0 && amIdx > tachIdx) {
    const [am] = out.splice(amIdx, 1);
    out.splice(tachIdx, 0, am);
  }
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
