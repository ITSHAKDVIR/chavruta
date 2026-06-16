import { HDate, HebrewCalendar, flags, months } from '@hebcal/core';

/**
 * Determines whether a siddur section is relevant today.
 * Used to filter out e.g. "ספירת העומר" when not in Omer season,
 * "סוכות" / "נטילת לולב" / "הושענות" when not Sukkot, etc.
 *
 * Returns true = show, false = hide (unless user toggled "show all").
 */

type Ctx = {
  hd: HDate;
  m: number;
  d: number;
  gregDay: number;
  inIsrael: boolean;
};

function buildCtx(date: Date, inIsrael: boolean): Ctx {
  const hd = new HDate(date);
  return {
    hd,
    m: hd.getMonth(),
    d: hd.getDate(),
    gregDay: date.getDay(),
    inIsrael,
  };
}

function isOmerSeason(ctx: Ctx): boolean {
  // 16 Nisan - 5 Sivan (Omer counts 49 days from second night of Pesach)
  if (ctx.m === months.NISAN && ctx.d >= 16) return true;
  if (ctx.m === months.IYYAR) return true;
  if (ctx.m === months.SIVAN && ctx.d <= 5) return true;
  return false;
}

function isLagBaOmer(ctx: Ctx): boolean {
  return ctx.m === months.IYYAR && ctx.d === 18;
}

function isSukkot(ctx: Ctx): boolean {
  return ctx.m === months.TISHREI && ctx.d >= 15 && ctx.d <= 21;
}

function isSukkotOrHaaretz(ctx: Ctx): boolean {
  // Sukkot proper + Shmini Atzeret + Simchat Torah in chu"l
  if (ctx.m !== months.TISHREI) return false;
  if (ctx.d >= 15 && ctx.d <= 22) return true;
  return !ctx.inIsrael && ctx.d === 23;
}

function isShminiAtzeretSimchatTorah(ctx: Ctx): boolean {
  if (ctx.m !== months.TISHREI) return false;
  if (ctx.d === 22) return true; // Shmini Atzeret (& Simchat Torah in EY)
  if (!ctx.inIsrael && ctx.d === 23) return true; // Simchat Torah in diaspora
  return false;
}

function isChanukah(ctx: Ctx): boolean {
  return (ctx.m === months.KISLEV && ctx.d >= 25) || (ctx.m === months.TEVET && ctx.d <= 2);
}

function isPurimSeason(ctx: Ctx): boolean {
  // Adar (and Adar I/II in leap year)
  if (ctx.m === months.ADAR_I || ctx.m === months.ADAR_II) return true;
  return false;
}

function isPurimDay(ctx: Ctx): boolean {
  const adar = HDate.isLeapYear(ctx.hd.getFullYear()) ? months.ADAR_II : months.ADAR_I;
  return ctx.m === adar && (ctx.d === 14 || ctx.d === 15);
}

function isPesachSeason(ctx: Ctx): boolean {
  // From 1 Nisan through 22 Nisan (incl. Erev + 7 days)
  return ctx.m === months.NISAN && ctx.d <= 22;
}

function isPesach(ctx: Ctx): boolean {
  return ctx.m === months.NISAN && ctx.d >= 14 && ctx.d <= 22;
}

function isShavuot(ctx: Ctx): boolean {
  if (ctx.m !== months.SIVAN) return false;
  if (ctx.d === 6) return true;
  return !ctx.inIsrael && ctx.d === 7;
}

function isShavuotSeason(ctx: Ctx): boolean {
  return ctx.m === months.SIVAN && ctx.d >= 5 && ctx.d <= 8;
}

function isSelichotSeason(ctx: Ctx): boolean {
  // Approx: Saturday before RH through Erev YK
  // Simpler: Elul + first 9 days of Tishrei
  if (ctx.m === months.ELUL && ctx.d >= 15) return true; // last 2 weeks of Elul
  if (ctx.m === months.TISHREI && ctx.d <= 9) return true;
  return false;
}

function isAseretYemeiTeshuva(ctx: Ctx): boolean {
  return ctx.m === months.TISHREI && ctx.d >= 1 && ctx.d <= 10;
}

function isFastDay(ctx: Ctx, includeMinor = true): boolean {
  const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
  return events.some((e) => {
    const f = e.getFlags();
    if (f & flags.MAJOR_FAST) return true;
    if (includeMinor && (f & flags.MINOR_FAST)) return true;
    return false;
  });
}

function isRoshChodesh(ctx: Ctx): boolean {
  const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
  return events.some((e) => e.getFlags() & flags.ROSH_CHODESH);
}

function isErevRoshChodesh(ctx: Ctx): boolean {
  const tomorrow = ctx.hd.add(1, 'd');
  return tomorrow.getDate() === 1;
}

function isShabbat(ctx: Ctx): boolean {
  return ctx.gregDay === 6;
}

function isErevShabbat(ctx: Ctx): boolean {
  return ctx.gregDay === 5;
}

function isMotzaeiShabbat(ctx: Ctx): boolean {
  // Saturday night through Sunday end (rough)
  return ctx.gregDay === 0;
}

function isMonOrThurs(ctx: Ctx): boolean {
  return ctx.gregDay === 1 || ctx.gregDay === 4;
}

function isWeekday(ctx: Ctx): boolean {
  const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
  const isHoliday = events.some((e) => (e.getFlags() & flags.CHAG) || (e.getFlags() & flags.CHOL_HAMOED));
  return !isShabbat(ctx) && !isHoliday;
}

function isPirkeiAvotSeason(ctx: Ctx): boolean {
  // Read between Pesach and Shavuot in some communities, others until Sukkot.
  // Use wider window: Iyar through Elul.
  if (ctx.m === months.IYYAR) return true;
  if (ctx.m === months.SIVAN) return true;
  if (ctx.m === months.TAMUZ) return true;
  if (ctx.m === months.AV) return true;
  if (ctx.m === months.ELUL) return true;
  return false;
}

function isBirkatLevanaSeason(ctx: Ctx): boolean {
  // 4-15 days after molad (roughly: 4-15 days after Rosh Chodesh)
  // Simple approximation: days 3-14 of Hebrew month
  return ctx.d >= 3 && ctx.d <= 14;
}

function isNissan(ctx: Ctx): boolean {
  return ctx.m === months.NISAN;
}

function isTalGeshemSwitchDay(ctx: Ctx): boolean {
  // Mashiv haRuach starts on musaf Shmini Atzeret (22 Tishrei)
  // Tal Prayer is recited on Pesach musaf (15 Nisan in EY)
  if (ctx.m === months.TISHREI && ctx.d === 22) return true;
  if (ctx.m === months.NISAN && ctx.d === 15) return true;
  return false;
}

/**
 * Match section English/Hebrew names against known patterns and check relevance.
 * Returns true if section should be shown today, false if it should be hidden.
 * Unknown patterns default to true (don't accidentally hide unknown content).
 *
 * `he` is optional but enables gating leaves whose chu"l/EY designation lives
 * only in the Hebrew name (e.g. "ברוך ה' לעולם (outside of Israel)").
 */
export function isSectionRelevantToday(en: string, date: Date = new Date(), inIsrael = true, he = ''): boolean {
  const ctx = buildCtx(date, inIsrael);
  const name = (en || '').toLowerCase();
  const haystack = `${name} ${(he || '').toLowerCase()}`;
  // Hebrew/English marker for "only outside Israel" content (the chu"l-only
  // ברוך ה' לעולם before half-kaddish at weekday Maariv, etc.)
  if (/outside of israel|outside israel|in (the )?diaspora|בחו"?ל|בחוצה? לארץ|בחוץ לארץ/i.test(haystack)) {
    return !inIsrael;
  }

  // Sukkot-specific
  if (/\b(sukkot|sukkah|lulav|hosha'?an?ot?|hoshana)\b/.test(name)) {
    return isSukkotOrHaaretz(ctx);
  }
  // Simchat Torah
  if (/simchat torah|hakafot/.test(name)) {
    return isShminiAtzeretSimchatTorah(ctx);
  }
  // Chanukah
  if (/chanukah|hanukkah|menorah lighting|chanuka/.test(name)) {
    return isChanukah(ctx);
  }
  // Purim / Megillah
  if (/purim|megillah|krovetz|parashat zachor/.test(name)) {
    return isPurimSeason(ctx);
  }
  // Pesach Haggadah / Pesach
  if (/haggadah|pesach|chol hamoed pesach|burning hametz|search for hametz/.test(name)) {
    return isPesachSeason(ctx);
  }
  // Shavuot
  if (/shavuot|shavu'?ot/.test(name)) {
    return isShavuotSeason(ctx);
  }
  // Sefirat HaOmer
  if (/sefirat ha-?omer|counting of the omer|sefirat haomer/.test(name)) {
    return isOmerSeason(ctx);
  }
  // Lag BaOmer
  if (/lag ba'?omer/.test(name)) {
    return isLagBaOmer(ctx);
  }
  // Selichot
  if (/^selichot|selichot for|selichot$/.test(name)) {
    // Generic Selichot bucket → show during selichot season + fast days
    if (/fast|10 of tevet|17 of tamuz|asara b'tevet|taanit esther|gedalia|gedaliah/.test(name)) {
      return isFastDay(ctx) || isSelichotSeason(ctx);
    }
    return isSelichotSeason(ctx);
  }
  // Fast of Gedaliah, 10 Tevet, etc.
  if (/fast of gedalia|fast of gedaliah|ten of tevet|tenth of tevet|seventeenth of tammuz|seventeen of tamuz|fast of esther/.test(name)) {
    return isFastDay(ctx);
  }
  // BaHaB
  if (/^bahab|bahab blessing|selichot for bahab/.test(name)) {
    // BaHaB days are Mon/Thu/Mon after Pesach and Sukkot
    if (!isMonOrThurs(ctx)) return false;
    return (ctx.m === months.IYYAR && ctx.d <= 20) || (ctx.m === months.CHESHVAN && ctx.d <= 20);
  }
  // Yom Kippur Katan
  if (/yom kippur katan/.test(name)) {
    return isErevRoshChodesh(ctx);
  }
  // Tefillat Tal
  if (/prayer for dew|tefillat tal/.test(name)) {
    return ctx.m === months.NISAN && ctx.d >= 14 && ctx.d <= 16;
  }
  // Tefillat Geshem
  if (/prayer for rain|tefillat geshem/.test(name)) {
    return ctx.m === months.TISHREI && ctx.d >= 21 && ctx.d <= 23;
  }
  // Birkat HaIlanot (Nisan)
  if (/blossoming fruit tree|blessing of the trees|birkat ha'?ilanot/.test(name)) {
    return isNissan(ctx);
  }
  // Birkat Levana — separate prayer; gated only when accessed standalone.
  if (/kiddush levanah|birkat ha-?levana|blessing of the moon/.test(name)) {
    return isBirkatLevanaSeason(ctx);
  }
  // Rosh Chodesh
  if (/rosh chodesh|rosh hodesh|musaf for rosh chodesh|musaf for shabbat rosh chodesh/.test(name)) {
    return isRoshChodesh(ctx);
  }
  // Hallel - holiday or Rosh Chodesh
  if (/^hallel$|order of hallel|hallel for rosh chodesh|hallel and festivals/.test(name)) {
    const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
    const isHallelDay = events.some((e) => (e.getFlags() & flags.CHAG) || (e.getFlags() & flags.ROSH_CHODESH) || (e.getFlags() & flags.CHANUKAH_CANDLES));
    return isHallelDay;
  }
  // Tachanun - not on Shabbat, RC, or holidays. Catches "Tachanun" + Chabad's
  // alt spelling "Tachnun" (missing 'a'). Also catches "Vidui" / "Vidui and 13
  // Middot" (Ashkenazi puts it in a separate node from Tachanun) and "Post
  // Amidah" container (which on RC has nothing left to show anyway).
  // "El Erech Appayim" is said before opening the Ark — but ONLY on days where
  // Tachanun is said (skipped on RC + Shabbat + festivals + Mondays-Thursdays
  // that are exempt).
  if (/^tac?hanun$|^tachnun$|tachanun$|tachnun$|^vidui|vidui and 13|^post amidah$|וידוי|^el erech app?ayim$|אל ארך אפים/.test(name) ||
      /וידוי|^אל ארך אפים$/.test(he || '')) {
    if (isShabbat(ctx)) return false;
    const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
    if (events.some((e) => e.getFlags() & flags.MAJOR_FAST)) return false; // Tisha B'Av / YK — no Tachanun
    return !events.some((e) => (e.getFlags() & flags.CHAG) || (e.getFlags() & flags.ROSH_CHODESH) || (e.getFlags() & flags.MINOR_HOLIDAY));
  }
  // Lamenatze'ach (Psalm 20) — said on days Tachanun is said
  if (/^lamenatze'?ach$|^lamenatzeach$|למנצח/.test(name)) {
    if (isShabbat(ctx)) return false;
    const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
    return !events.some((e) => (e.getFlags() & flags.CHAG) || (e.getFlags() & flags.ROSH_CHODESH) || (e.getFlags() & flags.MINOR_HOLIDAY));
  }
  // Mizmor LeToda (Psalm 100 — מזמור לתודה). Omitted on Shabbat (no תודה
  // offering brought), Yom Tov, Erev Pesach, all of Pesach (CH"M), and
  // Erev Yom Kippur — days when the תודה offering wasn't brought.
  if (/^mizmor le?[t][o']?dah?$|^mizmor letodah?$|מזמור לתודה/.test(name)) {
    if (isShabbat(ctx)) return false;
    if (ctx.m === months.NISAN && ctx.d >= 14 && ctx.d <= 21) return false; // Erev Pesach + Pesach
    if (ctx.m === months.TISHREI && ctx.d === 9) return false; // Erev YK
    const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
    if (events.some((e) => e.getFlags() & flags.CHAG)) return false;
    return true;
  }
  // Avinu Malkenu
  if (/avinu malkenu|avinu malkeinu/.test(name)) {
    return isAseretYemeiTeshuva(ctx) || isFastDay(ctx);
  }
  // Pirkei Avot
  if (/pirkei avot|pirkei? avot/.test(name)) {
    return isPirkeiAvotSeason(ctx) && isShabbat(ctx);
  }
  // Barchi Nafshi (תהלים ק"ד) - read on Rosh Chodesh in many minhagim
  if (/barchi nafshi|bar?chi nafshi|ברכי נפשי/.test(name) || /barchi nafshi/i.test(en || '')) {
    return isRoshChodesh(ctx);
  }
  // LeDavid (Psalm 27 — לדוד ה' אורי וישעי) - from Elul through Hoshana Rabbah.
  // Match EXACTLY "ledavid" (not "ledavid mizmor" which is Sunday's Psalm 24).
  // Also catches Sephardi leaf "L'David Hashem" / "לדוד ה'" (Psalm 27).
  if (
    /^ledavid$/.test(name) ||
    /ledavid hashem ori|le-david hashem ori|psalm 27 of david|^l['’'`]?david hashem$/.test(name)
  ) {
    if (ctx.m === months.ELUL) return true;
    if (ctx.m === months.TISHREI && ctx.d <= 21) return true;
    return false;
  }
  // Tal/Geshem prayer toggle (this is part of Amidah, leave it visible always)

  // Mon/Thurs additions (long Tachanun starting with "והוא רחום אל ארך אפים").
  // Catches "For Monday and Thursday", "Long Tachanun", and standalone leaves
  // that belong to the Mon/Thu continuation: "God of Israel" (ה' אלקי ישראל
  // שוב מחרון אפך).
  if (
    /for monday & thursday|for monday and thursday|long tachanun|monday and thursday|^god of israel$/.test(name)
    || /^ה\s*אל[׳'״"]?\s*ישראל$/.test((he || '').trim())
  ) {
    return isMonOrThurs(ctx) && isWeekday(ctx);
  }
  // Torah Reading service (קריאת התורה) — Mon/Thu, Shabbat, Rosh Chodesh,
  // holidays (Chag/Chol HaMoed), fast days. NOT regular weekdays.
  // This includes "Torah Reading", "Removing the Torah from Ark",
  // "Returning Sefer to Aron", "Reading from Sefer", "Raising the Torah",
  // "Hagbah", "Mi Sheberach for an Oleh", "Birkat HaTorah" (the Aliyah blessing).
  //
  // We MUST NOT match "Torah Blessings" / "Birkot HaTorah" (the MORNING
  // blessings) — those are in a different parent ("Preparatory Prayers").
  if (
    /^torah reading$|^reading from sefer$|removing the torah|returning sefer|returning the torah|raising the torah|hagbah|hagba|^birkat hatorah$/.test(name)
  ) {
    if (isMonOrThurs(ctx) || isShabbat(ctx) || isRoshChodesh(ctx) || isFastDay(ctx)) return true;
    const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
    return events.some((e) => (e.getFlags() & flags.CHAG) || (e.getFlags() & flags.CHOL_HAMOED));
  }
  // Torah Reading FOR FAST DAY (Sephardi: separate leaf at Mincha/Shacharit)
  if (/torah reading for fast day/.test(name)) {
    return isFastDay(ctx);
  }
  // Mi Sheberach (general blessings during Torah service) — same dates as Torah service
  if (/mi shebei?ra(c?h|kh)/.test(name) && /oleh|cholim|ill/.test(name)) {
    if (isMonOrThurs(ctx) || isShabbat(ctx) || isRoshChodesh(ctx) || isFastDay(ctx)) return true;
    const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
    return events.some((e) => (e.getFlags() & flags.CHAG) || (e.getFlags() & flags.CHOL_HAMOED));
  }
  // Motzaei Shabbat additions
  if (/additions for motza'?ei shabbat|motzaei shabbat|motzei shabbat|veyiten lecha|melava malka/.test(name)) {
    return isMotzaeiShabbat(ctx);
  }
  // Shabbat-only services (filter weekday-only sections)
  if (/^shabbat |shabbat evening|shabbat morning|kabbalat shabbat|musaf le'?shabbat|musaf for shabbat|shabbat eve|shabbat mincha|shabbat eve maariv|shabbat shacharit|musaf$|musaf de'?shabbat/.test(name)) {
    return isShabbat(ctx) || isErevShabbat(ctx) || isMotzaeiShabbat(ctx);
  }
  if (/havdalah|havdala/.test(name)) {
    return isShabbat(ctx) || isMotzaeiShabbat(ctx);
  }
  if (/blessing the children|shalom aleichem|eshet chayil|kiddush|atkinu seudata|zemirot for shabbat/.test(name)) {
    // Shabbat eve specific
    return isErevShabbat(ctx) || isShabbat(ctx);
  }
  if (/^weekday |for weekday|weekday shacharit|weekday mincha|weekday maariv|weekday arvit/.test(name)) {
    return !isShabbat(ctx);
  }
  // Shir HaShirim - Pesach / Friday night for some
  if (/shir hashirim|song of songs/.test(name)) {
    return isPesach(ctx) || isErevShabbat(ctx);
  }
  // Birkat Cohanim - Nusach-specific; in EY daily, in chu"l holidays only
  if (/birkat kohanim|priestly blessing/.test(name)) {
    if (ctx.inIsrael) return true;
    return isShavuot(ctx) || isPesach(ctx) || isShminiAtzeretSimchatTorah(ctx);
  }
  // Mashiv haRuach / Tal Tefillah - musaf prayers
  if (/tikkun rachel|tikkun leah|tikkun chatzot/.test(name)) {
    // Tikkun Chatzot - not on Shabbat/yom tov/holidays
    if (isShabbat(ctx)) return false;
    const events = HebrewCalendar.calendar({ start: ctx.hd, end: ctx.hd, il: ctx.inIsrael, sedrot: false });
    return !events.some((e) => e.getFlags() & flags.CHAG);
  }

  // Default: show
  return true;
}

/** Filter a list of section nodes by relevance. */
export function filterByRelevance<T extends { en: string }>(
  nodes: T[],
  date: Date = new Date(),
  inIsrael = true,
): T[] {
  return nodes.filter((n) => isSectionRelevantToday(n.en, date, inIsrael));
}
