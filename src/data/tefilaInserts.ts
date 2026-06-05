import { HDate, HebrewCalendar, flags, months } from '@hebcal/core';

export type TefilaInsert = {
  id: string;
  title: string;
  /** Where in the amidah this is inserted */
  location: string;
  /** The text to insert */
  text: string;
  /** Optional ID-of-place explanation */
  when: string;
};

const YAALEH_VEYAVO = `יַעֲלֶה וְיָבוֹא וְיַגִּיעַ, וְיֵרָאֶה וְיֵרָצֶה וְיִשָּׁמַע, וְיִפָּקֵד וְיִזָּכֵר זִכְרוֹנֵנוּ וּפִקְדּוֹנֵנוּ, וְזִכְרוֹן אֲבוֹתֵינוּ, וְזִכְרוֹן מָשִׁיחַ בֶּן דָּוִד עַבְדֶּךָ, וְזִכְרוֹן יְרוּשָׁלַיִם עִיר קָדְשֶׁךָ, וְזִכְרוֹן כָּל עַמְּךָ בֵּית יִשְׂרָאֵל לְפָנֶיךָ, לִפְלֵיטָה לְטוֹבָה, לְחֵן וּלְחֶסֶד וּלְרַחֲמִים, לְחַיִּים וּלְשָׁלוֹם בְּיוֹם {DAY_NAME} הַזֶּה. זָכְרֵנוּ ה' אֱלֹהֵינוּ בּוֹ לְטוֹבָה, וּפָקְדֵנוּ בוֹ לִבְרָכָה, וְהוֹשִׁיעֵנוּ בוֹ לְחַיִּים. וּבִדְבַר יְשׁוּעָה וְרַחֲמִים, חוּס וְחָנֵּנוּ וְרַחֵם עָלֵינוּ וְהוֹשִׁיעֵנוּ, כִּי אֵלֶיךָ עֵינֵינוּ, כִּי אֵל מֶלֶךְ חַנּוּן וְרַחוּם אָתָּה.`;

const AL_HANISIM_BASE = `עַל הַנִּסִּים וְעַל הַפֻּרְקָן וְעַל הַגְּבוּרוֹת וְעַל הַתְּשׁוּעוֹת וְעַל הַמִּלְחָמוֹת שֶׁעָשִׂיתָ לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה.`;

const AL_HANISIM_CHANUKAH = `${AL_HANISIM_BASE}

בִּימֵי מַתִּתְיָהוּ בֶּן יוֹחָנָן כֹּהֵן גָּדוֹל חַשְׁמוֹנָאִי וּבָנָיו, כְּשֶׁעָמְדָה מַלְכוּת יָוָן הָרְשָׁעָה עַל עַמְּךָ יִשְׂרָאֵל לְהַשְׁכִּיחָם תּוֹרָתֶךָ וּלְהַעֲבִירָם מֵחֻקֵּי רְצוֹנֶךָ. וְאַתָּה בְּרַחֲמֶיךָ הָרַבִּים עָמַדְתָּ לָהֶם בְּעֵת צָרָתָם. רַבְתָּ אֶת רִיבָם. דַּנְתָּ אֶת דִּינָם. נָקַמְתָּ אֶת נִקְמָתָם. מָסַרְתָּ גִבּוֹרִים בְּיַד חַלָּשִׁים. וְרַבִּים בְּיַד מְעַטִּים. וּטְמֵאִים בְּיַד טְהוֹרִים. וּרְשָׁעִים בְּיַד צַדִּיקִים. וְזֵדִים בְּיַד עוֹסְקֵי תוֹרָתֶךָ. וּלְךָ עָשִׂיתָ שֵׁם גָּדוֹל וְקָדוֹשׁ בְּעוֹלָמֶךָ. וּלְעַמְּךָ יִשְׂרָאֵל עָשִׂיתָ תְּשׁוּעָה גְדוֹלָה וּפֻרְקָן כְּהַיּוֹם הַזֶּה. וְאַחַר כָּךְ בָּאוּ בָנֶיךָ לִדְבִיר בֵּיתֶךָ. וּפִנּוּ אֶת הֵיכָלֶךָ. וְטִהֲרוּ אֶת מִקְדָּשֶׁךָ. וְהִדְלִיקוּ נֵרוֹת בְּחַצְרוֹת קָדְשֶׁךָ. וְקָבְעוּ שְׁמוֹנַת יְמֵי חֲנֻכָּה אֵלּוּ לְהוֹדוֹת וּלְהַלֵּל לְשִׁמְךָ הַגָּדוֹל.`;

const AL_HANISIM_PURIM = `${AL_HANISIM_BASE}

בִּימֵי מָרְדֳּכַי וְאֶסְתֵּר בְּשׁוּשַׁן הַבִּירָה, כְּשֶׁעָמַד עֲלֵיהֶם הָמָן הָרָשָׁע, בִּקֵּשׁ לְהַשְׁמִיד לַהֲרֹג וּלְאַבֵּד אֶת כָּל הַיְּהוּדִים מִנַּעַר וְעַד זָקֵן טַף וְנָשִׁים בְּיוֹם אֶחָד בִּשְׁלֹשָׁה עָשָׂר לְחֹדֶשׁ שְׁנֵים עָשָׂר, הוּא חֹדֶשׁ אֲדָר, וּשְׁלָלָם לָבוֹז. וְאַתָּה בְּרַחֲמֶיךָ הָרַבִּים הֵפַרְתָּ אֶת עֲצָתוֹ, וְקִלְקַלְתָּ אֶת מַחֲשַׁבְתּוֹ, וַהֲשֵׁבוֹתָ לּוֹ גְּמוּלוֹ בְּרֹאשׁוֹ, וְתָלוּ אוֹתוֹ וְאֶת בָּנָיו עַל הָעֵץ.`;

const ANENU = `עֲנֵנוּ ה' עֲנֵנוּ בְּיוֹם צוֹם תַּעֲנִיתֵנוּ, כִּי בְצָרָה גְדוֹלָה אֲנָחְנוּ. אַל תֵּפֶן אֶל רִשְׁעֵנוּ, וְאַל תַּסְתֵּר פָּנֶיךָ מִמֶּנּוּ, וְאַל תִּתְעַלַּם מִתְּחִנָּתֵנוּ. הֱיֵה נָא קָרוֹב לְשַׁוְעָתֵנוּ, יְהִי נָא חַסְדְּךָ לְנַחֲמֵנוּ, טֶרֶם נִקְרָא אֵלֶיךָ עֲנֵנוּ, כַּדָּבָר שֶׁנֶּאֱמַר: "וְהָיָה טֶרֶם יִקְרָאוּ וַאֲנִי אֶעֱנֶה, עוֹד הֵם מְדַבְּרִים וַאֲנִי אֶשְׁמָע". כִּי אַתָּה ה' הָעוֹנֶה בְּעֵת צָרָה, פּוֹדֶה וּמַצִּיל בְּכָל עֵת צָרָה וְצוּקָה. בָּרוּךְ אַתָּה ה', הָעוֹנֶה לְעַמּוֹ יִשְׂרָאֵל בְּעֵת צָרָה.`;

const ATA_CHONANTANU = `אַתָּה חוֹנַנְתָּנוּ לְמַדַּע תּוֹרָתֶךָ, וַתְּלַמְּדֵנוּ לַעֲשׂוֹת חֻקֵּי רְצוֹנֶךָ, וַתַּבְדֵּל ה' אֱלֹהֵינוּ בֵּין קֹדֶשׁ לְחֹל, בֵּין אוֹר לְחֹשֶׁךְ, בֵּין יִשְׂרָאֵל לָעַמִּים, בֵּין יוֹם הַשְּׁבִיעִי לְשֵׁשֶׁת יְמֵי הַמַּעֲשֶׂה. אָבִינוּ מַלְכֵּנוּ הָחֵל עָלֵינוּ הַיָּמִים הַבָּאִים לִקְרָאתֵנוּ לְשָׁלוֹם, חֲשׂוּכִים מִכָּל חֵטְא, וּמְנֻקִּים מִכָּל עָוֹן, וּמְדֻבָּקִים בְּיִרְאָתֶךָ. וְחָנֵּנוּ מֵאִתְּךָ דֵּעָה בִּינָה וְהַשְׂכֵּל.`;

const ZACHRENU_LECHAIM = `זָכְרֵנוּ לְחַיִּים, מֶלֶךְ חָפֵץ בַּחַיִּים, וְכָתְבֵנוּ בְּסֵפֶר הַחַיִּים, לְמַעַנְךָ אֱלֹהִים חַיִּים.`;
const MI_KAMOCHA = `מִי כָמוֹךָ אָב הָרַחֲמִים, זוֹכֵר יְצוּרָיו לְחַיִּים בְּרַחֲמִים.`;
const UCHTOV = `וּכְתוֹב לְחַיִּים טוֹבִים כָּל בְּנֵי בְרִיתֶךָ.`;
const BSEFER_CHAIM = `בְּסֵפֶר חַיִּים בְּרָכָה וְשָׁלוֹם וּפַרְנָסָה טוֹבָה, נִזָּכֵר וְנִכָּתֵב לְפָנֶיךָ, אֲנַחְנוּ וְכָל עַמְּךָ בֵּית יִשְׂרָאֵל, לְחַיִּים טוֹבִים וּלְשָׁלוֹם.`;

const KING_HOLY_INSERT = `הַמֶּלֶךְ הַקָּדוֹשׁ (במקום "הָאֵל הַקָּדוֹשׁ")`;
const KING_JUDGEMENT_INSERT = `הַמֶּלֶךְ הַמִּשְׁפָּט (במקום "מֶלֶךְ אוֹהֵב צְדָקָה וּמִשְׁפָּט")`;

// Geshem / Tal season insertions in the Amidah (Birkat HaGevurot + Birkat HaShanim)
const GESHEM_GEVUROT = `מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם (במקום "מוֹרִיד הַטַּל")`;
const TAL_GEVUROT = `מוֹרִיד הַטַּל`;
const VETEN_TAL_UMATAR = `וְתֵן טַל וּמָטָר לִבְרָכָה (במקום "וְתֵן בְּרָכָה")`;
const VETEN_BERACHA = `וְתֵן בְּרָכָה`;

/**
 * Compute all tefila insertions that apply today.
 * Some are time-sensitive (Maariv Motzaei Shabbat, etc.) - the caller can filter by time of day.
 */
export function getInsertsForDate(date: Date = new Date(), inIsrael = true): TefilaInsert[] {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const gregDay = date.getDay();
  const inserts: TefilaInsert[] = [];

  // Hebcal events for additional context
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
  const isRoshChodesh = events.some((e) => e.getFlags() & flags.ROSH_CHODESH);
  const isFastDay = events.some((e) => e.getFlags() & (flags.MAJOR_FAST | flags.MINOR_FAST));
  const fastEv = events.find((e) => e.getFlags() & (flags.MAJOR_FAST | flags.MINOR_FAST));
  const isYomTov = events.some((e) => e.getFlags() & flags.CHAG);
  const isCholHamoed = events.some((e) => e.getFlags() & flags.CHOL_HAMOED);

  // 10 ימי תשובה
  const isAseretYemei =
    (m === months.TISHREI && d >= 1 && d <= 10);

  // Determine "day name" for ya'aleh ve'yavo
  function yaalehDay(name: string): TefilaInsert {
    return {
      id: 'yaaleh-' + name,
      title: 'יעלה ויבוא',
      location: 'בעמידה: ברכת רצה (לפני "ותחזינה"). בברכת המזון: ברכת רחם.',
      text: YAALEH_VEYAVO.replace('{DAY_NAME}', name),
      when: `${name}`,
    };
  }

  if (isRoshChodesh) inserts.push(yaalehDay('רֹאשׁ הַחֹדֶשׁ'));
  if (m === months.TISHREI && d === 1) inserts.push(yaalehDay('הַזִּכָּרוֹן הַזֶּה'));
  if (m === months.TISHREI && d >= 15 && d <= 21) inserts.push(yaalehDay('חַג הַסֻּכּוֹת הַזֶּה'));
  if (m === months.TISHREI && d === 22) inserts.push(yaalehDay('שְׁמִינִי חַג הָעֲצֶרֶת הַזֶּה'));
  if (m === months.NISAN && d >= 15 && d <= 21) inserts.push(yaalehDay('חַג הַמַּצּוֹת הַזֶּה'));
  if (m === months.SIVAN && (d === 6 || (!inIsrael && d === 7))) inserts.push(yaalehDay('חַג הַשָּׁבֻעוֹת הַזֶּה'));

  // Al HaNissim - Chanukah (25 Kislev - 2 Tevet)
  const inChanukah = (m === months.KISLEV && d >= 25) || (m === months.TEVET && d <= 2);
  if (inChanukah) {
    inserts.push({
      id: 'al-hanisim-chanukah',
      title: 'על הנסים (חנוכה)',
      location: 'בעמידה: בברכת מודים (לפני "ועל כולם"). בברכת המזון: בברכת הארץ.',
      text: AL_HANISIM_CHANUKAH,
      when: 'חנוכה',
    });
  }

  // Al HaNissim - Purim (14 Adar; 15 Adar in walled cities like Jerusalem)
  const adarMonth = HDate.isLeapYear(hd.getFullYear()) ? months.ADAR_II : months.ADAR_I;
  if (m === adarMonth && (d === 14 || (inIsrael && d === 15))) {
    inserts.push({
      id: 'al-hanisim-purim',
      title: 'על הנסים (פורים)',
      location: 'בעמידה: בברכת מודים. בברכת המזון: בברכת הארץ.',
      text: AL_HANISIM_PURIM,
      when: 'פורים',
    });
  }

  // Aneinu (fast day)
  if (isFastDay) {
    inserts.push({
      id: 'aneinu',
      title: 'עננו',
      location: 'בעמידה: בברכת שמע קולנו (לפני "כי אתה שומע").',
      text: ANENU,
      when: `${fastEv?.render('he-x-NoNikud') ?? 'יום צום'}`,
    });
  }

  // Ata chonantanu - מוצאי שבת מעריב (Saturday night = JS day 0/Sunday after sunset)
  // We approximate: show this on Sunday all day, since the maariv could be at any time after sunset on Sat
  if (gregDay === 0 || (gregDay === 6 && date.getHours() >= 18)) {
    inserts.push({
      id: 'ata-chonantanu',
      title: 'אתה חוננתנו',
      location: 'בעמידה של מעריב במוצאי שבת/חג: בברכת חונן הדעת (לפני "חננו...").',
      text: ATA_CHONANTANU,
      when: 'מוצאי שבת / מוצאי יום טוב',
    });
  }

  // ===== טל וגשם =====
  // Mashiv haRuach umorid haGeshem: Shmini Atzeret musaf → Pesach mussaf
  // (i.e., from 22 Tishrei through 15 Nisan)
  // Veten tal umatar livracha: 7 Cheshvan (in EY) → Pesach
  const isAdar = m === months.ADAR_I || m === months.ADAR_II;
  const isWinterGeshem = (
    (m === months.TISHREI && d >= 22) ||
    m === months.CHESHVAN ||
    m === months.KISLEV ||
    m === months.TEVET ||
    m === months.SHVAT ||
    isAdar ||
    (m === months.NISAN && d <= 15)
  );

  const isTalUmatar = (
    (m === months.CHESHVAN && d >= 7) ||
    m === months.KISLEV ||
    m === months.TEVET ||
    m === months.SHVAT ||
    isAdar ||
    (m === months.NISAN && d <= 15)
  );

  if (isWinterGeshem) {
    inserts.push({
      id: 'geshem',
      title: 'משיב הרוח ומוריד הגשם',
      location: 'בעמידה: בברכה השנייה (גבורות) - "אתה גיבור...".',
      text: GESHEM_GEVUROT,
      when: 'מוסף שמיני עצרת עד מוסף ראשון של פסח',
    });
  } else {
    inserts.push({
      id: 'tal',
      title: 'מוריד הטל',
      location: 'בעמידה: בברכה השנייה (גבורות) - אומרים "מוריד הטל" בקיץ.',
      text: TAL_GEVUROT,
      when: 'מוסף ראשון של פסח עד מוסף שמיני עצרת',
    });
  }

  if (isTalUmatar) {
    inserts.push({
      id: 'tal-umatar',
      title: 'ותן טל ומטר לברכה',
      location: 'בעמידה: בברכת השנים (ברך עלינו / ברכנו) - במקום "ותן ברכה".',
      text: VETEN_TAL_UMATAR,
      when: 'ז\' בחשוון (בא"י) / 4-5 דצמבר (בחו"ל) עד מוסף שביעי של פסח',
    });
  } else {
    inserts.push({
      id: 'veten-beracha',
      title: 'ותן ברכה (קיץ)',
      location: 'בעמידה: בברכת השנים (ברך עלינו / ברכנו).',
      text: VETEN_BERACHA,
      when: 'מוסף שביעי של פסח עד תחילת תקופת הגשמים',
    });
  }

  // Aseret Yemei Teshuva
  if (isAseretYemei) {
    inserts.push({
      id: 'king-holy',
      title: 'המלך הקדוש',
      location: 'בברכה ג׳ בעמידה.',
      text: KING_HOLY_INSERT,
      when: 'עשרת ימי תשובה',
    });
    inserts.push({
      id: 'king-judgment',
      title: 'המלך המשפט',
      location: 'בברכה י"א בעמידה (במקום "מלך אוהב צדקה ומשפט").',
      text: KING_JUDGEMENT_INSERT,
      when: 'עשרת ימי תשובה (חוץ משבת)',
    });
    inserts.push({
      id: 'zachrenu',
      title: 'זכרנו לחיים',
      location: 'בברכה ראשונה בעמידה (אחרי "האל הגדול").',
      text: ZACHRENU_LECHAIM,
      when: 'עשרת ימי תשובה',
    });
    inserts.push({
      id: 'mi-kamocha',
      title: 'מי כמוך אב הרחמים',
      location: 'בברכת תחיית המתים (אחרי "מי כמוך בעל גבורות").',
      text: MI_KAMOCHA,
      when: 'עשרת ימי תשובה',
    });
    inserts.push({
      id: 'uchtov',
      title: 'וכתוב לחיים טובים',
      location: 'בברכת מודים (אחרי "ועל כולם").',
      text: UCHTOV,
      when: 'עשרת ימי תשובה',
    });
    inserts.push({
      id: 'bsefer-chaim',
      title: 'בספר חיים',
      location: 'בברכת שלום (לפני חתימת הברכה).',
      text: BSEFER_CHAIM,
      when: 'עשרת ימי תשובה',
    });
  }

  return inserts;
}
