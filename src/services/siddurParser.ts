import { HDate, HebrewCalendar, flags, months } from '@hebcal/core';

/**
 * Parses Sefaria HTML siddur text into structured paragraphs with
 * recognized seasonal/conditional markers. Used to hide irrelevant
 * insertions (e.g., זכרנו לחיים when not in עשרת ימי תשובה).
 *
 * Handles 3 patterns Sefaria uses:
 *   A. Inline:        <small>בעשי"ת:</small> זָכְרֵנוּ...
 *   B. Split:         <small>בימות הגשמים:</small>  followed by next paragraph "טַל וּמָטָר"
 *   C. Halachic note: <small>אם שכח לומר... חוזר...</small>  (whole paragraph)
 */

export type ParagraphKind =
  | 'normal'         // ordinary tefila text
  | 'halachic-note'  // instructional note (whole paragraph in <small>)
  | 'conditional'    // text that only applies under a condition (e.g., בעשי"ת)
  | 'alternative';   // text that REPLACES other text under a condition (e.g., המלך הקדוש)

export type ConditionTag =
  | 'aseret-yemei-teshuva'
  | 'rosh-chodesh'
  | 'yom-tov'
  | 'chol-hamoed'
  | 'chanukah'
  | 'purim'
  | 'fast'
  | 'tisha-b-av'     // נחם / עננו-of-Tisha-b'Av — said ONLY on the 9th of Av
  | 'torah-reading'  // יהללו / ובנוחה / pesukei הוצאה-הכנסה — only when ס"ת is read
  | 'elul'           // לדוד ה' אורי (תה' כז) — Elul through Hoshana Rabba
  | 'no-tachanun'    // psalms said on days without Tachanun (תה' טז in L'David)
  | 'bet-avel'       // house-of-mourning psalm (תה' מט) — not in ordinary davening
  | 'motzei-shabbat'
  | 'shabbat'
  | 'weekday'
  | 'summer-tal'      // ימות החמה: Pesach (musaf) → Shmini Atzeret
  | 'winter-geshem'   // ימות הגשמים: Shmini Atzeret → Pesach
  | 'tal-umatar'      // 7 Cheshvan / Dec 4-5 → 15 Nisan: ותן טל ומטר
  | 'in-israel'
  | 'in-diaspora'
  | 'sukkot'
  | 'pesach'
  | 'shavuot'
  | 'shmini-atzeret'
  | 'rosh-hashana'
  | 'yom-kippur'
  // "כשחל ביום X" - when the current section's day falls on weekday X
  | 'fell-sun'
  | 'fell-mon'
  | 'fell-tue'
  | 'fell-wed'
  | 'fell-thu'
  | 'fell-fri'
  | 'fell-sat'
  // Said only in chazarat hashatz (Modim DeRabbanan) — hidden in the silent
  // Amidah, shown in the chazara collapse.
  | 'chazara-only'
  // Said only in the silent Amidah (the quiet 3rd bracha "אתה קדוש ושמך קדוש")
  // — hidden in the chazara, where the chazan says the full Kedushah instead.
  | 'silent-only'
  | 'unknown';

export type ParsedParagraph = {
  body: string;
  kind: ParagraphKind;
  tags?: ConditionTag[];
  marker?: string;
  /** Internal: true when this paragraph's "marker" is an unrecognized rubric/
   *  directive (e.g. "ואומר החזן חצי קדיש") rather than a date condition. */
  _rubric?: boolean;
  /** Internal: the marker is NEGATIVE ("…אין אומרים ברכה זו") — the body is said
   *  on ordinary days and OMITTED when one of `tags` is active (inverted gate). */
  _negate?: boolean;
  /** Source paragraph was wrapped in <small> — render in the small font even when
   *  the content is vocalized prayer (otherwise it shows in the large `sacred`
   *  font). */
  small?: boolean;
  /** Context rubric (speaker/kaddish/section label) — an unvocalized directive
   *  that must ALWAYS show (small font), not be hidden with descriptive notes. */
  _alwaysShow?: boolean;
  /** Optional personal addition (reshut) inside an Amidah bracha — render in a
   *  collapse and exclude from the chazara. */
  _optional?: boolean;
  /** Display scope for an insert whose recitation depends on silent-vs-chazara:
   *  'chazara' = only in the ש"ץ's repetition (e.g. Anenu between Geulah/Refuah);
   *  'silent'  = only in the individual's silent Amidah (e.g. Anenu in Shema
   *  Koleinu). Combined with the day-gate — hides in the wrong view, the tag
   *  still gates the day. */
  _chazaraScope?: 'silent' | 'chazara';
};

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&thinsp;/g, ' ');
}

function stripFormatting(s: string): string {
  // Keep <small> markers for our parsing; strip ALL other HTML display tags.
  // Includes: bold, italic, big, font, em, strong, mark, code, header levels, etc.
  return s.replace(
    /<\/?(?:b|i|u|sup|sub|span|br|p|div|big|font|em|strong|mark|code|h[1-6]|table|tr|td|th|thead|tbody|caption|nav|article|section|aside|figure|figcaption)\b[^>]*>/gi,
    '',
  ).trim();
}

/** Heuristic: does this look like a marker phrase (short directive ending with colon)?
 *  vs. a halachic note (long explanation)? */
function isMarkerPhrase(text: string): boolean {
  const t = text.trim();
  if (t.length > 80) return false;
  // Halachic notes typically include conditional/sequential words
  if (/(אם שכח|ונזכר|חוזר|במנחה אומר|דה"ח|דה״ח|דאם|דהיינו)/.test(t)) return false;
  // Must end with colon or "אומרים זה" / "אומר" / "מוסיף", OR end with a bare
  // "…אומרים" (Edot HaMizrach special-day rubrics: "בחנוכה אומרים", "בצום גדליה
  // … אומרים" — the day's psalm follows on the next line).
  return /[:：]$/.test(t) || /אומר(ים)?\s+זה|מוסיף(ים)?|יאמר/.test(t) || /אומרים\s*$/.test(t);
}

/** Map a Hebrew marker text to known condition tags. */
export function markerToTags(marker: string): ConditionTag[] {
  const m = marker.replace(/[״"׳']/g, '').replace(/[:.]/g, '').trim();
  const tags: ConditionTag[] = [];

  if (/(בעשית|בעשרת ימי תשובה)/.test(m)) tags.push('aseret-yemei-teshuva');
  if (/(בראש השנה|ברה ה|בראש)/.test(m) && /שנה|השנה/.test(m)) tags.push('rosh-hashana');
  if (/(ביום הכפורים|ביום הכיפורים|ביוהכ)/.test(m)) tags.push('yom-kippur');

  if (/(ברח|בראש חדש|בראש חודש|בראש החדש|לרח|לראש חודש|לראש חדש)/.test(m)) tags.push('rosh-chodesh');

  if (/(ביוט|ביום טוב|בשלש רגלים|בחג|בחגים|בשלוש רגלים)/.test(m)) tags.push('yom-tov');
  if (/(בחהמ|בחול המועד|בחוהמ)/.test(m)) tags.push('chol-hamoed');

  if (/(בסוכות|חג הסוכות|לסכות|לסוכות)/.test(m)) { tags.push('sukkot'); tags.push('yom-tov'); }
  if (/(בפסח|חג הפסח|חג המצות|במצות|לפסח)/.test(m)) { tags.push('pesach'); tags.push('yom-tov'); }
  if (/(בשבועות|חג השבועות|לשבועות)/.test(m)) { tags.push('shavuot'); tags.push('yom-tov'); }
  if (/(שמיני עצרת|בעצרת|שמ ע|לשמיני עצרת)/.test(m)) { tags.push('shmini-atzeret'); tags.push('yom-tov'); }

  // Accept BOTH the "ב…" (on) and "ל…" (for) prefixes — Chabad/EM labels print
  // "לחנוכה" / "לפורים" as the inline cue, not only "בחנוכה".
  if (/[בל]חנוכה/.test(m)) tags.push('chanukah');
  if (/[בלו]פורים/.test(m)) tags.push('purim'); // also "ופורים" in "בחנוכה ופורים"

  if (/(בתענית|לתענית|בצום|צומות|תענית ציבור|ביום צום)/.test(m)) tags.push('fast');

  // Tisha b'Av-only inserts: נחם (in בונה ירושלים) and the T"B form of עננו.
  // Marker forms: "בתשעה באב", "במנחת תשעה באב", "נחם", "מנחמי אבלי ציון".
  if (/(תשעה באב|תשעה־באב|בתשעה באב|במנחת תשעה|^נחם\b|אבלי ציון)/.test(m)) tags.push('tisha-b-av');

  // Torah-procession pesukim (יהללו / ובנוחה / הוצאת-הכנסת ס"ת) — only on days a
  // Sefer Torah is taken out. Marker forms across nuschaot.
  if (/שמוציאין ספר תורה|מוציאין ס["׳']?ת|כשמחזירים הס|הכנסת ס["׳']?ת|בהכנסת ספר|הוצאת ספר תורה|כשמוציאין/.test(m)) tags.push('torah-reading');

  if (/(במוצש|מוצש|[בל]מוצאי)/.test(m)) tags.push('motzei-shabbat'); // ל-prefix: "למוצאי שבת" (Chabad)

  // "בשבת" / "בשבתות" = on Shabbat — BUT exclude day-of-week phrases like
  // "בראשון בשבת" / "בשישי בשבת" which mean "on day N of the week", not Shabbat.
  if (/(בשבת|בשבתות)/.test(m)
      && !/(במוצש|במוצאי)/.test(m)
      && !/ב(ראשון|שני|שלישי|רביעי|חמישי|שישי|ששי)\s+ב?שבת/.test(m)) {
    tags.push('shabbat');
  }
  if (/(בחול|ביום חול|בימי החול)/.test(m) && !/(בחול המועד|בחוהמ)/.test(m)) tags.push('weekday');

  // Tal/Geshem (Israeli and other variations)
  if (/(בימות הגשמים|בחורף|משיב הרוח ומוריד הגשם|מוסף שמיני עצרת)/.test(m)) tags.push('winter-geshem');
  if (/(בימות החמה|בקיץ|מוריד הטל)/.test(m)) tags.push('summer-tal');
  // "ז' במרחשון" (7 Cheshvan) marks the START of "ותן טל ומטר" (winter rain
  // request). It belongs with tal-umatar markers, NOT with summer-tal.
  if (/(טל ומטר|ז במרחשון|מז במרחשון|בז במרחשון|מז חשון|בז חשון|ז חשון|דצמבר)/.test(m)) tags.push('tal-umatar');

  if (/(בארץ ישראל|באי|בארץ)/.test(m) && !/וחול|וחו ל/.test(m)) tags.push('in-israel');
  // "in-diaspora" requires an UNAMBIGUOUS marker — bare "בחול" is also "on a
  // weekday" (it would double-tag). Require explicit "בחו"ל / חוץ לארץ" forms.
  if (/(בחול הארץ|בחוץ לארץ|בחוצה לארץ|בחול לארץ|לחו ל|לחול|לחוץ לארץ)/.test(m)) tags.push('in-diaspora');

  // "כשחל ביום X" / "אם חל ביום X" - the current day falls on weekday X.
  // Hebrew weekday letters: א=Sun, ב=Mon, ג=Tue, ד=Wed, ה=Thu, ו=Fri, ש/שבת=Sat.
  // Used heavily in Hoshanot — the order depends on which day of Sukkot falls
  // on which weekday in the current year.
  // The Sephardi "Order of Hoshanot" rubrics phrase it as
  // "אם חל יום ראשון של סוכות ביום ב'", so allow that optional middle between
  // the verb and "ביום X" (without it the simple "אם חל ביום X" still matches).
  const fellMid = '(?:\\s+יום\\s+ראשון(?:\\s+של\\s+סוכות)?)?\\s*';
  const fellRx = (day: string) => new RegExp(`(כשחל|אם חל|חל)${fellMid}${day}`);
  if (fellRx('ביום\\s*א').test(m)) tags.push('fell-sun');
  if (fellRx('ביום\\s*ב').test(m)) tags.push('fell-mon');
  if (fellRx('ביום\\s*ג').test(m)) tags.push('fell-tue');
  if (fellRx('ביום\\s*ד').test(m)) tags.push('fell-wed');
  if (fellRx('ביום\\s*ה').test(m)) tags.push('fell-thu');
  if (fellRx('ביום\\s*ו').test(m)) tags.push('fell-fri');
  if (fellRx('(?:ביום\\s*ש|בשבת)').test(m)) tags.push('fell-sat');

  return tags;
}

function isAlternativeMarker(marker: string): boolean {
  return /במקום|אומר במקום|חותם|חתימה/.test(marker);
}

/**
 * Normalize a garbled Tetragrammaton vocalization. Sefaria's Edot HaMizrach text
 * points the divine name in ~19 Amida chatimot with NONSENSE nikud (e.g. יַהַוַהַ
 * all-patach, יֵהֵוֵהֵ all-tzere, יֹהֵוָהֵ mixed). Replace any standalone י-ה-ו-ה
 * token whose pointing isn't a VALID divine-name form with the standard יְהֹוָה.
 * (Valid forms — qere Adonai / qere Elokim — are left untouched.)
 */
const VALID_HASHEM = new Set(['יְהֹוָה', 'יֱהֹוִה', 'יְהוָה', 'יֱהוִה', 'יְהֹוָֽה']);
function normalizeDivineName(s: string): string {
  if (!s || s.indexOf('י') < 0) return s;
  // A standalone token: yud, he, vav, he — each optionally followed by nikud —
  // bounded by start/space/( on the left and space/punctuation/end on the right.
  const rx = /(^|[\s(])(י[֑-ׇ]*ה[֑-ׇ]*ו[֑-ׇ]*ה[֑-ׇ]*)(?=[\s,.:;)־"'’]|$)/g;
  return s.replace(rx, (m, pre, name) => (VALID_HASHEM.has(name) ? m : pre + 'יְהֹוָה'));
}

/** A NEGATIVE marker: the gated text is said normally and OMITTED on the tagged
 *  days, e.g. "בתשעה באב וביום הכפורים אין אומרים ברכה זו" (שעשה לי כל צרכי). */
function isNegativeMarker(marker: string): boolean {
  return /אין אומר|לא אומר|אינו אומר|אינם אומר|אין נופל/.test(marker);
}

/** Silent-vs-chazara scope from a rubric that introduces an Amidah insert:
 *  "…אומר הש״ץ…" / "…שליח ציבור אומר…" → said only in the chazara;
 *  "…אומר היחיד…" / "…בלחש…" / "…בתפילת הלחש…" → said only in the silent Amidah. */
function markerScope(marker: string): 'silent' | 'chazara' | undefined {
  const m = (marker || '').replace(/[֑-ׇ]/g, '').replace(/["׳'״]/g, '');
  // Chazan-only (order-insensitive: "אומר הש״ץ" / "הש״ץ אומר").
  if (/הש?ץ|שליח ציבור|החזן|חזן חוזר/.test(m) && /אומר|יאמר|חוזר/.test(m) && !/היחיד/.test(m)) return 'chazara';
  // Individual / silent.
  if (/היחיד|בלחש|בתפילת הלחש|כל אחד|בלבד היחיד/.test(m)) return 'silent';
  return undefined;
}

/**
 * A halachic-note that DESCRIBES a conditional insert (e.g. "אם שכח יעלה ויבא…")
 * should follow that insert's day-condition — hidden on days the insert isn't
 * said, even when "show notes" is on. Returns the day-tags the note inherits, or
 * null if it isn't tied to a dated insert.
 */
function noteConditionTags(body: string): ConditionTag[] | null {
  const bare = (body || '').replace(/[֑-ׇ]/g, '').replace(/<[^>]+>/g, '');
  if (/יעלה ויבא|יעלה ויבוא/.test(bare)) return ['rosh-chodesh', 'chol-hamoed', 'yom-tov'];
  if (/על הניסים|על הנסים/.test(bare)) return ['chanukah', 'purim'];
  if (/\bנחם\b|אבלי ציון/.test(bare)) return ['tisha-b-av'];
  if (/עננו/.test(bare)) return ['fast'];
  if (/זכרנו|בספר חיים|המלך הקדוש|המלך המשפט|ובכן תן פחדך/.test(bare)) return ['aseret-yemei-teshuva'];
  if (/טל ומטר|ותן טל|ותן ברכה/.test(bare)) return ['tal-umatar'];
  if (/משיב הרוח|מוריד הגשם/.test(bare)) return ['winter-geshem'];
  return null;
}

/**
 * A vocalized PRAYER insert inside the Amidah that is conditional but carries no
 * date-marker of its own (so the parser would otherwise classify it as plain
 * prayer and leak it every day — especially in Sefard, where allSmallAmidah
 * promotes <small> inserts to normal). Returns the day-tags it should gate by.
 * Signatures are specific chatimot/openings — they never match a regular bracha
 * body. (The regular "בונה ירושלים" chatima is a SEPARATE line, so gating the
 * "מנחם ציון" variant is safe.)
 */
function insertConditionTags(body: string): ConditionTag[] | null {
  const bare = (body || '').replace(/[֑-ׇ]/g, '').replace(/<[^>]+>/g, '').trim();
  if (/עננו (יהוה|אבינו|ה) עננו|עננו.{0,5}ביום צום/.test(bare)) return ['fast'];
  if (/אתה חוננתנו למדע/.test(bare)) return ['motzei-shabbat'];
  if (/מנחם ציון [בו]?בנין ירושלים|מנחם ציון ובונה ירושלים/.test(bare)) return ['tisha-b-av'];
  if (/^נחם יהוה אלהינו|נחם.{0,8}אבלי ציון/.test(bare)) return ['tisha-b-av'];
  if (/אבינו מלכנו אבינו אתה|אבינו מלכנו אין לנו מלך/.test(bare)) return ['fast', 'aseret-yemei-teshuva'];
  return null;
}

// Amida bracha NAMES — short unvocalized labels that orient the davener. Printed
// in every siddur; must not be hidden as "notes" (Sefard prints them as plain
// lines that the note-filter was swallowing).
const AMIDA_BRACHA_NAMES = /^(אבות|גבורות|קדושת השם|קדושת היום|האל הקדוש|דעת|אתה חונן|חונן הדעת|תשובה|סליחה|גאולה|רפואה|רפואה ופרנסה|ברכת השנים|השנים|ברך עלינו|קבוץ גליות|קיבוץ גליות|השבת המשפט|דין|ברכת המינים|המינים|צדיקים|על הצדיקים|בנין ירושלים|ירושלים|מלכות בית דוד|את צמח דוד|קבלת תפלה|שומע תפלה|עבודה|רצה|הודאה|מודים|ברכת כהנים|שים שלום|שלום)$/;

/**
 * A CONTEXT rubric — an unvocalized directive that must ALWAYS show (in the small
 * font), as opposed to a descriptive/forgot-it note (hidden unless notes are on).
 * Per the user's spec + the empirical note-filter audit: speaker/movement cues,
 * EVERY Kaddish label, section labels, and the Amida bracha names.
 */
export function isContextRubric(body: string): boolean {
  const bare = (body || '').replace(/[֑-ׇ]/g, '').replace(/<[^>]+>/g, '').trim();
  if (!bare) return false;
  // Descriptive / forgot-it / reason notes are NEVER context — stay toggle-hidden.
  if (/אם שכח|ונזכר|אם לא|אם טעה|אם אמר|הטעם|מה שתקנו|נוהגים|יש אומרים|יש נוהגים|המנהג|דכתיב|במדרש|לפי ש/.test(bare)) return false;
  // Amida bracha names (1-3 word labels).
  if (AMIDA_BRACHA_NAMES.test(bare)) return true;
  const words = bare.split(/\s+/).length;
  // Short speaker/Kaddish/movement cue (or any short line ending with a colon).
  if (words <= 6 && (
    /קדיש/.test(bare) ||
    /חזן|ש["׳']?ץ|הש["׳']?ץ|קהל|ציבור|צבור|אבלים|כהנים|עונין|עונים|עונה|אומר|אומרים|יאמרו|כורע|פוסע|חוזר|בלחש|בקול|עומד|יושב|מתחיל/.test(bare) ||
    /[:：]\s*$/.test(bare)
  )) return true;
  return false;
}

/** Parse a single raw paragraph from Sefaria into our structured form.
 *  This is a low-level pass; merging marker-only with next paragraph is done after. */
export function parseParagraphRaw(raw: string): ParsedParagraph & { _markerOnly?: boolean } {
  const result = parseParagraphRawInner(raw);
  // Preserve "was wrapped in <small>" so display can use the SMALL font, not the
  // large `sacred` one. Applies only to shown vocalized prayer (normal/conditional/
  // alternative) — halachic-notes are already small, marker-only has no body.
  // This is what makes Sefard's vocalized <small> inserts render small like the
  // other nuschaot (the parser strips <small> and otherwise loses the size).
  // Set for any non-marker result (halachic-notes included, so a seasonal insert
  // later PROMOTED to conditional — e.g. זכרנו — keeps the small font).
  if (!result._markerOnly) {
    const t = stripFormatting(decodeEntities((raw || '').trim()));
    if (/^<small>(?:(?!<\/small>)[\s\S])*<\/small>\s*$/i.test(t)) result.small = true;
  }
  return result;
}

function parseParagraphRawInner(raw: string): ParsedParagraph & { _markerOnly?: boolean } {
  if (!raw) return { body: '', kind: 'normal' };

  let txt = decodeEntities(raw).trim();
  txt = stripFormatting(txt);
  txt = normalizeDivineName(txt); // fix Sefaria's garbled שם-ה' vocalization (EM chatimot)

  // Modim DeRabbanan (kahal's chazara response) — detect by its unique signature
  // regardless of wrapping, BEFORE any other logic. It appears as a single
  // <small> (EM/Chabad Shacharit), or as a "מודים דרבנן <br><small>rubric</small>
  // <br><small>text</small>" line (EM Mincha). "אלהי כל בשר" is unique to it, so
  // this never matches the regular silent Modim. Always chazara-only.
  {
    const mdrBare = txt.replace(/<[^>]+>/g, '').replace(/[֑-ׇ]/g, '');
    if (/מודים אנחנו לך[,\s]*שאתה/.test(mdrBare) &&
        /(אלהי כל.?בשר|יוצרנו.{0,2}יוצר בראשית)/.test(mdrBare)) {
      const body = txt.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      return { body, kind: 'conditional', marker: 'מודים דרבנן (הקהל בחזרת הש״ץ)', tags: ['chazara-only'] };
    }
  }

  // Case A: whole paragraph wrapped in a SINGLE <small>...</small>. The inner
  // must not itself contain "</small>" — otherwise (with a lazy [\s\S]*?) the
  // match backtracks to the LAST </small> and swallows a line that is really
  // "<small>label</small> text <small>kavana</small>" (e.g. the Sefirat HaOmer
  // day lines), wrongly treating the whole thing as one small note.
  const wholeSmall = /^<small>((?:(?!<\/small>)[\s\S])*)<\/small>\s*$/i.exec(txt);
  if (wholeSmall) {
    const inner = wholeSmall[1].trim();
    // (Modim DeRabbanan is handled by the signature check at the top of this
    // function, before the wholeSmall branch.)
    // Sub-case: marker-only (directive that will apply to following paragraphs).
    // If markerToTags found a date condition → 'marker-only' (consumes 1 paragraph).
    // If no date tags → RUBRIC (e.g. "ואומר החזן חצי קדיש"): applies to ALL
    // following paragraphs in this leaf as one visual group.
    if (isMarkerPhrase(inner)) {
      const marker = inner.replace(/[:：]\s*$/, '').trim();
      const tags = markerToTags(marker);
      // Local helper: strip any remaining HTML (nested <small>, <b>...) from
      // text we're about to emit as body. Used by all the "prayer-text-as-
      // marker" / "section-label" fast paths below so HTML never leaks.
      const stripHtml = (s: string) => s
        .replace(/<\/?small>/gi, '')
        .replace(/<\/?[a-zA-Z][^>]*>/g, '')
        .trim();
      // Section label as standalone paragraph (e.g. "קדיש דרבנן", "משנה א").
      if (tags.length === 0 && /^(משנה|פרק|מזמור|תהלים|תהילים|קדיש|הלל|ברייתא)\s+\S/.test(marker)) {
        return { body: stripHtml(marker), kind: 'halachic-note' };
      }
      // Prayer text wrapped as "marker" — e.g. "ברוך שם כבוד מלכותו...". Same
      // consonant-count heuristic + directive prefix check as Case B.
      const markerConsonants = marker.replace(/[֑-ׇ\s]/g, '').length;
      const startsWithDirective =
        /^(יניח|יאמר|יקרא|אומר|מברך|עונה|סגולה|לאחר|וחוזר|יש נוהגים|בלחש|בקול|כשאומר|בעת|כשעומד|וכשעומד|אם אין|אם יש|כשמגיע|וכש)/.test(marker);
      if (tags.length === 0 && markerConsonants > 15 && !startsWithDirective) {
        return { body: stripHtml(marker), kind: 'normal' };
      }
      // No date tags → a rubric/directive (e.g. "ואומר החזן", "ויאמר בלחש").
      // We CAN'T reliably decide how many paragraphs the directive scopes over
      // (כל הקדיש? רק ברוך שם?), so render the directive as a small italic
      // halachic-note line and leave following paragraphs as their natural
      // prayer text. No multi-paragraph rubric box — too easy to over-wrap.
      if (tags.length === 0) {
        return { body: stripHtml(marker), kind: 'halachic-note' };
      }
      // Date-only marker (e.g. בעשי"ת:) — attach to NEXT normal paragraph.
      return {
        body: '',
        kind: 'conditional',
        marker,
        tags,
        _markerOnly: true,
        _negate: isNegativeMarker(marker),
      };
    }
    // Sub-case: Atta Chonantanu — Motzei Shabbat insert in the 4th Amidah
    // blessing ("אתה חונן לאדם דעת"). Sefaria wraps the entire insert in
    // <small> with no marker. Detect by the opening words.
    const innerBare = inner.replace(/[֑-ׇ]/g, '').replace(/<[^>]+>/g, '').trim();
    if (/^אתה חוננתנו/.test(innerBare)) {
      const body = inner.replace(/<\/?[a-zA-Z][^>]*>/g, '').trim();
      return {
        body,
        kind: 'conditional',
        marker: 'במוצאי שבת ויו״ט',
        tags: ['motzei-shabbat'],
      };
    }
    // Sub-case: Ve'titen Lanu — Yom Tov insert in Kedushat HaYom. Similar
    // pattern: long Hebrew prayer text wrapped in <small>.
    if (/^ותתן לנו|^ותתן־לנו/.test(innerBare)) {
      const body = inner.replace(/<\/?[a-zA-Z][^>]*>/g, '').trim();
      return {
        body,
        kind: 'conditional',
        marker: 'ביום טוב',
        tags: ['yom-tov'],
      };
    }
    // Strip ANY remaining HTML tags from inner so nested <small>directives</small>
    // don't leak as raw "<small>" text.
    const cleanInner = inner
      .replace(/<\/?small>/gi, '')
      .replace(/<\/?[a-zA-Z][^>]*>/g, '')
      .trim();
    // Sub-case: KADDISH text wrapped wholesale in <small> (the יתגדל ויתקדש
    // opening through יתברך). It's liturgy that must render — without this the
    // kaddish would start mid-way at "תתקבל" (Sefard Hallel, Song of the Day).
    // NOTE: kept deliberately NARROW. Other whole-<small> vocalized text is
    // left as a note here, because:
    //   • seasonal additions (זכרנו, בספר חיים) get promoted to a conditional
    //     in parseParagraphs when their date-marker is pending, and
    //   • chazara-only liturgy (קדושה / מודים דרבנן / ברכת כהנים) in the
    //     monolithic EM/Chabad Amidah MUST stay hidden in the silent Amidah —
    //     broadening this to all vocalized text leaked them into the silent.
    const bareInner = cleanInner.replace(/[֑-ׇ]/g, '').trim();
    // Kaddish liturgy wrapped whole in <small> must render (not hide as a note).
    // Besides the opening (יתגדל / יהא שמיה רבא), the Kaddish Titkabal CONTINUATION
    // lines — תתקבל צלותנא, יהא שלמא רבא, עושה שלום — are also <small>-wrapped in
    // Edot HaMizrach Mincha and were being dropped, leaving a truncated kaddish.
    if (/^יתגדל ויתקדש|^יתגדל ויתקדש שמ|^יהא שמ?יה רבא מברך|^תתקבל צלותהון|^תתקבל צלותנא|^יהא שלמא רבא|עושה שלום במרומיו/.test(bareInner)) {
      return { body: cleanInner, kind: 'normal' };
    }
    // Sub-case: halachic note (unvocalized instruction, or chazara-only liturgy
    // that stays out of the silent Amidah).
    return { body: cleanInner, kind: 'halachic-note' };
  }

  // Case B: paragraph starts with <small>marker:</small> followed by text
  const leadSmall = /^<small>([^<]+?)<\/small>\s*[:：]?\s*([\s\S]+)$/i.exec(txt);
  if (leadSmall) {
    const marker = leadSmall[1].trim().replace(/[:：]$/, '').trim();
    const body = leadSmall[2]
      .replace(/<\/?small>/gi, '')
      .replace(/<\/?[a-zA-Z][^>]*>/g, '')
      .trim();
    const tags = markerToTags(marker);
    // Section label (e.g. "משנה א", "פרק ב", "קדיש דרבנן") — short, no tags,
    // not a directive. Render the label inline as part of the body to avoid
    // a conditional badge or rubric box that would mislead the reader.
    const isSectionLabel =
      tags.length === 0 &&
      /^(משנה|פרק|מזמור|תהלים|תהילים|קדיש|הלל|ברייתא)\s+\S/.test(marker);
    if (isSectionLabel) {
      return { body: `${marker}\n${body}`, kind: 'normal' };
    }
    // Very short label/count marker (e.g. "ג"פ" = 3 times, "א/ב/ג" = mishna
    // numbering) — emit inline so it doesn't trigger a conditional box.
    const isShortLabel = tags.length === 0 && marker.length <= 6 &&
      /^[א-ת\d"׳״.\s]+$/.test(marker);
    if (isShortLabel) {
      return { body: `${marker}\n${body}`, kind: 'normal' };
    }
    // Long unrecognized marker — actual prayer text Sefaria wrapped weirdly.
    // Detect by consonant count (strip nikud + spaces) AND verify it doesn't
    // start with a directive verb (יניח, מברך, אומר, סגולה לומר, לאחר...).
    // Long prayer phrases like "ברוך שם כבוד מלכותו לעולם ועד" should be
    // absorbed into body; long directives stay as rubrics.
    const markerConsonants = marker.replace(/[֑-ׇ\s]/g, '').length;
    const startsWithDirective =
      /^(יניח|יאמר|יקרא|אומר|מברך|עונה|סגולה|לאחר|וחוזר|יש נוהגים|בלחש|בקול|כשאומר|בעת|כשעומד|וכשעומד|אם אין|אם יש|כשמגיע|וכש)/.test(marker);
    if (tags.length === 0 && markerConsonants > 15 && !startsWithDirective) {
      return { body: `${marker}\n${body}`, kind: 'normal' };
    }
    // Rubric/directive with a body attached (e.g. "ואומר ברכו: ברכו את ה'").
    // Don't wrap in a conditional box that might overscope. Render the
    // directive as a small inline prefix (in parens) and the body as normal
    // prayer text — same as printed siddurs do.
    if (tags.length === 0 && !isAlternativeMarker(marker)) {
      return { body: `(${marker}) ${body}`, kind: 'normal' };
    }
    const kind: ParagraphKind = isAlternativeMarker(marker) ? 'alternative' : 'conditional';
    return {
      body,
      kind,
      marker,
      tags,
      _negate: isNegativeMarker(marker),
    };
  }

  // Case C: no leading marker → normal text. Strip any inline <small> AND
  // any leftover HTML that survived (the final safety net for tags like
  // <big>, <em> that slipped through Sefaria's data).
  const body = txt.replace(/<\/?small>/gi, '').replace(/<\/?[a-zA-Z][^>]*>/g, '').trim();
  // Content-pattern detection — some paragraphs in Sefaria have NO marker
  // but begin with phrases that imply a seasonal condition (e.g. על הניסים
  // is only said on Chanukah/Purim, יעלה ויבוא only on R"H/חוה"מ/יו"ט).
  // Strip nikud + leading <b>/<i> for the regex check.
  const bare = body.replace(/[֑-ׇ]/g, '').replace(/<[^>]+>/g, '').trim();
  // ועל הנסים / על הנסים — Chanukah/Purim insertion in Modim
  if (/^ו?על ה?נסים|^ו?על הניסים/.test(bare)) {
    return { body, kind: 'conditional', marker: 'בחנוכה ופורים', tags: ['chanukah', 'purim'] };
  }
  // Chanukah-specific Al haNisim body — Sefaria's RC Musaf returns this
  // without a <small>בחנוכה:</small> marker (marker is plain text "לחנוכה:").
  if (/^בימי מתתיהו|^ובימי מתתיהו/.test(bare)) {
    return { body, kind: 'conditional', marker: 'בחנוכה', tags: ['chanukah'] };
  }
  // Purim-specific Al haNisim body.
  if (/^בימי מרדכי|^ובימי מרדכי/.test(bare)) {
    return { body, kind: 'conditional', marker: 'בפורים', tags: ['purim'] };
  }
  // Continuation paragraphs of the Chanukah Al haNisim story (Sefaria splits
  // the long Chanukah text across 3 paragraphs). Tag them as chanukah so they
  // hide together with the opening line.
  if (/^ואתה ברחמיך הרבים עמדת להם|^ואחר כן באו בניך|^ואחר כך באו בניך/.test(bare)) {
    return { body, kind: 'conditional', marker: 'בחנוכה (המשך)', tags: ['chanukah'] };
  }
  // Accept both ה and ק spellings (Sefaria uses אלקינו/אלקי in Israeli editions).
  if (/^אל[הק]ינו ו?אל[הק]י אבותינו יעלה ויבא/.test(bare) || /^יעלה ויבא/.test(bare)) {
    return { body, kind: 'conditional', marker: 'בר״ח, חוה״מ ויו״ט',
             tags: ['rosh-chodesh', 'chol-hamoed', 'yom-tov'] };
  }
  // יעלה ויבוא CONTINUATION — "זכרנו ה' אלהינו בו לטובה...". Sefaria emits it
  // as a plain paragraph (no marker), so without this it would orphan onto a
  // regular weekday after the conditional opener is hidden. Same condition as
  // the opener above.
  if (/^זכרנו (יהוה|יי|ה) ?אל[הק]ינו בו/.test(bare)) {
    return { body, kind: 'conditional', marker: 'בר״ח, חוה״מ ויו״ט (המשך יעלה ויבא)',
             tags: ['rosh-chodesh', 'chol-hamoed', 'yom-tov'] };
  }
  // Plain-text seasonal markers used in some Sefaria sources (RC Musaf, etc.)
  // — formatted as "בקיץ - <text>" / "בחורף - <text>" without <small> wrapping.
  if (/^בקיץ\s*[-–:]/.test(bare)) {
    const sliced = body.replace(/^בקיץ\s*[-–:]\s*/, '');
    return { body: sliced, kind: 'conditional', marker: 'בקיץ', tags: ['summer-tal'] };
  }
  if (/^בחורף\s*[-–:]/.test(bare)) {
    const sliced = body.replace(/^בחורף\s*[-–:]\s*/, '');
    return { body: sliced, kind: 'conditional', marker: 'בחורף', tags: ['winter-geshem'] };
  }
  // "Mashiv haRuach" line WITHOUT a season prefix — appears in some Musaf
  // sources. Tag as winter-geshem so it hides in summer.
  if (/^משיב הרוח ומוריד הגשם/.test(bare)) {
    return { body, kind: 'conditional', marker: 'בחורף', tags: ['winter-geshem'] };
  }
  // "Morid haTal" standalone — tag as summer-tal.
  if (/^מוריד הטל[:.,\s]/.test(bare) && !/מוריד הגשם/.test(bare)) {
    return { body, kind: 'conditional', marker: 'בקיץ', tags: ['summer-tal'] };
  }
  // Bare unvocalized marker line (e.g. "<b>למוצאי שבת</b>" → "למוצאי שבת"): a
  // short directive that maps to date tags and gates the block that follows it.
  // Without this it renders as a stray normal word. Unvocalized + short so that
  // actual (vocalized) prayer text never matches.
  if (body && !hasNikud(body) && body.replace(/\s/g, '').length <= 30) {
    const mt = markerToTags(body);
    if (mt.length > 0) {
      return { body: '', kind: 'conditional', marker: body.replace(/[:：]\s*$/, '').trim(), tags: mt, _markerOnly: true };
    }
  }
  return { body, kind: 'normal' };
}

/** Parse a list of raw paragraphs, merging marker-only paragraphs with the next one. */
/** Strip any HTML tags (`<big>`, `<small>`, etc.) Sefaria sometimes embeds. */
function stripHtml(s: string): string {
  if (!s) return s;
  // Remove any html tag (and any malformed escaped variants like &lt;big&gt; or &lt;/big&gt;).
  return s
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/&lt;\/?[a-zA-Z][^&]*&gt;/g, '')
    .replace(/<[^>]*\/>/g, '');
}

/**
 * Many siddurs embed inline alternates inside parentheses:
 *   "לעלא מן כל (בעשי"ת לעלא לעלא מכל) ברכתא..."
 *   "עושה שלום (בעשי"ת השלום) במרומיו..."
 * Where the parenthetical text starts with a seasonal marker phrase. We split
 * the paragraph so the alternate is its own conditional, leaving prefix and
 * suffix as normal text. Returns null if no inline-paren pattern is found.
 */
function preExtractInlineParens(raw: string): string[] | null {
  // Pattern: ( [<small>]MARKER[</small>] ALT ) where MARKER is a known season
  // phrase. Sefaria sometimes wraps the marker in inline <small> within the
  // parens, e.g. "(<small>בעשי"ת</small> לעלא לעלא מכל)" in קדיש לעלא.
  const markerRx = /(בעשי["״]ת|בעשרת ימי תשובה(?:\s+אומרים)?|בחנוכה|בפורים|בר["״]ח|בראש חודש|בחוה["״]מ|בחול המועד|ביו["״]ט|ביום טוב)/;
  const fullRx = new RegExp(
    `\\(\\s*(?:<small>\\s*)?${markerRx.source}(?:\\s*<\\/small>)?\\s+([^()<]+?)\\s*\\)`,
    'g',
  );
  if (!fullRx.test(raw)) return null;
  fullRx.lastIndex = 0;
  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fullRx.exec(raw)) !== null) {
    const prefix = raw.slice(last, m.index).trim();
    if (prefix) out.push(prefix);
    const marker = m[1].trim();
    const alt = m[2].trim();
    // Emit as Case-B alternative style — semantically these are "say X instead of Y"
    out.push(`<small>${marker} במקום:</small> ${alt}`);
    last = m.index + m[0].length;
  }
  const tail = raw.slice(last).trim();
  if (tail) out.push(tail);
  return out.length > 0 ? out : null;
}

/**
 * Some Sefaria nusachs (Edot HaMizrach, Sephardi) embed seasonal alternates
 * INLINE within a regular tefila paragraph using nested <small> tags:
 *
 *   "...באהבה: <small><small>בעשרת ימי תשובה אומרים:</small>
 *      זכרנו לחיים, מלך חפץ בחיים...</small>. מלך עוזר ומושיע..."
 *
 * Our parser is paragraph-based, so we split such paragraphs into:
 *   1. Prefix (normal text up to the nested-small)
 *   2. The seasonal alternate (as a standalone <small>marker:</small> body block
 *      → caught by Case B as a conditional)
 *   3. Suffix (the rest of the regular text)
 *
 * Repeats until no more nested patterns. Returns the array of raw paragraph
 * strings that parseParagraphRaw should handle individually.
 */
function preExtractInlineConditionals(raw: string): string[] {
  // <small><small>MARKER</small> [<br>] BODY</small> — colon may also be at end.
  // The BODY may contain inner tags (<br>, <b>) — Edot HaMizrach wraps the
  // Al-HaNisim / Anenu narrative this way — so capture it up to the OUTER
  // </small>, not just up to the first tag (the old [^<]+? stopped at <br>/<b>).
  // Marker→body separator varies: "</small> body", "</small><br>body", or just
  // "<br>body" (inner <small> left unclosed — EM Anenu line 29 does this).
  const pattern = /<small><small>([^<]+?)(?:<\/small>\s*(?:<br\s*\/?>\s*)?|<br\s*\/?>\s*)((?:(?!<\/small>)[\s\S])*?)<\/small>/;
  const out: string[] = [];
  let remaining = raw;
  let guard = 0;
  while (guard++ < 20) {
    const m = pattern.exec(remaining);
    if (!m) {
      if (remaining.trim()) out.push(remaining);
      break;
    }
    const prefix = remaining.slice(0, m.index);
    const marker = m[1].replace(/[:：]\s*$/, '').trim();
    const body = m[2].replace(/<br\s*\/?>/gi, ' ').trim(); // <br> → space so words don't glue
    const suffix = remaining.slice(m.index + m[0].length);
    if (prefix.trim()) out.push(prefix);
    // Re-emit as a regular Case-B style: <small>marker:</small> body — the
    // existing parser handles this perfectly via markerToTags.
    out.push(`<small>${marker}:</small> ${body}`);
    remaining = suffix;
  }
  return out;
}

/**
 * Some texts (Musaf, Edot-HaMizrach, Chabad) pack BOTH seasonal forms of the
 * Gevurot insert onto ONE line: "בקיץ: מוריד הטל. בחורף: משיב הרוח ומוריד הגשם."
 * As a single paragraph it reads as a note and neither form shows. Split it
 * into two season-marked fragments so the right one renders per the season.
 * Returns null when the line isn't this combined form.
 */
function preExtractCombinedSeason(raw: string): string[] | null {
  const inner = raw.replace(/<\/?small>/gi, '').replace(/<\/?b>/gi, '').trim();
  const m = /^בקיץ\s*[:.．׃]?\s*([\s\S]+?)\s*[:.．׃]?\s*בחורף\s*[:.．׃]?\s*([\s\S]+?)\s*[:.．׃]?\s*$/.exec(inner);
  if (!m) return null;
  const summer = m[1].trim();
  const winter = m[2].trim();
  // Both halves must be short, vocalized prayer phrases (guards against matching
  // a long halachic note that merely mentions both seasons).
  if (!summer || !winter || summer.length > 60 || winter.length > 60) return null;
  if (!hasNikud(summer) || !hasNikud(winter)) return null;
  return [`<small>בקיץ:</small> ${summer}`, `<small>בחורף:</small> ${winter}`];
}

/**
 * Packed conditional blob: ONE Sefaria element that opens with a <small>
 * DATE-marker then packs many <br>-separated prayer lines (Chabad's Avinu
 * Malkenu is one element with 51 <br> and 4 <small> pairs). stripFormatting()
 * drops <br>, so by the time parseParagraphRaw runs the line is glued into one
 * normal paragraph that leaks on every day. Detect it HERE (raw still has <br>)
 * and re-emit as a single "<small>HEAD:</small> line\nline…" so Case B turns it
 * into ONE conditional gated by the marker. Its body opens with the litany's
 * first verse, so the litany-continuation logic carries any plain tail element.
 * Signature: a <br> appears before the opening <small> closes, and HEAD (the
 * text before the first <br>) maps to date tags.
 */
function preExtractPackedBlob(raw: string): string[] | null {
  if (!/^\s*<small>/i.test(raw)) return null;
  const open = raw.search(/<small>/i);
  const firstBr = raw.search(/<br\s*\/?>/i);
  const firstClose = raw.search(/<\/small>/i);
  if (firstBr < 0 || (firstClose >= 0 && firstClose < firstBr)) return null;
  const head = raw.slice(open + 7, firstBr).replace(/<[^>]+>/g, '').replace(/[:：]\s*$/, '').trim();
  const tags = markerToTags(head);
  if (!tags.length || /^(בקיץ|בחורף|בימות)/.test(head)) return null;
  const prayerLines = raw.slice(firstBr).split(/<br\s*\/?>/i)
    .map((s) => s.replace(/<[^>]+>/g, '').trim())
    .filter((s) => s && isVocalizedDense(s));
  if (!prayerLines.length) return null;
  return [`<small>${head}:</small> ${prayerLines.join('\n')}`];
}

export function parseParagraphs(raw: string[], opts?: { amidah?: boolean }): ParsedParagraph[] {
  const result: ParsedParagraph[] = [];
  let pendingMarker: { marker: string; tags: ConditionTag[]; alternative: boolean; negate: boolean } | null = null;

  // First pass: split paragraphs with INLINE nested <small> conditionals
  // (Edot HaMizrach / Sephardi pattern) into separate raw fragments so the
  // normal Case-B parser sees each fragment standalone.
  //
  // We INTENTIONALLY do NOT split inline parenthetical alternates
  // (e.g. "לעלא מן כל (בעשי"ת לעלא לעלא מכל) ברכתא"). Printed siddurs use
  // exactly this convention — the alternate stays inline in parens so the
  // sentence reads continuously. Splitting would break the kaddish into
  // multiple paragraphs with awkward gaps.
  const expanded: string[] = [];
  for (const r of raw) {
    const packed = preExtractPackedBlob(r);
    if (packed) {
      expanded.push(...packed);
      continue;
    }
    if (/<small><small>/i.test(r)) {
      expanded.push(...preExtractInlineConditionals(r));
      continue;
    }
    const season = preExtractCombinedSeason(r);
    if (season) {
      expanded.push(...season);
      continue;
    }
    expanded.push(r);
  }

  // Bundled Kedushah (Ashkenazi Musaf "Kedushat HaShem"): one leaf holds BOTH
  // the public Kedushah (נקדש/קדוש קדוש/לדור ודור — chazara only) AND the silent
  // 3rd bracha (אתה קדוש ושמך קדוש... האל הקדוש). Tag the public block
  // chazara-only so the silent Amidah shows only אתה קדוש. Scoped to leaves that
  // contain BOTH, so the קדוש-קדוש in Uva Letzion / Yotzer (said silently) is
  // untouched.
  const bareAll = expanded.map((e) => e.replace(/<[^>]+>/g, '').replace(/[֑-ׇ]/g, '')).join('\n');
  const bundledKedushah =
    /אתה קדוש,?\s*ושמך קדוש/.test(bareAll) &&
    /(נקדש את שמך|נקדישך|נעריצך|כתר יתנו|אומרים כאן קדושה)/.test(bareAll);
  // ASHKENAZI Kedushah is self-contained: "לדור ודור נגיד גדלך... כי אל מלך
  // גדול וקדוש אתה: ברוך... האל הקדוש" CLOSES the bracha, so the chazara ends
  // there and the silent "אתה קדוש ושמך קדוש" is silent-only. Sephardi / Edot
  // HaMizrach / Chabad end the Kedushah at "ימלך... הללויה" — there "אתה קדוש
  // ושמך קדוש... האל הקדוש" IS the bracha close, said in BOTH silent and
  // chazara, so it must NOT be silent-only.
  const selfContainedKedushah = /לדור ודור נגיד גדלך/.test(bareAll);
  let inKedushahBlock = false;
  let inSilentBracha = false;

  // Some markers open a MULTI-PARAGRAPH conditional block that doesn't end
  // until a closing-rubric marker appears (e.g. Birkat Kohanim on a fast day:
  //   open  → "בתענית ציבור אומר כאן הש"ץ ברכת כהנים:"
  //   block → "ברכת כהנים" + "אלהינו ואלהי אבותינו..." + 3 priestly verses
  //   close → "לאחר ברכת כהנים יאמרו הציבור:"
  // We detect openings by phrases like "אומר ברכת כהנים" / "אומר עננו" / "אומר
  // כאן" and keep the marker active across all paragraphs (tagging each with
  // the marker's date condition) until the next marker-only paragraph closes
  // the block.
  const isMultiParaOpening = (marker: string): boolean => {
    return /אומר(ים)?\s+(כאן\s+)?(ברכת כהנים|עננו|נחם|על הניסים|הלל)/.test(marker)
      || /ברכת כהנים|נחם/.test(marker)
      // Torah-procession block: "…שמוציאין ספר תורה אומרים יהללו…" gates the run
      // יהללו → הודו → לדוד-מזמור (until the next marker / kaddish / עלינו).
      || /שמוציאין ספר תורה|אומרים יהללו|כשמחזירים הס/.test(marker)
      // Motzei-Shabbat maariv addition: ויהי נועם / תהלים צ"א / ובא לציון — a run
      // of elements gated by a bare "<b>למוצאי שבת</b>" header, closed at עלינו.
      || /[בל]מוצאי שבת/.test(marker);
  };
  let multiParaActive: { marker: string; tags: ConditionTag[] } | null = null;
  // אבינו מלכנו litany: a date-marker opens a multi-line run (EM prints each
  // verse on its own <small> line). The opener's condition is carried across the
  // whole run via this state so the entire litany is gated, not just line 1.
  let litanyTags: ConditionTag[] | null = null;
  let litanyMarker: string | undefined;
  // Optional personal addition (reshut): an intro rubric ("מי שרוצה…יאמר כאן
  // תחנה", "תפלה שיתפלל על מזונו") gates the vocalized <small> prayer that follows
  // it (תפילה לחולה / בקשת פרנסה). We show the intro and put the prayer in a
  // collapse (and out of the chazara).
  let pendingReshut = false;

  for (const rRaw of expanded) {
    // DO NOT stripHtml here — that wipes <small> markers that parseParagraphRaw
    // depends on to identify conditional paragraphs. parseParagraphRaw uses
    // stripFormatting which preserves <small> on purpose.
    const p = parseParagraphRaw(rRaw);
    if (!p.body && !p._markerOnly) continue;

    // Bundled-Kedushah block: hide the public Kedushah lines from the silent
    // Amidah (chazara-only), keeping the silent אתה קדוש visible.
    if (bundledKedushah && p.body) {
      const bare = p.body.replace(/[֑-ׇ]/g, '').trim();
      // Chabad glues a rubric onto the Kedushah line ("כשהש״ץ חוזר... אומרים
      // זה:נקדישך ונעריצך"), so also match "נקדישך ונעריצך" / "נקדש את שמך"
      // mid-line, not only at the start.
      if (/^(נקדש את שמך|נקדישך|נעריצך|כתר יתנו)/.test(bare) || /(נקדישך ונעריצך|נקדש את שמך בעולם|כתר יתנו לך)/.test(bare) || /אומרים כאן קדושה/.test(bare)) inKedushahBlock = true;
      if (/^אתה קדוש,?\s*ושמך קדוש/.test(bare)) {
        inKedushahBlock = false;
        // ONLY when the Kedushah self-closes with לדור-ודור (Ashkenazi) is the
        // silent 3rd bracha hidden in the chazara. For Sephardi/EM/Chabad it IS
        // the chazara's bracha close → leave it normal (shown in both).
        if (selfContainedKedushah) {
          inSilentBracha = true;
          result.push({ body: p.body, kind: 'normal', tags: ['silent-only'] });
          continue;
        }
      }
      // When the silent bracha's closing ("ברוך אתה ה'... האל הקדוש") sits on its
      // OWN line (Musaf "Kedushat HaShem"), tag it silent-only too so it doesn't
      // leak into the chazara as a duplicate closing.
      if (inSilentBracha) {
        if (/^ברוך אתה/.test(bare)) {
          inSilentBracha = false;
          result.push({ body: p.body, kind: 'normal', tags: ['silent-only'] });
          continue;
        }
        inSilentBracha = false;
      }
      // Tag every VOCALIZED line of the Kedushah block chazara-only. Use nikud
      // (not p.kind) as the test: Sefaria wraps the Kedushah lines whole in
      // <small> (נְקַדֵּשׁ / לְדוֹר וָדוֹר), which the parser would otherwise
      // mis-classify as instruction notes and drop from the chazara. Genuine
      // un-vocalized rubrics in the block stay as-is.
      if (inKedushahBlock && hasNikud(p.body)) {
        result.push({ body: p.body, kind: 'conditional', marker: 'קדושה — בחזרת הש״ץ', tags: ['chazara-only'] });
        continue;
      }
    }

    if (p._markerOnly) {
      // A new marker arrives — close any active multi-paragraph block first.
      multiParaActive = null;
      // If this marker OPENS a multi-paragraph conditional, start it.
      if (p.tags && p.tags.length > 0 && isMultiParaOpening(p.marker!)) {
        multiParaActive = { marker: p.marker!, tags: p.tags };
        continue;
      }
      // Otherwise single-paragraph: attach to next normal paragraph.
      pendingMarker = {
        marker: p.marker!,
        tags: p.tags ?? ['unknown'],
        alternative: isAlternativeMarker(p.marker!),
        negate: !!p._negate,
      };
      continue;
    }

    // Torah-procession instruction — a LONG rubric (not a clean colon-marker, so
    // it falls through as a halachic-note) like "בשני ובחמישי…שמוציאין ספר תורה
    // אומרים יהללו כשמחזירים הס״ת…". It opens the יהללו → הודו → לדוד-מזמור block,
    // which must show ONLY when a Sefer Torah is taken out. Gate the run as
    // torah-reading. (Content-gating יהללו itself is unsafe — that exact verse is
    // also in Pesukei Dezimra / Tehillim 148.)
    // Instruction lines that OPEN a gated multi-paragraph block. These can be
    // classified normal OR halachic-note (the prayer-as-marker heuristic varies),
    // so match by INSTRUCTION-SPECIFIC content (phrases that never occur in a
    // psalm body), regardless of kind. The instruction itself is dropped.
    {
      const bareTr = (p.body || '').replace(/[֑-ׇ]/g, '').replace(/<[^>]+>/g, '');
      // Torah procession (יהללו → לדוד-מזמור → ובנוחה).
      if (/שמוציאין ספר תורה|כשמחזירים הס|כשמוציאין ס|מוציאין ספר תורה|בהוצאת ספר תורה/.test(bareTr)) {
        multiParaActive = { marker: 'בהוצאת ספר תורה', tags: ['torah-reading'] }; continue;
      }
      // "לדוד ה'" leaf psalm-blocks. The DAILY closing kaddish (יתגדל ויתקדש שמה
      // רבא) is the hard-closer below, so it always shows.
      if (/אחר כל תפלה.{0,30}אורי|מנהג.{0,20}לומר.{0,30}אורי/.test(bareTr)) {
        multiParaActive = { marker: 'מאלול עד הושענא רבה', tags: ['elul'] }; continue;
      }
      if (/בבית האבל/.test(bareTr)) {
        multiParaActive = { marker: 'בבית האבל', tags: ['bet-avel'] }; continue;
      }
      if (/שאין בהם תחנון|אין בו תחנון/.test(bareTr)) {
        multiParaActive = { marker: 'בימים שאין תחנון', tags: ['no-tachanun'] }; continue;
      }
    }

    // If a multi-paragraph block is active, tag every paragraph with its marker
    // until a closing rubric is hit. The closer is typically a halachic-note
    // wrapped in <small>...</small> like "לאחר ברכת כהנים יאמרו הציבור" or
    // similar instructional text — once we see one, end the block and emit
    // the note normally.
    if (multiParaActive) {
      const bareStart = (p.body || '').replace(/[֑-ׇ]/g, '').replace(/<[^>]+>/g, '').trim();
      // Hard structural closer: עלינו / kaddish always end an inserted block,
      // even with no halachic-note between (Chabad maariv motzei-shabbat block
      // ויהי נועם → ובא לציון is followed directly by עלינו, which must show
      // every night).
      // Hard closer: עלינו / a full Kaddish opening (also catches a kaddish that
      // begins with a "קדיש יתום" label, e.g. the daily kaddish ending the
      // "לדוד ה'" leaf — it must show even after the no-Tachanun psalm-block).
      const isHardCloser = /^(עלינו לשבח|יתגדל ויתקדש|תתקבל)/.test(bareStart) ||
        /יתגדל ויתקדש שמה? רבא/.test(bareStart);
      // A halachic-note closes the block ONLY if it's a real closing instruction,
      // not a short speaker/context cue ("קהל:", "שליח ציבור") that belongs INSIDE
      // the block (e.g. the יהללו → הודו → לדוד-מזמור Torah-procession run).
      if ((p.kind === 'halachic-note' && !isContextRubric(p.body)) || isHardCloser) {
        multiParaActive = null;
        // fall through to normal handling below
      } else {
        result.push({
          ...p,
          body: p.body,
          kind: 'conditional',
          marker: multiParaActive.marker,
          tags: multiParaActive.tags,
        });
        continue;
      }
    }

    // Convert the paragraph the marker points to into its conditional. Usually
    // the next paragraph is 'normal', but Sefard wraps seasonal insertions
    // (זכרנו, בספר חיים) in their own <small>, so parseParagraphRaw classifies
    // them as halachic-note. When a DATE marker is pending and that note is
    // fully vocalized (dense nikud = prayer, not an instruction), it's the
    // insertion the marker introduced — promote it to the conditional. Plain
    // unvocalized notes (and standalone tehinot with no pending date marker)
    // are left untouched.
    if (pendingMarker &&
        (p.kind === 'normal' || (p.kind === 'halachic-note' && isVocalizedDense(p.body)))) {
      result.push({
        ...p,
        body: p.body,
        kind: pendingMarker.alternative ? 'alternative' : 'conditional',
        marker: pendingMarker.marker,
        tags: pendingMarker.tags,
        _negate: pendingMarker.negate,
      });
      // אבינו מלכנו litany: the marker ("בעשרת ימי תשובה אומרים" / "בתענית...")
      // gates only THIS first line; EM prints the rest of the litany as separate
      // <small> lines. Remember the condition so the whole run stays gated below.
      if (/^אבינו מלכנו/.test((p.body || '').replace(/[֑-ׇ]/g, '').trim())) {
        litanyTags = pendingMarker.tags;
        litanyMarker = pendingMarker.marker;
      }
      pendingMarker = null;
      continue;
    }

    // Continuation of an active אבינו מלכנו litany — carry the opener's condition
    // onto each subsequent "אבינו מלכנו" line so the whole litany is hidden on
    // ordinary days (and not promoted to prayer by opts.amidah). The first
    // non-litany line ends the run.
    if (litanyTags) {
      if (/^אבינו מלכנו/.test((p.body || '').replace(/[֑-ׇ]/g, '').trim()) &&
          (p.kind === 'normal' || (p.kind === 'halachic-note' && isVocalizedDense(p.body)))) {
        result.push({ ...p, body: p.body, kind: 'conditional', marker: litanyMarker, tags: litanyTags });
        continue;
      }
      litanyTags = null;
      litanyMarker = undefined;
    }

    // If a marker was pending but the next was already conditional/note,
    // drop the pending marker (don't emit an empty conditional badge with
    // no body — those look like floating orphans to the reader).
    if (pendingMarker) {
      pendingMarker = null;
    }

    // Avinu Malkeinu litany opened by a leadSmall conditional (Chabad: the
    // rubric+first verse are one "<small>…אבינו מלכנו</small>אבינו מלכנו…" line,
    // so parseParagraphRaw already returned a conditional). Start the litany so
    // the following plain "אבינו מלכנו" verses inherit the same condition.
    if ((p.kind === 'conditional' || p.kind === 'alternative') && p.tags && p.tags.length &&
        /^אבינו מלכנו/.test((p.body || '').replace(/[֑-ׇ]/g, '').trim())) {
      litanyTags = p.tags;
      litanyMarker = p.marker;
    }

    // Inside a split monolithic Amidah (opts.amidah), Sefaria sometimes wraps
    // every bracha body whole in <small> (Sefard Yom Tov Musaf). parseParagraphRaw
    // classifies the long ones (>80 chars, not marker-shaped) as halachic-notes,
    // which would hide the actual Amidah text from the silent reading. We KNOW
    // these are prayer — the chatima-splitter only groups vocalized lines — so
    // promote dense-vocalized notes back to prayer. The chazara-only liturgy
    // (Kedushah / Modim DeRabbanan) was already tagged and `continue`d above, so
    // it never reaches here; only genuine bracha bodies are promoted.
    // Optional personal addition (reshut). An intro rubric introduces it; the
    // next dense-vocalized <small> line IS the optional prayer.
    {
      const bareR = (p.body || '').replace(/[֑-ׇ]/g, '').replace(/<[^>]+>/g, '');
      // Detect by content signature (the intro may be vocalized — parnassa's is —
      // so don't gate on nikud). These phrases are specific directive intros that
      // don't occur inside actual prayer text.
      const isReshutIntro =
        /מי שרוצה|הרוצה לומר|הרוצה להתפלל|יש נוהגים לומר|הנוהגים לומר|תחנה זו|תפלה שיתפלל|תפלה שיאמר|יאמר כאן (תחנה|תפלה|בקשה)/.test(bareR);
      if (isReshutIntro) {
        p._alwaysShow = true; // show the "say this tachina if you wish" line
        pendingReshut = true;
      } else if (pendingReshut) {
        pendingReshut = false;
        if (p.small && isVocalizedDense(p.body) &&
            !p.tags?.length && !p.tags?.includes('chazara-only')) {
          p._optional = true;
        }
      }
    }

    // A vocalized conditional INSERT in the Amidah (עננו / אתה חוננתנו / מנחם ציון
    // / the Avinu Malkenu litany) carries no date-marker, so it would leak every
    // day — and in Sefard the allSmallAmidah promotion turns it into normal[].
    // Tag it conditional so it gates by day (hidden on ordinary days, shown on
    // its own). This MUST win over the amidah promotion.
    const insertTags =
      (!p.tags || p.tags.length === 0) ? insertConditionTags(p.body) : null;
    const promotedByAmidah =
      !insertTags && opts?.amidah && p.kind === 'halachic-note' && isVocalizedDense(p.body);
    let outKind: ParagraphKind = insertTags ? 'conditional' : (promotedByAmidah ? 'normal' : p.kind);
    // A descriptive note about a dated insert inherits that insert's day-tags, so
    // it hides/shows together with the insert (even when "show notes" is on) —
    // e.g. the "forgot Yaaleh VeYavo" note only on R"Ch/חוה"מ/יו"ט.
    const inheritedTags =
      !insertTags && outKind === 'halachic-note' && (!p.tags || p.tags.length === 0)
        ? noteConditionTags(p.body)
        : null;
    result.push({
      ...p,
      body: p.body,
      kind: outKind,
      marker: insertTags ? (p.marker ?? '🔹 תוספת ליום מיוחד') : p.marker,
      tags: insertTags ?? inheritedTags ?? p.tags,
      // A bracha body promoted to main prayer (YT Musaf) is NOT small text.
      small: promotedByAmidah ? false : p.small,
    });
  }

  // Dangling pending marker — drop it. Don't emit a floating empty badge.
  pendingMarker = null;
  multiParaActive = null;

  return result;
}

/** Compute which condition tags apply today. */
export function activeTags(date: Date = new Date(), inIsrael = true): Set<ConditionTag> {
  const out = new Set<ConditionTag>();
  out.add(inIsrael ? 'in-israel' : 'in-diaspora');

  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const gregDay = date.getDay();

  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  const isRoshChodesh = events.some((e) => e.getFlags() & flags.ROSH_CHODESH);
  // EXCLUDE the EREV flag: hebcal tags "Erev Tish'a B'Av" with a fast flag, but
  // the eve is not itself a fast day (עננו / נחם / the fast Torah-reading belong
  // to the fast proper). Taanit Bechorot (Erev Pesach, firstborns only) is also
  // dropped here intentionally — it is not a public fast in the siddur sense.
  const isFastDay = events.some((e) =>
    (e.getFlags() & (flags.MAJOR_FAST | flags.MINOR_FAST)) && !(e.getFlags() & flags.EREV));
  const isYomTov = events.some((e) => e.getFlags() & flags.CHAG);
  const isCholHamoed = events.some((e) => e.getFlags() & flags.CHOL_HAMOED);

  if (isRoshChodesh) out.add('rosh-chodesh');
  // Rosh Hashana (1-2 Tishrei) and Yom Kippur (10 Tishrei) are CHAG in hebcal,
  // but liturgically they are NOT the "yom tov" that takes יעלה ויבוא / the
  // festival ותתן לנו — those days have their own Amidah. Excluding them keeps
  // weekday-Amidah conditionals (YvY, festival kedushat hayom) from rendering
  // on RH/YK. The specific rosh-hashana / yom-kippur tags are still set below.
  const isRoshHashanaDay = m === months.TISHREI && (d === 1 || d === 2);
  const isYomKippurDay = m === months.TISHREI && d === 10;
  if (isYomTov && !isRoshHashanaDay && !isYomKippurDay) out.add('yom-tov');
  if (isCholHamoed) out.add('chol-hamoed');
  if (isFastDay) out.add('fast');
  // Tisha b'Av is the only MAJOR_FAST in Av (Yom Kippur, the other MAJOR_FAST,
  // is in Tishrei). Covers the deferred 10-Av observance too (still month Av).
  if (isFastDay && m === months.AV) out.add('tisha-b-av');
  // Torah reading: Mondays & Thursdays, Rosh Chodesh, Chol HaMoed, Yom Tov,
  // Chanukah, Purim, and public fasts. (Shabbat handled elsewhere / out of scope.)
  if (gregDay === 1 || gregDay === 4 || out.has('rosh-chodesh') || out.has('chol-hamoed') ||
      out.has('yom-tov') || out.has('chanukah') || out.has('purim') || isFastDay) {
    out.add('torah-reading');
  }
  // לדוד ה' אורי (תה' כז) — Elul through Hoshana Rabba (21 Tishrei).
  if (m === months.ELUL || (m === months.TISHREI && d <= 21)) out.add('elul');
  // Days without Tachanun (for the תה' טז insert) — Shabbat handled by view.
  if (gregDay === 6 || out.has('rosh-chodesh') || out.has('yom-tov') || out.has('chol-hamoed') ||
      out.has('chanukah') || (m === months.NISAN) || (m === months.TISHREI && d >= 11 && d <= 21)) {
    out.add('no-tachanun');
  }

  // Specific yom-tov tags
  if (m === months.TISHREI) {
    if (d === 1 || d === 2) out.add('rosh-hashana');
    if (d === 10) out.add('yom-kippur');
    if (d >= 15 && d <= 21) out.add('sukkot');
    if (d === 22 || (!inIsrael && d === 23)) out.add('shmini-atzeret');
  }
  if (m === months.NISAN && d >= 15 && d <= 21) out.add('pesach');
  if (m === months.SIVAN && (d === 6 || (!inIsrael && d === 7))) out.add('shavuot');

  // Aseret Yemei Teshuva
  if (m === months.TISHREI && d >= 1 && d <= 10) out.add('aseret-yemei-teshuva');

  // Chanukah
  if ((m === months.KISLEV && d >= 25) || (m === months.TEVET && d <= 2)) out.add('chanukah');

  // Purim
  const adarMonth = HDate.isLeapYear(hd.getFullYear()) ? months.ADAR_II : months.ADAR_I;
  if (m === adarMonth && (d === 14 || (inIsrael && d === 15))) out.add('purim');

  // Shabbat / motzei
  if (gregDay === 6) out.add('shabbat');
  else out.add('weekday');
  if (gregDay === 0) out.add('motzei-shabbat');
  if (gregDay === 6 && date.getHours() >= 18) out.add('motzei-shabbat');

  // Tal/Geshem
  const isAdar = m === months.ADAR_I || m === months.ADAR_II;
  const isWinter =
    (m === months.TISHREI && d >= 22) ||
    m === months.CHESHVAN ||
    m === months.KISLEV ||
    m === months.TEVET ||
    m === months.SHVAT ||
    isAdar ||
    (m === months.NISAN && d <= 15);
  if (isWinter) out.add('winter-geshem');
  else out.add('summer-tal');

  // ותן טל ומטר. END is the same everywhere — 15 Nisan. The START differs:
  //   • Israel:    7 Cheshvan.
  //   • Diaspora:  the 60th day after Tekufat Tishrei — Gregorian Dec 4, or
  //                Dec 5 in the year preceding a civil leap year. Computing it
  //                from 7 Cheshvan (as before) gave the diaspora the request
  //                ~3 weeks too early.
  const beforePesachEnd =
    m === months.CHESHVAN || m === months.KISLEV || m === months.TEVET ||
    m === months.SHVAT || isAdar || (m === months.NISAN && d <= 15);
  let isTalUmatar: boolean;
  if (inIsrael) {
    isTalUmatar = beforePesachEnd && !(m === months.CHESHVAN && d < 7);
  } else {
    const gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate();
    const leapNext = ((gy + 1) % 4 === 0 && (gy + 1) % 100 !== 0) || (gy + 1) % 400 === 0;
    const decStart = leapNext ? 5 : 4;
    const pastDiasporaStart = (gm === 12 && gd >= decStart) || gm <= 4;
    isTalUmatar = beforePesachEnd && pastDiasporaStart;
  }
  if (isTalUmatar) out.add('tal-umatar');

  return out;
}

/** The Hebrew "day name" to inject into יעלה ויבוא today, if applicable. */
export function yaalehDayName(date: Date = new Date(), inIsrael = true): string | null {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  const isRC = events.some((e) => e.getFlags() & flags.ROSH_CHODESH);
  if (m === months.TISHREI && d === 1) return 'הַזִּכָּרוֹן הַזֶּה';
  if (m === months.TISHREI && d === 2) return 'הַזִּכָּרוֹן הַזֶּה';
  if (m === months.TISHREI && d >= 15 && d <= 21) return 'חַג הַסֻּכּוֹת הַזֶּה';
  if (m === months.TISHREI && d === 22) return 'שְׁמִינִי חַג הָעֲצֶרֶת הַזֶּה';
  if (m === months.NISAN && d >= 15 && d <= 21) return 'חַג הַמַּצּוֹת הַזֶּה';
  if (m === months.SIVAN && (d === 6 || (!inIsrael && d === 7))) return 'חַג הַשָּׁבֻעוֹת הַזֶּה';
  if (isRC) return 'רֹאשׁ הַחֹדֶשׁ הַזֶּה';
  return null;
}

/* ───────────────────── monolithic Amidah splitter ─────────────────────
 *
 * Ashkenaz Sefaria splits the Amidah into 22 separate refs (Patriarchs,
 * Divine Might, Holiness of God, Kedushah, ...). Sefard / Edot-HaMizrach /
 * Chabad pack the WHOLE Amidah into ONE leaf — but the text itself carries
 * standalone blessing-name HEADERS (`<b>אבות</b>`, `<b>גבורות</b>`, ...) and
 * `<small>ברכת כהנים</small>`. These headers have NO nikud, while the prayer
 * body always does — that's the cue we split on.
 *
 * Splitting the monolith into virtual sub-sections (with the SAME English
 * names Ashkenaz uses) lets all the leaf-level logic in read.tsx — hiding
 * Kedushah / Modim DeRabbanan / Birkat Kohanim in the silent Amidah, the
 * chazarat-hashatz collapse, the נקדישך-in-silent fix — work for Sefard too.
 *
 * Two sections have no standalone header and are detected by content:
 *   • Modim DeRabbanan — embedded mid-הודאה, said only in chazara (kahal).
 *   • Concluding Passage (אלהי נצור) — the personal silent meditation that
 *     marks where the chazara collapse anchors.
 */
export type AmidahSection = {
  /** Canonical Ashkenaz English name — drives isKedushahLeaf etc. in read.tsx. */
  en: string;
  /** Hebrew blessing name — shown as the section title. */
  he: string;
  /** Raw Sefaria lines belonging to this section (header line excluded). */
  lines: string[];
};

/** Hebrew blessing-name headers, in Amidah order, mapped to the canonical
 *  Ashkenaz English ref names so read.tsx's predicates recognize each one. */
const AMIDAH_HEADERS: { rx: RegExp; en: string; he: string }[] = [
  { rx: /^אבות$/,             en: 'Patriarchs',          he: 'אבות' },
  { rx: /^גבורות$/,           en: 'Divine Might',        he: 'גבורות' },
  { rx: /^קדושה$/,            en: 'Kedushah',            he: 'קדושה' },
  { rx: /^קדושת השם$/,        en: 'Holiness of God',     he: 'קדושת השם' },
  { rx: /^בינה$/,             en: 'Knowledge',           he: 'בינה' },
  { rx: /^תשובה$/,            en: 'Repentance',          he: 'תשובה' },
  { rx: /^סליחה$/,            en: 'Forgiveness',         he: 'סליחה' },
  { rx: /^גאולה$/,            en: 'Redemption',          he: 'גאולה' },
  { rx: /^רפואה$/,            en: 'Healing',             he: 'רפואה' },
  { rx: /^ברכת השנים$/,       en: 'Prosperity',          he: 'ברכת השנים' },
  { rx: /^קי?בוץ גלי?ו?ת$/,   en: 'Gathering the Exiles', he: 'קיבוץ גלויות' },
  { rx: /^דין$/,              en: 'Justice',             he: 'דין' },
  { rx: /^ברכת המינים$/,      en: 'Against Enemies',     he: 'ברכת המינים' },
  { rx: /^צדיקים$/,           en: 'The Righteous',       he: 'צדיקים' },
  { rx: /^בני?ן ירושלים$/,    en: 'Rebuilding Jerusalem', he: 'בנין ירושלים' },
  { rx: /^מלכות בית דוד$/,    en: 'Kingdom of David',    he: 'מלכות בית דוד' },
  { rx: /^קבלת תפל?ה$/,       en: 'Response to Prayer',  he: 'קבלת תפילה' },
  { rx: /^עבודה$/,            en: 'Temple Service',      he: 'עבודה' },
  { rx: /^הודאה$/,            en: 'Thanksgiving',        he: 'הודאה' },
  { rx: /^ברכת כהנים$/,       en: 'Birkat Kohanim',      he: 'ברכת כהנים' },
  { rx: /^שלום$/,             en: 'Peace',               he: 'שלום' },
];

/**
 * Bracha חתימות (sealing phrases) → section name. Used to split a HEADERLESS
 * monolithic Amidah (Edot HaMizrach / Chabad) by detecting the "ברוך אתה ה',
 * <closing>:" that ENDS each bracha. Matching is by the closing phrase, so
 * non-bracha chatimot (עננו "...בעת צרה", Birkat Kohanim) never split.
 */
const CHATIMA_TO_SECTION: { rx: RegExp; en: string; he: string }[] = [
  { rx: /מגן אברהם/, en: 'Patriarchs', he: 'אבות' },
  { rx: /מחיה ה?מתים/, en: 'Divine Might', he: 'גבורות' },
  { rx: /ה(אל|מלך) הקדוש/, en: 'Holiness of God', he: 'קדושת השם' },
  // Musaf only — the 4th bracha (קדושת היום). The chatima takes several forms
  // (מקדש השבת / ...ישראל וראשי חדשים / ...ישראל והזמנים), sometimes split by a
  // parenthetical rubric (Sefard YT Musaf: "מקדש (לשבת השבת ו) ישראל והזמנים").
  // No weekday-Amidah chatima closing contains "מקדש", so a bare match is safe.
  { rx: /מקדש/, en: 'Sanctity of the Day', he: 'קדושת היום' },
  { rx: /חונן הדעת/, en: 'Knowledge', he: 'דעת' },
  { rx: /הרוצה בתשובה/, en: 'Repentance', he: 'תשובה' },
  { rx: /המרבה לסלוח/, en: 'Forgiveness', he: 'סליחה' },
  { rx: /גואל ישראל/, en: 'Redemption', he: 'גאולה' },
  { rx: /רופא (חולי עמו ישראל|החולים)/, en: 'Healing', he: 'רפואה' },
  { rx: /מברך השנים/, en: 'Prosperity', he: 'ברכת השנים' },
  { rx: /מקבץ נדחי עמו ישראל/, en: 'Gathering the Exiles', he: 'קיבוץ גלויות' },
  { rx: /(מלך אוהב צדקה ומשפט|המלך המשפט)/, en: 'Justice', he: 'דין' },
  { rx: /מכניע זדים/, en: 'Against Enemies', he: 'ברכת המינים' },
  { rx: /משען ומבטח לצדיקים/, en: 'The Righteous', he: 'צדיקים' },
  { rx: /בונה ירושל/, en: 'Rebuilding Jerusalem', he: 'בנין ירושלים' },
  { rx: /מצמיח קרן ישועה/, en: 'Kingdom of David', he: 'מלכות בית דוד' },
  { rx: /שומע תפל?ה/, en: 'Response to Prayer', he: 'שומע תפילה' },
  { rx: /המחזיר שכינתו לציון/, en: 'Temple Service', he: 'עבודה' },
  { rx: /הטוב שמך ולך נאה להודות/, en: 'Thanksgiving', he: 'הודאה' },
  { rx: /(המברך את עמו ישראל בשלום|עושה ה?שלום)/, en: 'Peace', he: 'שלום' },
];

/** The closing of the LAST "ברוך אתה ה', X:" in a line → its section, or null.
 *  The divine name is spelled inconsistently in the source (יהוה / יי / ה, and
 *  the expanded "יוהוווהו" in some EM Musaf chatimot), so match it loosely as a
 *  short run of י/ו/ה. Only MAPPED closings create a section, so this is safe. */
function chatimaSection(bareLine: string): { en: string; he: string } | null {
  const ms = [...bareLine.matchAll(/ברוך אתה [יוה'״]{1,10}[,\s]+([^:]{1,45}?)\s*[:׃]/g)];
  if (ms.length === 0) return null;
  const closing = ms[ms.length - 1][1];
  for (const c of CHATIMA_TO_SECTION) if (c.rx.test(closing)) return { en: c.en, he: c.he };
  return null;
}

/**
 * Fallback splitter for a monolithic Amidah with NO blessing headers (Edot
 * HaMizrach, Chabad). Walks the lines accumulating a buffer; when a VOCALIZED
 * line ends with a recognized bracha חתימה, that buffer (incl. the chatima
 * line) becomes that named section. A <small> line still counts as prayer when
 * densely vocalized (so Kedushah / Modim chunks stay inside their bracha).
 */
function splitMonolithicAmidaByChatima(lines: string[]): AmidahSection[] {
  const sections: AmidahSection[] = [];
  let buffer: string[] = [];
  for (const line of lines) {
    buffer.push(line);
    const isSmall = /^\s*<small>/.test(line);
    const isPrayerLine = hasNikud(line) && (!isSmall || isVocalizedDense(line));
    if (!isPrayerLine) continue;
    // Convert the maqaf (־, U+05BE) to a space BEFORE stripping nikud — it sits
    // inside the [֑-ׇ] range, so a plain strip would glue the words it joins
    // ("אֶת־עַמּוֹ" → "אתעמו"), breaking chatimot like "המברך את עמו ישראל בשלום"
    // (Chabad spells it with a maqaf; Sefard/EM use a space).
    const bare = line.replace(/<[^>]+>/g, '').replace(/־/g, ' ').replace(/[֑-ׇ]/g, '');
    const sec = chatimaSection(bare);
    if (sec) {
      sections.push({ en: sec.en, he: sec.he, lines: buffer });
      buffer = [];
    }
  }
  if (sections.length < 6) return []; // not a recognizable Amidah
  // Whatever follows the שלום chatima (יהיו לרצון / אלהי נצור / post-Amidah) —
  // fold the tail into a Concluding Passage so the chazara collapse anchors.
  if (buffer.length > 0) {
    sections.push({ en: 'Concluding Passage', he: 'אלהי נצור', lines: buffer });
  }
  return sections;
}

/** Strip HTML tags, nikud and trailing punctuation — for header matching. */
function bareForHeader(s: string): string {
  return (s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[׃:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split a monolithic Amidah leaf's raw lines into named sub-sections.
 * Returns [] when the text doesn't look like a headered Amidah (so callers
 * can fall back to rendering the leaf unsplit).
 */
export function splitMonolithicAmidah(lines: string[]): AmidahSection[] {
  const headerFor = (line: string): { en: string; he: string } | null => {
    // Body text always carries nikud; the standalone blessing headers never do.
    if (hasNikud(line)) return null;
    const bare = bareForHeader(line);
    if (!bare || bare.length > 18) return null;
    for (const h of AMIDAH_HEADERS) if (h.rx.test(bare)) return { en: h.en, he: h.he };
    return null;
  };

  const sections: AmidahSection[] = [];
  const lead: string[] = []; // lines before the first header (אדני שפתי תפתח)
  let cur: AmidahSection | null = null;

  for (const line of lines) {
    const hdr = headerFor(line);
    if (hdr) {
      cur = { en: hdr.en, he: hdr.he, lines: [] };
      sections.push(cur);
      continue;
    }
    const bare = bareForHeader(line);

    // Concluding Passage — "אלהי נצור". No header in the text; it follows the
    // chatima of שלום. Break it into its own section so the chazara collapse
    // (which renders every Amidah section EXCEPT this one) anchors correctly.
    if (cur && cur.en !== 'Concluding Passage' &&
        /^אל[הוק]?הי נצור|^אלקי נצור|^אלוקי נצור/.test(bare)) {
      cur = { en: 'Concluding Passage', he: 'אלהי נצור', lines: [line] };
      sections.push(cur);
      continue;
    }

    // NOTE: Modim DeRabbanan (the kahal's parallel Modim, said only in chazara)
    // is embedded mid-הודאה with no header. Rather than fracture הודאה into two
    // titled sections (which leaves a confusing gap in the silent reading once
    // it's hidden), it stays a paragraph inside Thanksgiving and is tagged
    // 'chazara-only' by parseParagraphRaw — hidden in the silent Amidah, shown
    // in the chazara collapse. See shouldRender's `chazara` option.

    if (cur) cur.lines.push(line);
    else lead.push(line);
  }

  // Fold the opening verse (אדני שפתי תפתח) into the first blessing so it
  // isn't orphaned into a titleless section.
  if (sections.length > 0 && lead.length > 0) {
    sections[0].lines = [...lead, ...sections[0].lines];
  }
  // Headerless monolithic Amidah (Edot HaMizrach / Chabad): no <b> headers were
  // found, so fall back to splitting by the bracha chatimot.
  if (sections.length < 6) {
    const byChatima = splitMonolithicAmidaByChatima(lines);
    if (byChatima.length >= 6) return byChatima;
  }
  return sections;
}

/**
 * Remove the "ברוך ה' לעולם" passage (18 verses) + "יראו עינינו" from weekday
 * Maariv. It was instituted for late-comers praying in the fields and is NOT
 * said in the Eretz-Yisrael minhag. Sefaria keeps it (with its explanatory
 * Tur note) between Hashkiveinu and the Half Kaddish — embedded mid-leaf in
 * Sefard, a standalone leaf in Ashkenaz. Callers apply this only to Maariv
 * text, and the patterns are specific enough not to touch Hashkiveinu or the
 * Kaddish that bracket it.
 */
export function stripMaarivBaruchHashemLeolam(lines: string[]): string[] {
  const bare = (s: string) => (s || '').replace(/<[^>]+>/g, '').replace(/[֑-ׇ]/g, '').trim();
  return lines.filter((l) => {
    const b = bare(l);
    if (/^ברוך (יהוה|ה|יי)['׳]?\s*לעולם אמן ואמן/.test(b)) return false; // the 18 verses
    if (/^יראו עינינו וישמח לבנו/.test(b)) return false;                  // יראו עינינו
    if (/מה שנוהגין להפסיק בפסוקים ויראו עינינו/.test(b)) return false;   // Tur note about it
    return true;
  });
}

/**
 * The long "לשני וחמישי" Tachanun supplication (אל ארך אפים / והוא רחום /
 * selichot) is said ONLY on Monday & Thursday. But "שני וחמישי" is not a date
 * the conditional-marker system knows, so every monolithic nusach mishandles it:
 *   • Sefard  — a separate leaf "לשני וחמישי" bundling the long supplication WITH
 *     the daily "שומר ישראל…" conclusion + חצי קדיש (per its own opening rubric).
 *   • Chabad  — inline in the daily "תחנון" leaf after "לדוד אליך", before שומר ישראל.
 *   • Edot HaMizrach — inline in the daily "וידוי" leaf after "בימי שני וחמישי מוסיפים".
 * On non-Mon/Thu this drops the long block so only the DAILY Tachanun remains.
 * It runs from the block opener up to (not including) "שומר ישראל" — or to the
 * end of the leaf when there is no Shomer Yisrael after it (EM, which doesn't
 * say it). No-op on leaves with no such block (Mincha, Sefard's daily Tachanun).
 */
export function stripLongTachanunSupplication(lines: string[]): string[] {
  const bare = (s: string) => (s || '').replace(/<[^>]+>/g, '').replace(/[֑-ׇ]/g, '').replace(/[־]/g, ' ').trim();
  const out: string[] = [];
  let dropping = false;
  for (const l of lines) {
    const b = bare(l);
    // Block openers across the three nuschaot.
    if (/^והוא רחום יכפר|^לשני וחמישי$|^בימי שני וחמישי מוסיפים/.test(b)) { dropping = true; continue; }
    if (dropping && /^שומר ישראל/.test(b)) dropping = false; // resume at the daily conclusion (Sefard/Chabad)
    if (!dropping) out.push(l);
  }
  return out;
}

/** Maps a JS getDay() value (0=Sun..6=Sat) to the corresponding "fell-" tag. */
export function weekdayTag(day: number): ConditionTag {
  return (['fell-sun', 'fell-mon', 'fell-tue', 'fell-wed', 'fell-thu', 'fell-fri', 'fell-sat'][day] ??
    'fell-sun') as ConditionTag;
}

/** True if the text contains Hebrew nikud (vowel marks). Tefilah text always
 *  has nikud; halachic notes & section labels rarely do. We use the absence
 *  of nikud as a heuristic to distinguish "voice" lines (prayer) from
 *  "instructional" lines (rubrics). */
export function hasNikud(text: string): boolean {
  return /[֑-ׇ]/.test(text || '');
}

/** True if the text is DENSELY vocalized — at least half its Hebrew letters
 *  carry nikud. Distinguishes a vocalized prayer insertion (every word
 *  pointed) from a halachic note that merely quotes a pointed word or two
 *  ("אם שכח לומר טַל וּמָטָר..."). */
export function isVocalizedDense(text: string): boolean {
  const letters = (text.match(/[א-ת]/g) || []).length;
  const nikud = (text.match(/[֑-ׇ]/g) || []).length;
  return letters > 0 && nikud >= letters * 0.5;
}

/** Decide whether to render a parsed paragraph today. */
export function shouldRender(
  p: ParsedParagraph,
  active: Set<ConditionTag>,
  opts: { showAll: boolean; showNotes: boolean; chazara?: boolean },
): boolean {
  // Chazara-only text (Modim DeRabbanan): shown ONLY inside the chazarat
  // hashatz collapse, never in the silent Amidah. Decided before the
  // unvocalized/showAll checks so it's hidden even when "show all" is on.
  if (p.tags?.includes('chazara-only')) return !!opts.chazara;
  // Silent-only (the quiet 3rd bracha אתה קדוש) — hidden inside the chazara.
  if (p.tags?.includes('silent-only')) return !opts.chazara;
  // Optional personal addition (reshut): shown in the silent Amidah (in a
  // collapse, handled by the view) but NEVER in the chazara.
  if (p._optional) return !opts.chazara;
  // Display scope (Anenu): the ש"ץ's insert shows ONLY in the chazara, the
  // individual's ONLY in the silent Amidah. This only HIDES in the wrong view;
  // the paragraph's own day-tag (fast) still gates the day below.
  if (p._chazaraScope === 'chazara' && !opts.chazara) return false;
  if (p._chazaraScope === 'silent' && opts.chazara) return false;
  // CONTEXT rubrics (speaker cues, Kaddish labels, bracha names) always show, in
  // the small font — they orient the davener and must never be hidden with the
  // descriptive notes.
  const isContext = p._alwaysShow || isContextRubric(p.body);
  // User-facing rule: "without halachic notes" means hide every line that
  // isn't vocalized — that catches rubric annotations whether or not the
  // parser tagged them as halachic-note. Vocalized text always shows.
  if (!opts.showNotes && !hasNikud(p.body) && !isContext) return false;
  if (p.kind === 'halachic-note') {
    if (isContext) return true;
    if (!opts.showNotes) return false;
    // Notes ON: a conditional-linked note (inherited day-tags) follows its insert.
    if (p.tags && p.tags.length > 0 && !p.tags.includes('unknown')) {
      return p.tags.some((t) => active.has(t));
    }
    return true;
  }
  if (p.kind === 'normal') return true;
  if (opts.showAll) return true;
  if (!p.tags || p.tags.length === 0) return true;
  // Unknown tags are often speaker indicators ("קהל", "חזן", "קהל וחזן") or
  // formatting directives — NOT seasonal conditionals. Default to showing so
  // we don't accidentally hide Kedushah body, Modim DeRabbanan, etc.
  if (p.tags.includes('unknown')) return true;
  // Negative marker ("…אין אומרים ברכה זו"): said on ordinary days, OMITTED when
  // one of the tagged days is active (e.g. שעשה לי כל צרכי on T"B / Yom Kippur).
  if (p._negate) return !p.tags.some((t) => active.has(t));
  return p.tags.some((t) => active.has(t));
}

/** Some markers can be enhanced with today's specific name, e.g., יעלה ויבוא gets the holiday. */
export function enhanceConditionalText(p: ParsedParagraph, date: Date = new Date(), inIsrael = true): string {
  if (!p.body) return p.body;
  // Yaaleh VeYavo — Sefaria packs all festival names inline. After stripFormatting
  // strips <small> tags, the body looks like:
  //   ... בְּיוֹם לר"ח: רֹאשׁ הַחֹדֶשׁ הַזֶּה: לפסח: חַג הַמַּצּוֹת הַזֶּה: לסכות: חַג הַסֻּכּוֹת הַזֶּה: זָכְרֵנוּ...
  // Each festival unit is "MARKER: NAME הַזֶּה:" where MARKER is a short Hebrew
  // tag without nikud (לר"ח / לפסח / לסכות / לשבועות / לרה"ש). We keep only the
  // unit matching today and drop the markers + other festival options.
  if (/יַעֲלֶה וְיָבֹא|יעלה ויבא|יעלה ויבוא/.test(p.body)) {
    const name = yaalehDayName(date, inIsrael);
    if (!name) return p.body;
    // MARKER: short Hebrew (no nikud) — letters + optional quote + optional letters,
    //         length ≤ 15, no colon inside.
    // NAME: phrase including "הַזֶּה" (nikud may or may not be present).
    // Each unit ends with ":".
    // Match the FULL chain starting at "בְּיוֹם" through the last "הַזֶּה:".
    // Sefaria emits nikud in different orderings across editions (e.g. dagesh
    // before sheva vs sheva before dagesh). Match letters with arbitrary nikud
    // (U+0591..U+05C7) between them, so we don't depend on a single ordering.
    const N = '[\\u0591-\\u05C7]*';
    const chainRx = new RegExp(
      `(ב${N}י${N}ו${N}ם${N}\\s+)((?:\\s*[\\u05D0-\\u05EA"״]{1,15}:\\s*[^:]+?ה${N}ז${N}ה${N}:\\s*){2,})`,
    );
    const m1 = chainRx.exec(p.body);
    if (m1) {
      const prefix = m1[1]; // "בְּיוֹם "
      const chain = m1[2];
      // Split chain into units: each unit is "MARKER: NAME הַזֶּה:"
      const unitRx = /([֐-ת"״]{1,15}):\s*([^:]+?ה[ְ-ּֿׁׂ]?ז[ְ-ּ]?ֶּ?ה):\s*/g;
      const units: { marker: string; nameWithZeh: string; full: string }[] = [];
      let mm: RegExpExecArray | null;
      while ((mm = unitRx.exec(chain)) !== null) {
        units.push({ marker: mm[1].trim(), nameWithZeh: mm[2].trim(), full: mm[0] });
      }
      if (units.length >= 2) {
        const todayMarkerRx = todayMarkerRegex(date, inIsrael);
        const todayUnit = units.find((u) => todayMarkerRx.test(u.marker));
        const chosenName = todayUnit ? `${todayUnit.nameWithZeh}: ` : `${name} הַזֶּה: `;
        const replaced = p.body.replace(chainRx, `${prefix}${chosenName}`);
        return replaced.replace(/\s+/g, ' ').replace(/\s+([:.])/g, '$1').trim();
      }
    }
    // No inline chain detected — fall back to single-replace heuristic.
    return p.body.replace(/בְּיוֹם\s+[^\s]+\s+הַזֶּה/g, `בְּיוֹם ${name}`)
                 .replace(/בְּיוֹם\s+(רֹאשׁ הַחֹדֶשׁ|חַג[^\s]*\s*[^\s]*)\s+הַזֶּה/g, `בְּיוֹם ${name}`);
  }
  // Ve'titen Lanu (Festival Musaf Kedushat HaYom) — same inline-marker
  // pattern as YvY but listing each Festival with its zman:
  //   ... מועדים לשמחה חגים וזמנים לששון את יום
  //       לפסח: חַג הַמַּצּוֹת הַזֶּה זְמַן חֵרוּתֵנוּ
  //       לשבועות: חַג הַשָּׁבוּעוֹת הַזֶּה זְמַן מַתַּן תּוֹרָתֵנוּ
  //       לסכות: חַג הַסֻּכּוֹת הַזֶּה זְמַן שִׂמְחָתֵנוּ
  //       לשמיני עצרת: שְׁמִינִי עֲצֶרֶת הַחַג הַזֶּה זְמַן שִׂמְחָתֵנוּ ...
  // Filter to today's festival only.
  if (/ותתן לנו|ותתן־לנו|מועדים לשמחה/.test(p.body.replace(/[֑-ׇ]/g, ''))) {
    const N2 = '[\\u0591-\\u05C7]*';
    // Each festival block: "MARKER: <NAME> <NIKUD-HAZE> זמן <DESC>"
    // Marker: short Hebrew (לפסח/לשבועות/לסכות/לשמיני עצרת), no colon inside.
    // We capture each block and choose today's.
    const chainRx2 = new RegExp(
      `((?:\\s*[\\u05D0-\\u05EA"״\\s]{1,20}:\\s*[^:]+?ה${N2}ז${N2}ה[\\s\\S]+?זמ${N2}ן[^:]+?:\\s*){2,})`,
      'g',
    );
    const m2 = chainRx2.exec(p.body);
    if (m2) {
      const chain = m2[0];
      const unitRx2 = /([א-ת"״\s]{1,20}):\s*([^:]+?ה[֑-ׇ]*ז[֑-ׇ]*ה[\s\S]+?זמ[֑-ׇ]*ן[^:]+?):\s*/g;
      const units2: { marker: string; festWithZman: string }[] = [];
      let mm2: RegExpExecArray | null;
      while ((mm2 = unitRx2.exec(chain)) !== null) {
        units2.push({ marker: mm2[1].trim(), festWithZman: mm2[2].trim() });
      }
      if (units2.length >= 2) {
        const todayMarkerRx = todayMarkerRegex(date, inIsrael);
        const todayUnit = units2.find((u) => todayMarkerRx.test(u.marker));
        const chosen = todayUnit ? `${todayUnit.festWithZman}: ` : '';
        if (chosen) {
          const replaced = p.body.replace(chainRx2, chosen);
          return replaced.replace(/\s+/g, ' ').replace(/\s+([:.])/g, '$1').trim();
        }
      }
    }
  }
  return p.body;
}

/** Regex matching the bare-text marker label of TODAY's festival (e.g. "לר\"ח" on RC). */
function todayMarkerRegex(date: Date, inIsrael: boolean): RegExp {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  const isRC = events.some((e) => e.getFlags() & flags.ROSH_CHODESH);
  if (m === months.TISHREI && d >= 15 && d <= 21) return /^לס[וו]?כ|^לחג הס[וכ]/;
  if (m === months.TISHREI && d === 22) return /^שמיני|^לעצרת/;
  if (m === months.NISAN && d >= 15 && d <= 21) return /^לפסח|^למצות|^לחג המצות/;
  if (m === months.SIVAN && (d === 6 || (!inIsrael && d === 7))) return /^לשבועות|^לחג השבועות/;
  if (m === months.TISHREI && (d === 1 || d === 2)) return /^לרה|^לראש השנה/;
  if (isRC) return /^לר["״]?ח|^לראש ח[דו]ש/;
  return /__no_match_xyz__/;
}

/**
 * Strip inline parenthetical alternates that aren't applicable today.
 *
 * Many siddurs embed seasonal alternates inside parens within otherwise-
 * normal prayer text, e.g.:
 *   "לְעֵלָּא מִן־כָּל (בעשי"ת לְעֵלָּא לְעֵלָּא מִכָּל) בִּרְכָתָא..."
 *   "עוֹשֶׂה שָׁלוֹם (בעשי"ת הַשָּׁלוֹם) בִּמְרוֹמָיו..."
 *
 * When the marker is NOT in season today, the parenthetical is removed
 * entirely so the sentence reads cleanly. When IN season, we keep the
 * alternate visible (the reader is expected to substitute mentally — that's
 * the standard siddur convention).
 *
 * Only triggers for marker phrases markerToTags() recognizes, so generic
 * parens like "(אמן)" or "(תהילים פ"ה)" are left alone.
 */
export function stripInactiveInlineParens(body: string, active: Set<ConditionTag>): string {
  if (!body) return body;
  // Match (   [<small>]MARKER[</small>]   ALT   )
  const pattern = /\s*\(\s*(?:<small>\s*)?([^()<\s][^()<]{0,40}?)(?:\s*<\/small>)?\s+([^()<]{1,200}?)\s*\)\s*/g;
  return body.replace(pattern, (full, marker, alt) => {
    const tags = markerToTags(marker.trim());
    if (tags.length === 0) {
      // Not a recognized seasonal marker — leave parenthetical alone
      // (could be a citation, response, or other inline note).
      return full;
    }
    const inSeason = tags.some((t) => active.has(t));
    if (inSeason) {
      // Keep the parenthetical visible so the reader can use the alternate
      return ` (${marker.trim()}: ${alt.trim()}) `;
    }
    // Out of season — strip the parenthetical entirely, preserving a single space
    return ' ';
  }).replace(/\s+/g, ' ').replace(/\s+([:׃.,])/g, '$1').trim();
}
