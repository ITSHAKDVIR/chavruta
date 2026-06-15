import { HDate, HebrewCalendar, flags, months } from '@hebcal/core';

/** A piece of Birkat HaMazon. Optional conditional metadata so the UI can highlight inserts. */
export type BirkatSegment = {
  /** Stable id for the React key. */
  id: string;
  /** The Hebrew text to display. */
  text: string;
  /** If present, this segment is a conditional insert. Caller decides whether to render it. */
  conditional?: {
    /** Short label shown to the user, e.g. "תוספת לראש חודש". */
    label: string;
  };
  /** Optional section header (e.g. "ברכה ראשונה - הזן"). Rendered above the segment. */
  header?: string;
  /** When true, the segment is hidden by default and only shown if the user
   *  opens its collapsible (e.g. compensatory bracha for forgotten Yaaleh
   *  v'Yavo — most people don't need it). */
  collapsed?: {
    /** Header for the collapsible button, e.g. "אם שכחת יעלה ויבא". */
    summary: string;
  };
};

// ============================ Static text blocks ============================

const ZIMMUN_INTRO = `(לזימון של שלושה - המזמן אומר "רַבּוֹתַי, נְבָרֵךְ", המסובים: "יְהִי שֵׁם ה' מְבֹרָךְ מֵעַתָּה וְעַד עוֹלָם", המזמן: "בִּרְשׁוּת מָרָנָן וְרַבָּנָן וְרַבּוֹתַי, נְבָרֵךְ (אֱלֹהֵינוּ) שֶׁאָכַלְנוּ מִשֶּׁלּוֹ". המסובים: "בָּרוּךְ (אֱלֹהֵינוּ) שֶׁאָכַלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִינוּ". המזמן חוזר.)`;

const BRACHA_1_HAZAN = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַזָּן אֶת הָעוֹלָם כֻּלּוֹ בְּטוּבוֹ, בְּחֵן בְּחֶסֶד וּבְרַחֲמִים. הוּא נוֹתֵן לֶחֶם לְכָל בָּשָׂר, כִּי לְעוֹלָם חַסְדּוֹ. וּבְטוּבוֹ הַגָּדוֹל תָּמִיד לֹא חָסַר לָנוּ, וְאַל יֶחְסַר לָנוּ מָזוֹן לְעוֹלָם וָעֶד, בַּעֲבוּר שְׁמוֹ הַגָּדוֹל. כִּי הוּא אֵל זָן וּמְפַרְנֵס לַכֹּל, וּמֵטִיב לַכֹּל, וּמֵכִין מָזוֹן לְכָל בְּרִיּוֹתָיו אֲשֶׁר בָּרָא. בָּרוּךְ אַתָּה ה', הַזָּן אֶת הַכֹּל.`;

const BRACHA_2_HAARETZ_OPENING = `נוֹדֶה לְּךָ ה' אֱלֹהֵינוּ עַל שֶׁהִנְחַלְתָּ לַאֲבוֹתֵינוּ אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה, וְעַל שֶׁהוֹצֵאתָנוּ ה' אֱלֹהֵינוּ מֵאֶרֶץ מִצְרַיִם, וּפְדִיתָנוּ מִבֵּית עֲבָדִים, וְעַל בְּרִיתְךָ שֶׁחָתַמְתָּ בִּבְשָׂרֵנוּ, וְעַל תּוֹרָתְךָ שֶׁלִּמַּדְתָּנוּ, וְעַל חֻקֶּיךָ שֶׁהוֹדַעְתָּנוּ, וְעַל חַיִּים חֵן וָחֶסֶד שֶׁחוֹנַנְתָּנוּ, וְעַל אֲכִילַת מָזוֹן שָׁאַתָּה זָן וּמְפַרְנֵס אוֹתָנוּ תָּמִיד, בְּכָל יוֹם וּבְכָל עֵת וּבְכָל שָׁעָה.`;

const BRACHA_2_HAARETZ_CLOSING = `וְעַל הַכֹּל ה' אֱלֹהֵינוּ אֲנַחְנוּ מוֹדִים לָךְ וּמְבָרְכִים אוֹתָךְ, יִתְבָּרַךְ שִׁמְךָ בְּפִי כָּל חַי תָּמִיד לְעוֹלָם וָעֶד, כַּכָּתוּב: "וְאָכַלְתָּ וְשָׂבָעְתָּ וּבֵרַכְתָּ אֶת ה' אֱלֹהֶיךָ עַל הָאָרֶץ הַטֹּבָה אֲשֶׁר נָתַן לָךְ". בָּרוּךְ אַתָּה ה', עַל הָאָרֶץ וְעַל הַמָּזוֹן.`;

const BRACHA_3_RACHEM_OPENING = `רַחֵם נָא ה' אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ, וְעַל יְרוּשָׁלַיִם עִירֶךָ, וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ, וְעַל מַלְכוּת בֵּית דָּוִד מְשִׁיחֶךָ, וְעַל הַבַּיִת הַגָּדוֹל וְהַקָּדוֹשׁ שֶׁנִּקְרָא שִׁמְךָ עָלָיו.

אֱלֹהֵינוּ אָבִינוּ, רְעֵנוּ זוּנֵנוּ פַּרְנְסֵנוּ וְכַלְכְּלֵנוּ וְהַרְוִיחֵנוּ, וְהַרְוַח לָנוּ ה' אֱלֹהֵינוּ מְהֵרָה מִכָּל צָרוֹתֵינוּ, וְנָא אַל תַּצְרִיכֵנוּ ה' אֱלֹהֵינוּ לֹא לִידֵי מַתְּנַת בָּשָׂר וָדָם וְלֹא לִידֵי הַלְוָאָתָם, כִּי אִם לְיָדְךָ הַמְלֵאָה הַפְּתוּחָה הַקְּדוֹשָׁה וְהָרְחָבָה, שֶׁלֹּא נֵבוֹשׁ וְלֹא נִכָּלֵם לְעוֹלָם וָעֶד.`;

const BRACHA_3_RACHEM_CLOSING = `וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ. בָּרוּךְ אַתָּה ה', בּוֹנֵה בְרַחֲמָיו יְרוּשָׁלָיִם. אָמֵן.`;

const BRACHA_4_HATOV = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הָאֵל אָבִינוּ מַלְכֵּנוּ אַדִּירֵנוּ בּוֹרְאֵנוּ גּוֹאֲלֵנוּ יוֹצְרֵנוּ קְדוֹשֵׁנוּ קְדוֹשׁ יַעֲקֹב, רוֹעֵנוּ רוֹעֵה יִשְׂרָאֵל. הַמֶּלֶךְ הַטּוֹב וְהַמֵּטִיב לַכֹּל, שֶׁבְּכָל יוֹם וָיוֹם הוּא הֵטִיב, הוּא מֵטִיב, הוּא יֵיטִיב לָנוּ, הוּא גְמָלָנוּ, הוּא גוֹמְלֵנוּ, הוּא יִגְמְלֵנוּ לָעַד לְחֵן וּלְחֶסֶד וּלְרַחֲמִים וּלְרֶוַח, הַצָּלָה וְהַצְלָחָה, בְּרָכָה וִישׁוּעָה, נֶחָמָה פַּרְנָסָה וְכַלְכָּלָה, וְרַחֲמִים וְחַיִּים וְשָׁלוֹם וְכָל טוֹב, וּמִכָּל טוּב לְעוֹלָם אַל יְחַסְּרֵנוּ.`;

const HARACHAMAN_CORE = `הָרַחֲמָן הוּא יִמְלֹךְ עָלֵינוּ לְעוֹלָם וָעֶד.
הָרַחֲמָן הוּא יִתְבָּרַךְ בַּשָּׁמַיִם וּבָאָרֶץ.
הָרַחֲמָן הוּא יִשְׁתַּבַּח לְדוֹר דּוֹרִים, וְיִתְפָּאַר בָּנוּ לָעַד וּלְנֵצַח נְצָחִים, וְיִתְהַדַּר בָּנוּ לָעַד וּלְעוֹלְמֵי עוֹלָמִים.
הָרַחֲמָן הוּא יְפַרְנְסֵנוּ בְּכָבוֹד.
הָרַחֲמָן הוּא יִשְׁבֹּר עֻלֵּנוּ מֵעַל צַוָּארֵנוּ, וְהוּא יוֹלִיכֵנוּ קוֹמְמִיּוּת לְאַרְצֵנוּ.
הָרַחֲמָן הוּא יִשְׁלַח לָנוּ בְּרָכָה מְרֻבָּה בַּבַּיִת הַזֶּה, וְעַל שֻׁלְחָן זֶה שֶׁאָכַלְנוּ עָלָיו.
הָרַחֲמָן הוּא יִשְׁלַח לָנוּ אֶת אֵלִיָּהוּ הַנָּבִיא זָכוּר לַטּוֹב, וִיבַשֶּׂר לָנוּ בְּשׂוֹרוֹת טוֹבוֹת יְשׁוּעוֹת וְנֶחָמוֹת.`;

const HARACHAMAN_HOST = `הָרַחֲמָן הוּא יְבָרֵךְ אֶת אָבִי מוֹרִי בַּעַל הַבַּיִת הַזֶּה וְאֶת אִמִּי מוֹרָתִי בַּעֲלַת הַבַּיִת הַזֶּה (וכן כל בני הבית) בִּמְהֵרָה בְיָמֵינוּ.`;

const CLOSING_PESUKIM = `מִגְדּוֹל יְשׁוּעוֹת מַלְכּוֹ, וְעֹשֶׂה חֶסֶד לִמְשִׁיחוֹ, לְדָוִד וּלְזַרְעוֹ עַד עוֹלָם. עֹשֶׂה שָׁלוֹם בִּמְרוֹמָיו, הוּא יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל, וְאִמְרוּ אָמֵן.

יְראוּ אֶת ה' קְדוֹשָׁיו, כִּי אֵין מַחְסוֹר לִירֵאָיו. כְּפִירִים רָשׁוּ וְרָעֵבוּ, וְדֹרְשֵׁי ה' לֹא יַחְסְרוּ כָל טוֹב. הוֹדוּ לַה' כִּי טוֹב, כִּי לְעוֹלָם חַסְדּוֹ. פּוֹתֵחַ אֶת יָדֶךָ, וּמַשְׂבִּיעַ לְכָל חַי רָצוֹן. בָּרוּךְ הַגֶּבֶר אֲשֶׁר יִבְטַח בַּה', וְהָיָה ה' מִבְטַחוֹ. ה' עֹז לְעַמּוֹ יִתֵּן, ה' יְבָרֵךְ אֶת עַמּוֹ בַשָּׁלוֹם.`;

// ============================ Conditional inserts ============================

const RETZE_SHABBAT = `רְצֵה וְהַחֲלִיצֵנוּ ה' אֱלֹהֵינוּ בְּמִצְוֹתֶיךָ, וּבְמִצְוַת יוֹם הַשְּׁבִיעִי הַשַּׁבָּת הַגָּדוֹל וְהַקָּדוֹשׁ הַזֶּה. כִּי יוֹם זֶה גָּדוֹל וְקָדוֹשׁ הוּא לְפָנֶיךָ, לִשְׁבָּת בּוֹ וְלָנוּחַ בּוֹ בְּאַהֲבָה כְּמִצְוַת רְצוֹנֶךָ. וּבִרְצוֹנְךָ הָנִיחַ לָנוּ ה' אֱלֹהֵינוּ, שֶׁלֹּא תְהֵא צָרָה וְיָגוֹן וַאֲנָחָה בְּיוֹם מְנוּחָתֵנוּ. וְהַרְאֵנוּ ה' אֱלֹהֵינוּ בְּנֶחָמַת צִיּוֹן עִירֶךָ, וּבְבִנְיַן יְרוּשָׁלַיִם עִיר קָדְשֶׁךָ, כִּי אַתָּה הוּא בַּעַל הַיְשׁוּעוֹת וּבַעַל הַנֶּחָמוֹת.`;

function yaalehVeyavo(dayName: string): string {
  return `אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, יַעֲלֶה וְיָבֹא וְיַגִּיעַ, וְיֵרָאֶה וְיֵרָצֶה וְיִשָּׁמַע, וְיִפָּקֵד וְיִזָּכֵר זִכְרוֹנֵנוּ וּפִקְדּוֹנֵנוּ, וְזִכְרוֹן אֲבוֹתֵינוּ, וְזִכְרוֹן מָשִׁיחַ בֶּן דָּוִד עַבְדֶּךָ, וְזִכְרוֹן יְרוּשָׁלַיִם עִיר קָדְשֶׁךָ, וְזִכְרוֹן כָּל עַמְּךָ בֵּית יִשְׂרָאֵל לְפָנֶיךָ, לִפְלֵיטָה לְטוֹבָה, לְחֵן וּלְחֶסֶד וּלְרַחֲמִים, לְחַיִּים וּלְשָׁלוֹם בְּיוֹם ${dayName} הַזֶּה. זָכְרֵנוּ ה' אֱלֹהֵינוּ בּוֹ לְטוֹבָה, וּפָקְדֵנוּ בוֹ לִבְרָכָה, וְהוֹשִׁיעֵנוּ בוֹ לְחַיִּים. וּבִדְבַר יְשׁוּעָה וְרַחֲמִים, חוּס וְחָנֵּנוּ וְרַחֵם עָלֵינוּ וְהוֹשִׁיעֵנוּ, כִּי אֵלֶיךָ עֵינֵינוּ, כִּי אֵל מֶלֶךְ חַנּוּן וְרַחוּם אָתָּה.`;
}

const AL_HANISIM_BASE = `עַל הַנִּסִּים וְעַל הַפֻּרְקָן וְעַל הַגְּבוּרוֹת וְעַל הַתְּשׁוּעוֹת וְעַל הַנִּפְלָאוֹת וְעַל הַנֶּחָמוֹת וְעַל הַמִּלְחָמוֹת שֶׁעָשִׂיתָ לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה.`;

const AL_HANISIM_CHANUKAH = `${AL_HANISIM_BASE}

בִּימֵי מַתִּתְיָהוּ בֶּן יוֹחָנָן כֹּהֵן גָּדוֹל חַשְׁמוֹנָאִי וּבָנָיו, כְּשֶׁעָמְדָה מַלְכוּת יָוָן הָרְשָׁעָה עַל עַמְּךָ יִשְׂרָאֵל לְהַשְׁכִּיחָם תּוֹרָתֶךָ וּלְהַעֲבִירָם מֵחֻקֵּי רְצוֹנֶךָ. וְאַתָּה בְּרַחֲמֶיךָ הָרַבִּים עָמַדְתָּ לָהֶם בְּעֵת צָרָתָם. רַבְתָּ אֶת רִיבָם. דַּנְתָּ אֶת דִּינָם. נָקַמְתָּ אֶת נִקְמָתָם. מָסַרְתָּ גִּבּוֹרִים בְּיַד חַלָּשִׁים, וְרַבִּים בְּיַד מְעַטִּים, וּטְמֵאִים בְּיַד טְהוֹרִים, וּרְשָׁעִים בְּיַד צַדִּיקִים, וְזֵדִים בְּיַד עוֹסְקֵי תוֹרָתֶךָ. וּלְךָ עָשִׂיתָ שֵׁם גָּדוֹל וְקָדוֹשׁ בְּעוֹלָמֶךָ, וּלְעַמְּךָ יִשְׂרָאֵל עָשִׂיתָ תְּשׁוּעָה גְדוֹלָה וּפֻרְקָן כְּהַיּוֹם הַזֶּה. וְאַחַר כָּךְ בָּאוּ בָנֶיךָ לִדְבִיר בֵּיתֶךָ, וּפִנּוּ אֶת הֵיכָלֶךָ, וְטִהֲרוּ אֶת מִקְדָּשֶׁךָ, וְהִדְלִיקוּ נֵרוֹת בְּחַצְרוֹת קָדְשֶׁךָ, וְקָבְעוּ שְׁמוֹנַת יְמֵי חֲנֻכָּה אֵלּוּ לְהוֹדוֹת וּלְהַלֵּל לְשִׁמְךָ הַגָּדוֹל.`;

const AL_HANISIM_PURIM = `${AL_HANISIM_BASE}

בִּימֵי מָרְדֳּכַי וְאֶסְתֵּר בְּשׁוּשַׁן הַבִּירָה, כְּשֶׁעָמַד עֲלֵיהֶם הָמָן הָרָשָׁע, בִּקֵּשׁ לְהַשְׁמִיד לַהֲרֹג וּלְאַבֵּד אֶת כָּל הַיְּהוּדִים מִנַּעַר וְעַד זָקֵן טַף וְנָשִׁים בְּיוֹם אֶחָד בִּשְׁלֹשָׁה עָשָׂר לְחֹדֶשׁ שְׁנֵים עָשָׂר, הוּא חֹדֶשׁ אֲדָר, וּשְׁלָלָם לָבוֹז. וְאַתָּה בְּרַחֲמֶיךָ הָרַבִּים הֵפַרְתָּ אֶת עֲצָתוֹ, וְקִלְקַלְתָּ אֶת מַחֲשַׁבְתּוֹ, וַהֲשֵׁבוֹתָ לּוֹ גְּמוּלוֹ בְּרֹאשׁוֹ, וְתָלוּ אוֹתוֹ וְאֶת בָּנָיו עַל הָעֵץ.`;

// ============================ Builder ============================

/** A "day-name" string for yaaleh veyavo in BH. */
type YaalehDay = { id: string; label: string; name: string };

/**
 * Determine which yaaleh-ve'yavo day applies, if any.
 * Priority: YT > CHM > RH > RC.
 */
function getYaalehDay(hd: HDate, inIsrael: boolean): YaalehDay | null {
  const m = hd.getMonth();
  const d = hd.getDate();

  // Rosh Hashana (1-2 Tishrei)
  if (m === months.TISHREI && (d === 1 || d === 2)) {
    return { id: 'rh', label: 'יעלה ויבא לראש השנה', name: 'הַזִּכָּרוֹן הַזֶּה' };
  }
  // Sukkot (15-21 Tishrei) - includes chol hamoed
  if (m === months.TISHREI && d >= 15 && d <= 21) {
    return { id: 'sukkot', label: 'יעלה ויבא לסוכות', name: 'חַג הַסֻּכּוֹת הַזֶּה' };
  }
  // Shemini Atzeret / Simchat Torah (22-23 Tishrei; in EY only 22)
  if (m === months.TISHREI && (d === 22 || (!inIsrael && d === 23))) {
    return { id: 'shmini', label: 'יעלה ויבא לשמיני עצרת', name: 'שְׁמִינִי חַג הָעֲצֶרֶת הַזֶּה' };
  }
  // Pesach (15-21 Nisan; in chu"l 15-22) - includes chol hamoed
  if (m === months.NISAN && d >= 15 && d <= (inIsrael ? 21 : 22)) {
    return { id: 'pesach', label: 'יעלה ויבא לפסח', name: 'חַג הַמַּצּוֹת הַזֶּה' };
  }
  // Shavuot (6 Sivan in EY, 6-7 in chu"l)
  if (m === months.SIVAN && (d === 6 || (!inIsrael && d === 7))) {
    return { id: 'shavuot', label: 'יעלה ויבא לשבועות', name: 'חַג הַשָּׁבֻעוֹת הַזֶּה' };
  }
  // Rosh Chodesh (any day not already covered above)
  if (d === 1 || d === 30) {
    // hebcal's HDate handles this — check via flags below
    // We'll detect ROSH_CHODESH separately
  }
  return null;
}

/** Detect if today is Rosh Chodesh (excluding RH which has its own yaaleh). */
function isRoshChodesh(hd: HDate, inIsrael: boolean): boolean {
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  return events.some((e) => e.getFlags() & flags.ROSH_CHODESH);
}

/** Build Birkat HaMazon segments for the given date. */
export function buildBirkatHamazon(date: Date = new Date(), inIsrael = true): BirkatSegment[] {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const isShabbat = date.getDay() === 6; // JS Saturday
  const yaaleh = getYaalehDay(hd, inIsrael);
  const isRC = !yaaleh && isRoshChodesh(hd, inIsrael);

  // Chanukah: 25 Kislev - 2 Tevet (or 3 in non-29 Kislev years - hebcal handles via events)
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  const isChanukah = events.some((e) => e.getDesc().toLowerCase().includes('chanukah'));
  // Purim: 14 Adar (Adar II in leap year); 15 Adar (Shushan Purim - inIsrael for Jerusalem; we use a wider rule)
  const adarMonth = HDate.isLeapYear(hd.getFullYear()) ? months.ADAR_II : months.ADAR_I;
  const isPurim = m === adarMonth && (d === 14 || d === 15);

  const segments: BirkatSegment[] = [];

  segments.push({ id: 'zimmun', text: ZIMMUN_INTRO });
  segments.push({ id: 'b1-hazan', text: BRACHA_1_HAZAN, header: 'ברכה ראשונה - הזן את הכל' });
  segments.push({ id: 'b2-haaretz-open', text: BRACHA_2_HAARETZ_OPENING, header: 'ברכה שנייה - ברכת הארץ' });

  // Al HaNissim inside Bracha 2
  if (isChanukah) {
    segments.push({
      id: 'al-hanisim-chanukah',
      text: AL_HANISIM_CHANUKAH,
      conditional: { label: 'על הניסים לחנוכה' },
    });
  }
  if (isPurim) {
    segments.push({
      id: 'al-hanisim-purim',
      text: AL_HANISIM_PURIM,
      conditional: { label: 'על הניסים לפורים' },
    });
  }

  segments.push({ id: 'b2-haaretz-close', text: BRACHA_2_HAARETZ_CLOSING });

  segments.push({ id: 'b3-rachem-open', text: BRACHA_3_RACHEM_OPENING, header: 'ברכה שלישית - בונה ירושלים' });

  // Retze (Shabbat)
  if (isShabbat) {
    segments.push({
      id: 'retze',
      text: RETZE_SHABBAT,
      conditional: { label: 'רצה והחליצנו לשבת' },
    });
  }

  // Yaaleh ve'yavo
  if (yaaleh) {
    segments.push({
      id: 'yaaleh-' + yaaleh.id,
      text: yaalehVeyavo(yaaleh.name),
      conditional: { label: yaaleh.label },
    });
  } else if (isRC) {
    segments.push({
      id: 'yaaleh-rc',
      text: yaalehVeyavo('רֹאשׁ הַחֹדֶשׁ'),
      conditional: { label: 'יעלה ויבא לראש חודש' },
    });
  }

  segments.push({ id: 'b3-rachem-close', text: BRACHA_3_RACHEM_CLOSING });

  // Compensatory brachot for someone who FORGOT the relevant insert.
  // These live RIGHT AFTER "ובנה ברחמיו ירושלים" — that's the halachic
  // location where they're recited (between bracha 3 and bracha 4, as a
  // standalone "Asher natan..." bracha without shem u'malchut at chatima).
  // Hidden by default behind a collapsible.
  if (isShabbat) {
    segments.push({
      id: 'compensate-shabbat',
      text: 'בָּרוּךְ אַתָּה ה\' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁנָּתַן שַׁבָּתוֹת לִמְנוּחָה לְעַמּוֹ יִשְׂרָאֵל בְּאַהֲבָה לְאוֹת וְלִבְרִית. בָּרוּךְ אַתָּה ה\', מְקַדֵּשׁ הַשַּׁבָּת.',
      collapsed: { summary: 'אם שכחת רצה' },
    });
  }
  if (isRC && !yaaleh) {
    segments.push({
      id: 'compensate-rc',
      text: 'בָּרוּךְ אַתָּה ה\' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר נָתַן רָאשֵׁי חֳדָשִׁים לְעַמּוֹ יִשְׂרָאֵל לְזִכָּרוֹן. (אומרים בלי שם ומלכות בחתימה.)',
      collapsed: { summary: 'אם שכחת יעלה ויבא לראש חודש' },
    });
  }
  if (yaaleh && (yaaleh.id === 'sukkot' || yaaleh.id === 'pesach' || yaaleh.id === 'shavuot' || yaaleh.id === 'shmini')) {
    segments.push({
      id: 'compensate-yt',
      text: 'בָּרוּךְ אַתָּה ה\' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁנָּתַן יָמִים טוֹבִים לְעַמּוֹ יִשְׂרָאֵל לְשָׂשׂוֹן וּלְשִׂמְחָה אֶת יוֹם ' + yaaleh.name + '. בָּרוּךְ אַתָּה ה\', מְקַדֵּשׁ יִשְׂרָאֵל וְהַזְּמַנִּים. (אם שכח ביו"ט עצמו — חייב לחזור על כל ברכת המזון. בחוה"מ — אומר ברכה זו ללא שם ומלכות.)',
      collapsed: { summary: 'אם שכחת יעלה ויבא ביום טוב / חוה"מ' },
    });
  }

  segments.push({ id: 'b4-hatov', text: BRACHA_4_HATOV, header: 'ברכה רביעית - הטוב והמטיב' });

  segments.push({ id: 'harachaman-core', text: HARACHAMAN_CORE, header: 'הרחמן' });
  segments.push({ id: 'harachaman-host', text: HARACHAMAN_HOST });

  // Day-specific Harachaman additions
  if (isShabbat) {
    segments.push({
      id: 'harachaman-shabbat',
      text: 'הָרַחֲמָן הוּא יַנְחִילֵנוּ יוֹם שֶׁכֻּלּוֹ שַׁבָּת וּמְנוּחָה לְחַיֵּי הָעוֹלָמִים.',
      conditional: { label: 'הרחמן לשבת' },
    });
  }
  // RH gets its own Harachaman about the new year
  if (m === months.TISHREI && (d === 1 || d === 2)) {
    segments.push({
      id: 'harachaman-rh',
      text: 'הָרַחֲמָן הוּא יְחַדֵּשׁ עָלֵינוּ אֶת הַשָּׁנָה הַזֹּאת לְטוֹבָה וְלִבְרָכָה.',
      conditional: { label: 'הרחמן לראש השנה' },
    });
  } else if (isRC) {
    segments.push({
      id: 'harachaman-rc',
      text: 'הָרַחֲמָן הוּא יְחַדֵּשׁ עָלֵינוּ אֶת הַחֹדֶשׁ הַזֶּה לְטוֹבָה וְלִבְרָכָה.',
      conditional: { label: 'הרחמן לראש חודש' },
    });
  } else if (yaaleh && (yaaleh.id === 'shmini' || yaaleh.id === 'pesach' || yaaleh.id === 'shavuot' || yaaleh.id === 'sukkot')) {
    segments.push({
      id: 'harachaman-yt',
      text: 'הָרַחֲמָן הוּא יַנְחִילֵנוּ יוֹם שֶׁכֻּלּוֹ טוֹב.',
      conditional: { label: 'הרחמן ליום טוב' },
    });
  }

  // Sukkot - sukkat David
  if (yaaleh && yaaleh.id === 'sukkot') {
    segments.push({
      id: 'harachaman-sukkah',
      text: 'הָרַחֲמָן הוּא יָקִים לָנוּ אֶת סֻכַּת דָּוִד הַנּוֹפֶלֶת.',
      conditional: { label: 'הרחמן לסוכות' },
    });
  }

  // Compensatory Harachaman for someone who FORGOT Al haNisim in bracha 2.
  // No "Asher Natan" bracha is recited (אל הניסים is not chova in BH); instead
  // a Harachaman about נסים replaces it. Hidden by default in a collapsible.
  if (isChanukah) {
    segments.push({
      id: 'harachaman-compensate-chanukah',
      text: 'הָרַחֲמָן הוּא יַעֲשֶׂה לָנוּ נִסִּים וְנִפְלָאוֹת כְּשֵׁם שֶׁעָשָׂה לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה. בִּימֵי מַתִּתְיָהוּ...',
      collapsed: { summary: 'אם שכחת על הניסים (חנוכה)' },
    });
  }
  if (isPurim) {
    segments.push({
      id: 'harachaman-compensate-purim',
      text: 'הָרַחֲמָן הוּא יַעֲשֶׂה לָנוּ נִסִּים וְנִפְלָאוֹת כְּשֵׁם שֶׁעָשָׂה לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה. בִּימֵי מָרְדֳּכַי וְאֶסְתֵּר...',
      collapsed: { summary: 'אם שכחת על הניסים (פורים)' },
    });
  }

  // Final Harachaman about Mashiach (universal but typically said as part of Harachaman list)
  segments.push({
    id: 'harachaman-mashiach',
    text: 'הָרַחֲמָן הוּא יְזַכֵּנוּ לִימוֹת הַמָּשִׁיחַ וּלְחַיֵּי הָעוֹלָם הַבָּא.',
  });

  segments.push({ id: 'closing', text: CLOSING_PESUKIM });

  return segments;
}

/** Get a list of just the conditional inserts that apply today, for a summary banner. */
export function getActiveInsertLabels(date: Date = new Date(), inIsrael = true): string[] {
  return buildBirkatHamazon(date, inIsrael)
    .filter((s) => s.conditional)
    .map((s) => s.conditional!.label);
}

// ============================ Sheva Brachot (חתן וכלה) ============================

/**
 * Special Birkat HaMazon for the seven-blessings meal (sheva brachot) during the
 * week following a wedding. In this seder:
 *   - The zimmun opens with "דְּוַי הָסֵר" (a special introduction).
 *   - In Harachaman, "הָרַחֲמָן הוּא יְבָרֵךְ אֶת הֶחָתָן וְאֶת הַכַּלָּה" is added,
 *     and the standard "הַשִּׂמְחָה בִּמְעוֹנוֹ" line is inserted before the zimmun proper.
 *   - After the four brachot of birkat hamazon, the seven wedding blessings are recited
 *     over a second cup of wine. The final ברכת הגפן (over the wine of the meal/zimmun)
 *     is recited LAST, after the seven blessings.
 *
 * This builder returns the full sequence: zimmun → birkat hamazon → seven blessings →
 * final בורא פרי הגפן. Caller decides when "פנים חדשות" (a new face) is present; some
 * customs alter the seven blessings on days without פנים חדשות.
 */

const ZIMMUN_SHEVA_BRACHOT = `(זימון לשבע ברכות - המזמן פותח:)
דְּוַי הָסֵר וְגַם חָרוֹן, וְאָז אִלֵּם בְּשִׁיר יָרוֹן. נְחֵנוּ בְּמַעְגְּלֵי צֶדֶק, שְׁעֵה בִּרְכַּת בְּנֵי אַהֲרֹן.
בִּרְשׁוּת מָרָנָן וְרַבָּנָן וְרַבּוֹתַי, נְבָרֵךְ אֱלֹהֵינוּ שֶׁהַשִּׂמְחָה בִּמְעוֹנוֹ וְשֶׁאָכַלְנוּ מִשֶּׁלּוֹ.
(המסובים:) בָּרוּךְ אֱלֹהֵינוּ שֶׁהַשִּׂמְחָה בִּמְעוֹנוֹ וְשֶׁאָכַלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִינוּ.
(המזמן חוזר:) בָּרוּךְ אֱלֹהֵינוּ שֶׁהַשִּׂמְחָה בִּמְעוֹנוֹ וְשֶׁאָכַלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִינוּ.`;

const HARACHAMAN_CHATAN_KALLAH = `הָרַחֲמָן הוּא יְבָרֵךְ אֶת הֶחָתָן וְאֶת הַכַּלָּה.`;

/** The seven wedding blessings, in the order recited over a second cup. */
export const SHEVA_BRACHOT: string[] = [
  // 1. שהכל ברא לכבודו
  `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהַכֹּל בָּרָא לִכְבוֹדוֹ.`,
  // 2. יוצר האדם
  `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, יוֹצֵר הָאָדָם.`,
  // 3. אשר יצר
  `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר יָצַר אֶת הָאָדָם בְּצַלְמוֹ, בְּצֶלֶם דְּמוּת תַּבְנִיתוֹ, וְהִתְקִין לוֹ מִמֶּנּוּ בִּנְיַן עֲדֵי עַד. בָּרוּךְ אַתָּה ה', יוֹצֵר הָאָדָם.`,
  // 4. שוש תשיש
  `שׂוֹשׂ תָּשִׂישׂ וְתָגֵל הָעֲקָרָה, בְּקִבּוּץ בָּנֶיהָ לְתוֹכָהּ בְּשִׂמְחָה. בָּרוּךְ אַתָּה ה', מְשַׂמֵּחַ צִיּוֹן בְּבָנֶיהָ.`,
  // 5. שמח תשמח
  `שַׂמַּח תְּשַׂמַּח רֵעִים הָאֲהוּבִים, כְּשַׂמֵּחֲךָ יְצִירְךָ בְּגַן עֵדֶן מִקֶּדֶם. בָּרוּךְ אַתָּה ה', מְשַׂמֵּחַ חָתָן וְכַלָּה.`,
  // 6. אשר ברא ששון ושמחה
  `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בָּרָא שָׂשׂוֹן וְשִׂמְחָה, חָתָן וְכַלָּה, גִּילָה רִנָּה דִּיצָה וְחֶדְוָה, אַהֲבָה וְאַחֲוָה וְשָׁלוֹם וְרֵעוּת. מְהֵרָה ה' אֱלֹהֵינוּ יִשָּׁמַע בְּעָרֵי יְהוּדָה וּבְחוּצוֹת יְרוּשָׁלָיִם: קוֹל שָׂשׂוֹן וְקוֹל שִׂמְחָה, קוֹל חָתָן וְקוֹל כַּלָּה. בָּרוּךְ אַתָּה ה', מְשַׂמֵּחַ חָתָן עִם הַכַּלָּה.`,
  // 7. בורא פרי הגפן — LAST (recited over the second cup, after the other six)
  `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.`,
];

// ============================ Brit Milah (ברית מילה) ============================

/**
 * Additions for Birkat HaMazon at a brit milah meal. Inserted into the
 * Harachaman list, after the host blessing.
 */
const HARACHAMAN_BRIT_MILAH: { id: string; label: string; text: string }[] = [
  {
    id: 'harachaman-avi-haben',
    label: 'הרחמן לאבי הבן',
    text: 'הָרַחֲמָן הוּא יְבָרֵךְ אֲבִי הַיֶּלֶד וְאִמּוֹ, וְיִזְכּוּ לְגַדְּלוֹ וּלְחַנְּכוֹ וּלְחַכְּמוֹ. מִיּוֹם הַשְּׁמִינִי וָהָלְאָה יֵרָצֶה דָמוֹ, וִיהִי ה\' אֱלֹהָיו עִמּוֹ.',
  },
  {
    id: 'harachaman-rach-hanimol',
    label: 'הרחמן לרך הנימול',
    text: 'הָרַחֲמָן הוּא יְבָרֵךְ רַךְ הַנִּמּוֹל לִשְׁמוֹנָה, וְיִהְיוּ יָדָיו וְלִבּוֹ לְאֵל אֱמוּנָה, וְיִזְכֶּה לִרְאוֹת פְּנֵי הַשְּׁכִינָה, שָׁלוֹשׁ פְּעָמִים בַּשָּׁנָה.',
  },
  {
    id: 'harachaman-sandak-mohel',
    label: 'הרחמן לסנדק ולמוהל',
    text: 'הָרַחֲמָן הוּא יְבָרֵךְ הַמָּל בְּשַׂר הָעָרְלָה, וּפָרַע וּמָצַץ דְּמֵי הַמִּילָה. אִישׁ הַיָּרֵא וְרַךְ הַלֵּבָב עֲבוֹדָתוֹ פְּסוּלָה, אִם שְׁלוֹשׁ אֵלֶּה לֹא יַעֲשֶׂה לָהּ.',
  },
  {
    id: 'harachaman-eliyahu',
    label: 'הרחמן לאליהו הנביא',
    text: 'הָרַחֲמָן הוּא יִשְׁלַח לָנוּ מְשִׁיחוֹ הוֹלֵךְ תָּמִים, בִּזְכוּת חֲתַן לַמּוּלוֹת דָּמִים, לְבַשֵּׂר בְּשׂוֹרוֹת טוֹבוֹת וְנִחוּמִים, לְעַם אֶחָד מְפֻזָּר וּמְפֹרָד בֵּין הָעַמִּים. הָרַחֲמָן הוּא יִשְׁלַח לָנוּ כֹּהֵן צֶדֶק אֲשֶׁר לֻקַּח לְעֵילוֹם, עַד הוּכַן כִּסְאוֹ כַּשֶּׁמֶשׁ וְיַהֲלוֹם, וַיָּלֶט פָּנָיו בְּאַדַּרְתּוֹ וַיִּגְלוֹם, בְּרִיתִי הָיְתָה אִתּוֹ הַחַיִּים וְהַשָּׁלוֹם.',
  },
];

/**
 * Build the full Birkat HaMazon sequence for a brit milah meal.
 * The four standard Harachaman-Brit-Milah lines are added after the host blessing.
 */
export function buildBritMilahBirkatHamazon(date: Date = new Date(), inIsrael = true): BirkatSegment[] {
  const body = buildBirkatHamazon(date, inIsrael);
  const segments: BirkatSegment[] = [];
  for (const seg of body) {
    segments.push(seg);
    if (seg.id === 'harachaman-host') {
      for (const b of HARACHAMAN_BRIT_MILAH) {
        segments.push({
          id: b.id,
          text: b.text,
          conditional: { label: b.label },
        });
      }
    }
  }
  return segments;
}

/**
 * Build the full Birkat HaMazon sequence for a sheva brachot meal.
 * The seven wedding blessings are added at the end, with בורא פרי הגפן LAST.
 */
export function buildShevaBrachot(date: Date = new Date(), inIsrael = true): BirkatSegment[] {
  const segments: BirkatSegment[] = [];

  // Special zimmun opening for sheva brachot.
  segments.push({
    id: 'sheva-zimmun',
    text: ZIMMUN_SHEVA_BRACHOT,
    header: 'זימון לשבע ברכות',
  });

  // The body of Birkat HaMazon is the same as a regular weekday/shabbat/yom-tov meal,
  // minus the standard zimmun intro (which we've replaced above).
  const body = buildBirkatHamazon(date, inIsrael).filter((s) => s.id !== 'zimmun');

  // Insert "הרחמן הוא יברך את החתן ואת הכלה" into the harachaman list, right after
  // the host blessing.
  for (const seg of body) {
    segments.push(seg);
    if (seg.id === 'harachaman-host') {
      segments.push({
        id: 'harachaman-chatan-kallah',
        text: HARACHAMAN_CHATAN_KALLAH,
        conditional: { label: 'הרחמן לחתן ולכלה' },
      });
    }
  }

  // The seven blessings, recited over a second cup of wine after Birkat HaMazon.
  // ברכת הגפן (#7 in the list) is LAST.
  segments.push({
    id: 'sheva-brachot-intro',
    text: '(לוקחים כוס שני של יין ואומרים את שבע הברכות. ברכת הגפן היא האחרונה. מערבים מעט מהכוס של ברכת המזון בכוס של שבע הברכות, ושותים החתן והכלה.)',
    header: 'שבע ברכות',
  });
  SHEVA_BRACHOT.forEach((text, i) => {
    segments.push({
      id: `sheva-bracha-${i + 1}`,
      text: `${i + 1}. ${text}`,
    });
  });

  return segments;
}
