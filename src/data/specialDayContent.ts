/**
 * Synthesized leaf builders for content that isn't naturally in the Sefaria
 * weekday tree but is required by the spec for special days:
 *   - Vayechal Moshe Torah reading (public fasts, Tisha B'Av)
 *   - Anenu (fast day Amidah insert)
 *   - Asher Hani Atzat + Shoshanat Yaakov (Purim Maariv/Shacharit, after Megillah)
 *   - Nachem (Tisha B'Av Mincha Amidah insert)
 *   - Halachic warning cards (Tisha B'Av Tallit/Tefillin, Sukkot lulav)
 *
 * Each builder returns FlatLeaf[] ready for injection by the augmenter.
 * Sefaria refs are used where the source is Tanach (Exodus passages),
 * synthetic refs (prefixed with "Custom:") are used for siddur paragraphs we
 * embed locally — fetchSefariaText recognizes the prefix and skips the API.
 */
import { FlatLeaf } from './siddurTree';

// ============================ Fast day Vayechal Moshe ============================

/** Vayechal Moshe — Torah reading for public fasts (NOT Tisha B'Av).
 *  3 olim: Exodus 32:11-14 (Kohen), 34:1-3 (Levi), 34:4-10 (Yisrael). */
export function buildVayechalLeaves(): FlatLeaf[] {
  const trail = [{ he: 'קריאת התורה לתענית ציבור (ויחל משה)', en: 'Torah Reading for Public Fast' }];
  return [
    { ref: 'Exodus 32:11-14', he: 'עליה ראשונה (כהן) — ויחל משה', en: 'Aliyah 1 (Cohen) — Exodus 32:11-14', trail },
    { ref: 'Exodus 34:1-3', he: 'עליה שניה (לוי) — פסל לך', en: 'Aliyah 2 (Levi) — Exodus 34:1-3', trail },
    { ref: 'Exodus 34:4-10', he: 'עליה שלישית (ישראל) — ויעבר ה׳ על פניו', en: 'Aliyah 3 (Yisrael) — Exodus 34:4-10', trail },
  ];
}

/** Tisha B'Av Shacharit Torah reading — Devarim 4:25-40 (3 olim). */
export function buildTishaBAvShacharitTorahLeaves(): FlatLeaf[] {
  const trail = [{ he: 'קריאת התורה לתשעה באב — שחרית', en: 'Tisha B\'Av Shacharit Torah Reading' }];
  return [
    { ref: 'Deuteronomy 4:25-29', he: 'עליה ראשונה (כהן)', en: 'Aliyah 1 (Cohen) — Deuteronomy 4:25-29', trail },
    { ref: 'Deuteronomy 4:30-35', he: 'עליה שניה (לוי)', en: 'Aliyah 2 (Levi) — Deuteronomy 4:30-35', trail },
    { ref: 'Deuteronomy 4:36-40', he: 'עליה שלישית (ישראל)', en: 'Aliyah 3 (Yisrael) — Deuteronomy 4:36-40', trail },
  ];
}

/** Tisha B'Av Shacharit Haftarah — Yirmiyahu 8:13 - 9:23 */
export function buildTishaBAvHaftarah(): FlatLeaf {
  return {
    ref: 'Jeremiah 8:13-9:23',
    he: 'הפטרה — אסף אסיפם',
    en: 'Haftarah for Tisha B\'Av Shacharit — Jeremiah 8:13-9:23',
    trail: [{ he: 'קריאת התורה לתשעה באב — שחרית', en: 'Tisha B\'Av Shacharit' }],
  };
}

/** Fast-day Mincha Torah PROCESSION — Hotzaat (Vayehi Binsoa) and Hachnasat
 *  (Uvenucho Yomar). Uses the two nusach-neutral Torah pesukim (Num 10:35-36) so
 *  the ceremony is authentic and not mixed across rites. */
const FAST_TR_TRAIL = [{ he: 'קריאת התורה למנחת תענית', en: 'Fast Day Mincha Torah Reading' }];
export function buildFastMinchaHotzaa(): FlatLeaf {
  return { ref: 'Numbers 10:35', he: 'הוצאת ספר תורה — וַיְהִי בִּנְסֹעַ הָאָרֹן', en: 'Removing the Torah — Vayehi Binsoa (Num 10:35)', trail: FAST_TR_TRAIL };
}
export function buildFastMinchaHachnasa(): FlatLeaf {
  return { ref: 'Numbers 10:36', he: 'הכנסת ספר תורה — וּבְנֻחֹה יֹאמַר', en: 'Returning the Torah — Uvenucho Yomar (Num 10:36)', trail: FAST_TR_TRAIL };
}
/** Half Kaddish after the fast-Mincha Torah reading (before the Amidah). The
 *  Ashkenaz "after the reading" Half Kaddish text is near-identical across rites. */
export function buildFastMinchaReadingKaddish(): FlatLeaf {
  return { ref: 'Siddur Ashkenaz, Weekday, Shacharit, Torah Reading, Reading from Sefer, Half Kaddish',
    he: 'חצי קדיש (אחרי קריאת התורה)', en: 'Half Kaddish after the Torah reading', trail: FAST_TR_TRAIL };
}

/** Mincha (all public fasts incl. T"B) Haftarah — Dirshu Hashem b'himatzo */
export function buildFastMinchaHaftarah(): FlatLeaf {
  return {
    ref: 'Isaiah 55:6-56:8',
    he: 'הפטרה — דרשו ה׳ בהמצאו',
    en: 'Haftarah for Fast Day Mincha — Isaiah 55:6 - 56:8',
    trail: [{ he: 'קריאת התורה למנחת תענית', en: 'Fast Day Mincha Torah Reading' }],
  };
}

// ============================ Anenu (fast day Amidah insert) ============================

export const ANENU_TEXT =
  'עֲנֵֽנוּ יְהֹוָה עֲנֵֽנוּ בְּיוֹם צוֹם תַּעֲנִיתֵֽנוּ, כִּי בְצָרָה גְדוֹלָה אֲנָֽחְנוּ. ' +
  'אַל תֵּֽפֶן אֶל רִשְׁעֵֽנוּ, וְאַל תַּסְתֵּר פָּנֶֽיךָ מִמֶּֽנּוּ, וְאַל תִּתְעַלַּם מִתְּחִנָּתֵֽנוּ. ' +
  'הֱיֵה נָא קָרוֹב לְשַׁוְעָתֵֽנוּ, יְהִי נָא חַסְדְּ֒ךָ לְנַחֲמֵֽנוּ, ' +
  'טֶֽרֶם נִקְרָא אֵלֶֽיךָ עֲנֵֽנוּ. כַּדָּבָר שֶׁנֶּאֱמַר: וְהָיָה טֶֽרֶם יִקְרָֽאוּ וַאֲנִי אֶעֱנֶה, ' +
  'עוֹד הֵם מְדַבְּ֒רִים וַאֲנִי אֶשְׁמָע: ' +
  'כִּי אַתָּה יְהֹוָה הָעוֹנֶה בְּעֵת צָרָה, פּוֹדֶה וּמַצִּיל בְּכָל עֵת צָרָה וְצוּקָה. ' +
  'בָּרוּךְ אַתָּה יְהֹוָה, הָעוֹנֶה בְּעֵת צָרָה:';

/** Anenu — recited in Amidah on public fasts. By Sephardi/EM: individuals in
 *  Shema Koleinu (silent). By Ashkenazi: Chazan only, as separate bracha in
 *  chazaras between Geulah and Refuah. We render it as a labelled paragraph. */
export function buildAnenuLeaf(): FlatLeaf {
  return {
    ref: 'Custom:Anenu',
    he: 'ענני (תוספת לעמידה בתענית ציבור)',
    en: 'Anenu paragraph',
    trail: [{ he: 'תוספת לתפילה', en: 'Amidah insert' }],
  };
}

// ============================ Purim Maariv additions ============================

/** Asher Hani Atzat Goyim — recited after Maariv Amidah on Purim night.
 *  en intentionally has NO "purim"/"megillah" tokens so the relevance filter
 *  won't accidentally over-gate it via the generic /purim|megillah/ pattern. */
export function buildAsherHaniLeaf(): FlatLeaf {
  return {
    ref: 'Custom:AsherHani',
    he: 'אשר הניא עצת גוים',
    en: 'Asher Hani Atzat Goyim',
    trail: [{ he: 'תוספות לאחר תפילה', en: 'Post-prayer additions' }],
  };
}

/** Shoshanat Yaakov — recited after Megillah reading. */
export function buildShoshanatYaakovLeaf(): FlatLeaf {
  return {
    ref: 'Custom:ShoshanatYaakov',
    he: 'שושנת יעקב',
    en: 'Shoshanat Yaakov',
    trail: [{ he: 'תוספות לאחר תפילה', en: 'Post-prayer additions' }],
  };
}

/** Purim Shacharit Torah reading — Vayavo Amalek (Exodus 17:8-16), 3 olim. */
export function buildVayavoAmalekLeaves(): FlatLeaf[] {
  const trail = [{ he: 'קריאת התורה לפורים — ויבא עמלק', en: 'Purim Torah Reading' }];
  return [
    { ref: 'Exodus 17:8-10', he: 'עליה ראשונה (כהן) — ויבא עמלק', en: 'Aliyah 1 (Cohen) — Exodus 17:8-10', trail },
    { ref: 'Exodus 17:11-13', he: 'עליה שניה (לוי)', en: 'Aliyah 2 (Levi) — Exodus 17:11-13', trail },
    { ref: 'Exodus 17:14-16', he: 'עליה שלישית (ישראל) — מחה אמחה', en: 'Aliyah 3 (Yisrael) — Exodus 17:14-16', trail },
  ];
}

/** Chanukah daily Torah reading — Naso (Numbers 7), 3 olim per day.
 *  Day 1: extended (Numbers 7:1-17, includes Nasi of Yehuda).
 *  Days 2-7: 6 verses each, split 2/2/2.
 *  Day 8: Menashe (7:54-59) + summary "זאת חנוכת המזבח" + Beha'alotcha 8:1-4.
 *  Standard divisions per Shulchan Aruch O"C 684. */
export function buildChanukahNasoLeaves(day: number): FlatLeaf[] {
  const trail = [{ he: `קריאת התורה לחנוכה — יום ${day}`, en: `Chanukah Day ${day} Torah Reading (Naso)` }];
  const tribeNames: Record<number, string> = {
    1: 'נחשון בן עמינדב (יהודה)',
    2: 'נתנאל בן צוער (יששכר)',
    3: 'אליאב בן חלון (זבולון)',
    4: 'אליצור בן שדיאור (ראובן)',
    5: 'שלמיאל בן צורישדי (שמעון)',
    6: 'אליסף בן דעואל (גד)',
    7: 'אלישמע בן עמיהוד (אפרים)',
    8: 'גמליאל בן פדהצור (מנשה) + סיום',
  };
  const dayLabel = `יום ${day} — ${tribeNames[day] ?? ''}`;
  if (day === 1) {
    return [
      { ref: 'Numbers 7:1-11', he: `${dayLabel} · עליה ראשונה (כהן) — ויהי ביום כלות`, en: `Day 1 Cohen — Numbers 7:1-11`, trail },
      { ref: 'Numbers 7:12-14', he: `עליה שניה (לוי) — קרבן נחשון`, en: `Day 1 Levi — Numbers 7:12-14`, trail },
      { ref: 'Numbers 7:15-17', he: `עליה שלישית (ישראל)`, en: `Day 1 Yisrael — Numbers 7:15-17`, trail },
    ];
  }
  if (day === 8) {
    return [
      { ref: 'Numbers 7:54-56', he: `${dayLabel} · עליה ראשונה (כהן) — קרבן גמליאל`, en: `Day 8 Cohen — Numbers 7:54-56`, trail },
      { ref: 'Numbers 7:57-59', he: `עליה שניה (לוי)`, en: `Day 8 Levi — Numbers 7:57-59`, trail },
      { ref: 'Numbers 7:60-8:4', he: `עליה שלישית (ישראל) — זאת חנוכת המזבח + בהעלותך`, en: `Day 8 Yisrael — Numbers 7:60-8:4`, trail },
    ];
  }
  // Days 2-7: each day is 6 verses, 2/2/2 split. Day N covers verses (N-1)*6 + 12 .. N*6 + 11.
  // E.g. Day 2 = 7:18-23, Day 3 = 7:24-29, etc.
  const startVerse = 12 + (day - 1) * 6;
  return [
    { ref: `Numbers 7:${startVerse}-${startVerse + 1}`, he: `${dayLabel} · עליה ראשונה (כהן)`, en: `Day ${day} Cohen — Numbers 7:${startVerse}-${startVerse + 1}`, trail },
    { ref: `Numbers 7:${startVerse + 2}-${startVerse + 3}`, he: `עליה שניה (לוי)`, en: `Day ${day} Levi — Numbers 7:${startVerse + 2}-${startVerse + 3}`, trail },
    { ref: `Numbers 7:${startVerse + 4}-${startVerse + 5}`, he: `עליה שלישית (ישראל)`, en: `Day ${day} Yisrael — Numbers 7:${startVerse + 4}-${startVerse + 5}`, trail },
  ];
}

// ============================ Nachem (T"B Mincha Amidah insert) ============================

/** Nachem — recited in Tisha B'Av Mincha Amidah's "v'lirushalayim ircha"
 *  bracha. By Sephardi minhag, also in Shacharit. */
export function buildNachemLeaf(): FlatLeaf {
  return {
    ref: 'Custom:Nachem',
    he: 'נחם (תוספת לעמידה בתשעה באב)',
    en: 'Nachem paragraph',
    trail: [{ he: 'תוספת לתפילה', en: 'Amidah insert' }],
  };
}

// ============================ Static text store ============================

/** Map of synthetic refs → fully-formed Hebrew text with nikud. Used by
 *  fetchSefariaText to return embedded content for "Custom:*" refs without
 *  hitting the network. */
export const CUSTOM_TEXTS: Record<string, string[]> = {
  'Custom:Anenu': [ANENU_TEXT],
  'Custom:AsherHani': [
    'אֲשֶׁר הֵנִיא עֲצַת גּוֹיִם, וַיָּפֶר מַחְשְׁבוֹת עֲרוּמִים. ' +
    'בְּקוּם עָלֵינוּ אָדָם רָשָׁע, נֵֽצֶר זָדוֹן מִזֶּֽרַע עֲמָלֵק. ' +
    'גָּאָה בְעָשְׁרוֹ וְכָֽרָה לוֹ בּוֹר, וּגְדֻלָּתוֹ יָֽקְשָׁה לּוֹ לָֽכֶד. ' +
    'דִּמָּה בְנַפְשׁוֹ לִלְכֹּד וְנִלְכַּד, בִּקֵּשׁ לְהַשְׁמִיד וְנִשְׁמַד מְהֵרָה. ' +
    'הָמָן הוֹדִֽיעַ אֵיבַת אֲבוֹתָיו, וְעוֹרֵר שִׂנְאַת אַחִים לַבָּנִים. ' +
    'וְלֹא זָכַר רַחֲמֵי שָׁאוּל, כִּי בְחֶמְלָתוֹ עַל אֲגָג נוֹלַד אוֹיֵב. ' +
    'זָמַם רָשָׁע לְהַכְרִית צַדִּיק, וְנִלְכַּד טָמֵא בִּידֵי טָהוֹר. ' +
    'חֶֽסֶד גָּבַר עַל שִׁגְגַת אָב, וְרָשָׁע הוֹסִיף חֵטְא עַל חֲטָאָיו. ' +
    'טָמַן בְּלִבּוֹ מַחְשְׁבוֹת עַרְמוּמָיו, וַיִּתְמַכֵּר לַעֲשׂוֹת רָעָה. ' +
    'יָדוֹ שָׁלַח בִּקְדוֹשֵׁי אֵל, כַּסְפּוֹ נָתַן לְהַכְרִית זִכְרָם. ' +
    'כִּרְאוֹת מָרְדְּכַי כִּי יָצָא קֶֽצֶף, וְדָתֵי הָמָן נִתְּ֒נוּ בְשׁוּשָׁן. ' +
    'לָבַשׁ שָׂק וְקָשַׁר מִסְפֵּד, וְגָזַר צוֹם וַיֵּשֶׁב עַל הָאֵֽפֶר. ' +
    'מִי זֶה יַעֲמֹד לְכַפֵּר שְׁגָגָה, וְלִמְחֹל חַטַּאת עֲוֹן אֲבוֹתֵֽינוּ. ' +
    'נֵץ פָּרַח מִלּוּלָב, הֵן הֲדַסָּה עָמְ֒דָה לְעוֹרֵר יְשֵׁנִים. ' +
    'סָרִיסֶיהָ הִבְהִֽילוּ לְהָמָן, לְהַשְׁקוֹתוֹ יֵין חֲמַת תַּנִּינִים. ' +
    'עָמַד בְּעָשְׁרוֹ וְנָפַל בְּרִשְׁעוֹ, עָֽשָׂה לוֹ עֵץ וְנִתְלָה עָלָיו. ' +
    'פִּיהֶם פָּתְ֒חוּ כָּל יוֹשְׁבֵי תֵבֵל, כִּי פוּר הָמָן נֶהְפַּךְ לְפוּרֵֽנוּ. ' +
    'צַדִּיק נֶחֱלַץ מִיַּד רָשָׁע, אוֹיֵב נִתַּן תַּֽחַת נַפְשׁוֹ. ' +
    'קִיְּ֒מוּ עֲלֵיהֶם לַעֲשׂוֹת פּוּרִים, וְלִשְׂמֹֽחַ בְּכָל שָׁנָה וְשָׁנָה. ' +
    'רָאִֽיתָ אֶת תְּפִלַּת מָרְדְּכַי וְאֶסְתֵּר, הָמָן וּבָנָיו עַל הָעֵץ תָּלִֽיתָ:',
  ],
  'Custom:ShoshanatYaakov': [
    'שׁוֹשַׁנַּת יַעֲקֹב צָהֲלָה וְשָׂמֵֽחָה, בִּרְאוֹתָם יַֽחַד תְּכֵֽלֶת מָרְדְּכָי. ' +
    'תְּשׁוּעָתָם הָיִֽיתָ לָנֶֽצַח, וְתִקְוָתָם בְּכָל דּוֹר וָדוֹר: ' +
    'לְהוֹדִֽיעַ שֶׁכָּל קֹוֶֽיךָ לֹא יֵבֽוֹשׁוּ, וְלֹא יִכָּלְ֒מוּ לָנֶֽצַח כָּל הַחוֹסִים בָּךְ. ' +
    'אָרוּר הָמָן אֲשֶׁר בִּקֵּשׁ לְאַבְּ֒דִי, בָּרוּךְ מָרְדְּכַי הַיְהוּדִי. ' +
    'אֲרוּרָה זֶֽרֶשׁ אֵֽשֶׁת מַפְחִידִי, בְּרוּכָה אֶסְתֵּר מְגִנָּה בַּעֲדִי. ' +
    'וְגַם חַרְבוֹנָה זָכוּר לַטּוֹב:',
  ],
  'Custom:Nachem': [
    'נַחֵם יְהֹוָה אֱלֹהֵֽינוּ אֶת אֲבֵלֵי צִיּוֹן, וְאֶת אֲבֵלֵי יְרוּשָׁלָֽיִם, ' +
    'וְאֶת הָעִיר הָאֲבֵלָה וְהַחֲרֵבָה, וְהַבְּזוּיָה וְהַשּׁוֹמֵמָה. ' +
    'הָאֲבֵלָה מִבְּלִי בָנֶֽיהָ, וְהַחֲרֵבָה מִמְּעוֹנוֹתֶֽיהָ, וְהַבְּזוּיָה מִכְּבוֹדָהּ, ' +
    'וְהַשּׁוֹמֵמָה מֵאֵין יוֹשֵׁב. ' +
    'וְהִיא יוֹשֶֽׁבֶת וְרֹאשָׁהּ חָפוּי כְּאִשָּׁה עֲקָרָה שֶׁלֹּא יָלָֽדָה. ' +
    'וַיְבַלְּ֒עֽוּהָ לִגְיוֹנוֹת, וַיִּירָשֽׁוּהָ עוֹבְ֒דֵי זָרִים, ' +
    'וַיָּטִֽילוּ אֶת עַמְּ֒ךָ יִשְׂרָאֵל לֶחָֽרֶב, וַיַּהַרְגוּ בְזָדוֹן חֲסִידֵי עֶלְיוֹן. ' +
    'עַל כֵּן צִיּוֹן בְּמַר תִּבְכֶּה, וִירוּשָׁלַֽיִם תִּתֵּן קוֹלָהּ. ' +
    'לִבִּי לִבִּי עַל חַלְלֵיהֶם, מֵעַי מֵעַי עַל הֲרוּגֵיהֶם. ' +
    'כִּי אַתָּה יְהֹוָה בָּאֵשׁ הִצַּתָּהּ, וּבָאֵשׁ אַתָּה עָתִיד לִבְנוֹתָהּ, ' +
    'כָּאָמוּר: וַאֲנִי אֶהְיֶה לָּהּ נְאֻם יְהֹוָה חוֹמַת אֵשׁ סָבִיב, וּלְכָבוֹד אֶהְיֶה בְתוֹכָהּ. ' +
    'בָּרוּךְ אַתָּה יְהֹוָה, מְנַחֵם צִיּוֹן וּבוֹנֵה יְרוּשָׁלָֽיִם:',
  ],
};
