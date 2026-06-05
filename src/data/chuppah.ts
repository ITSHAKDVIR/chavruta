export type ChecklistItem = { id: string; label: string; note?: string };
export type ChecklistCategory = {
  id: string;
  title: string;
  emoji: string;
  daysBefore?: number;
  items: ChecklistItem[];
};

export const CHUPPAH_PREP: ChecklistCategory[] = [
  {
    id: 'rabbinate',
    title: 'רישום נישואין',
    emoji: '📋',
    daysBefore: 90,
    items: [
      { id: 'reg-rabbinate', label: 'רישום ברבנות (3 חודשים מראש)', note: 'תעודות זהות, תעודת רווקות, 2 עדים' },
      { id: 'reg-bachelorette', label: 'הצהרת רווקות (2 עדים)' },
      { id: 'reg-passport', label: 'תעודות זהות + תמונות' },
      { id: 'reg-jewishness', label: 'הוכחת יהדות (תעודת לידה הוריך / נישואין)' },
    ],
  },
  {
    id: 'rabbi',
    title: 'הרב המסדר קידושין',
    emoji: '✡️',
    daysBefore: 60,
    items: [
      { id: 'rabbi-choose', label: 'בחירת רב מסדר קידושין' },
      { id: 'rabbi-meet', label: 'פגישה אישית - הכנה' },
      { id: 'rabbi-shiur-1', label: 'שיעור 1 - היכרות + הלכות חתן' },
      { id: 'rabbi-shiur-2', label: 'שיעור 2 - טהרת המשפחה' },
      { id: 'rabbi-shiur-3', label: 'שיעור 3 - שלום בית' },
    ],
  },
  {
    id: 'kalla',
    title: 'הכנת הכלה',
    emoji: '👰',
    daysBefore: 60,
    items: [
      { id: 'kalla-bodeket', label: 'לימוד אצל יועצת/מורה לכלות' },
      { id: 'kalla-mikveh-tour', label: 'ביקור מקדים במקווה' },
      { id: 'kalla-bdika-shabbat', label: 'יום פרישה (5 ימים לפני)' },
      { id: 'kalla-hefsek-tahara', label: 'הפסק טהרה - יום אחרי וסת' },
      { id: 'kalla-seven-clean', label: '7 נקיים + בדיקות' },
      { id: 'kalla-mikveh', label: 'טבילה במקווה (לילה לפני)' },
    ],
  },
  {
    id: 'chatan',
    title: 'הכנת החתן',
    emoji: '🤵',
    daysBefore: 30,
    items: [
      { id: 'chatan-laws', label: 'לימוד הלכות חתן ושבע ברכות' },
      { id: 'chatan-tefilin-check', label: 'בדיקת תפילין (חתן מתחיל להניח)' },
      { id: 'chatan-mikveh', label: 'טבילה במקווה ערב החתונה' },
      { id: 'chatan-aliyah', label: 'אופרוף - עלייה לתורה (שבת לפני)' },
    ],
  },
  {
    id: 'tnaim',
    title: 'תנאים / וורט',
    emoji: '💍',
    daysBefore: 30,
    items: [
      { id: 'tnaim-write', label: 'כתיבת שטר תנאים' },
      { id: 'tnaim-witnesses', label: 'בחירת 2 עדים' },
      { id: 'tnaim-ceremony', label: 'טקס תנאים - שבירת צלחת' },
    ],
  },
  {
    id: 'ketubah',
    title: 'כתובה',
    emoji: '📜',
    daysBefore: 14,
    items: [
      { id: 'ketubah-buy', label: 'קניית כתובה (מודפסת או בכתב יד)' },
      { id: 'ketubah-rabbi', label: 'מסירת לרב למילוי' },
      { id: 'ketubah-witnesses', label: 'בחירת 2 עדים כשרים (לא קרובי משפחה)' },
    ],
  },
  {
    id: 'venue',
    title: 'אולם והסעודה',
    emoji: '🍽️',
    daysBefore: 60,
    items: [
      { id: 'venue-book', label: 'הזמנת אולם' },
      { id: 'venue-kashrut', label: 'אישור כשרות מהאולם' },
      { id: 'venue-chuppah-location', label: 'מקום חופה (פתוח / סגור)' },
      { id: 'venue-menu', label: 'תפריט - לבדוק שאין חמץ בפסח / כשרות אחרת' },
      { id: 'venue-mehadrin', label: 'אם רוצים מהדרין - תעודות מיוחדות' },
    ],
  },
  {
    id: 'guests',
    title: 'אורחים והזמנות',
    emoji: '✉️',
    daysBefore: 30,
    items: [
      { id: 'guests-list', label: 'רשימת מוזמנים' },
      { id: 'guests-invitation', label: 'הזמנות (לא לשכוח שם הוריו)' },
      { id: 'guests-shamash', label: 'בחירת שמש לאירוע' },
      { id: 'guests-mizmor', label: 'מי יקרא 7 ברכות' },
    ],
  },
  {
    id: 'day-of',
    title: 'יום החתונה',
    emoji: '💒',
    daysBefore: 1,
    items: [
      { id: 'day-fasting', label: 'תעניות חתן וכלה (מבוקר ועד החופה)' },
      { id: 'day-bedeken', label: 'בדקן - כיסוי פני הכלה' },
      { id: 'day-chuppah-canopy', label: 'חופה - 4 עמודים + טלית' },
      { id: 'day-kabbalat-kinyan', label: 'קבלת קניין מהחתן (לתשע ברכות)' },
      { id: 'day-glass', label: 'כוס לשבירה (זכר לחורבן)' },
      { id: 'day-yichud-room', label: 'חדר ייחוד מוכן' },
      { id: 'day-7-berachot-cup', label: '2 כוסות יין - לקידושין ולברכות' },
    ],
  },
  {
    id: 'after',
    title: 'שבעת ימי משתה',
    emoji: '🎉',
    daysBefore: 0,
    items: [
      { id: 'sb-1', label: 'יום 1 (יום החתונה) - סעודת ערב' },
      { id: 'sb-2', label: 'יום 2 - סעודה' },
      { id: 'sb-3', label: 'יום 3 - סעודה' },
      { id: 'sb-4', label: 'יום 4 - סעודה' },
      { id: 'sb-5', label: 'יום 5 - סעודה' },
      { id: 'sb-6', label: 'יום 6 - סעודה' },
      { id: 'sb-7', label: 'יום 7 - סיום' },
      { id: 'sb-each', label: 'כל סעודה: 10 גברים + פנים חדשות + ברכות' },
    ],
  },
];

export const SHEVA_BRACHOT_TEXT = `1. בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.

2. בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהַכֹּל בָּרָא לִכְבוֹדוֹ.

3. בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, יוֹצֵר הָאָדָם.

4. בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר יָצַר אֶת הָאָדָם בְּצַלְמוֹ, בְּצֶלֶם דְּמוּת תַּבְנִיתוֹ, וְהִתְקִין לוֹ מִמֶּנּוּ בִּנְיַן עֲדֵי עַד. בָּרוּךְ אַתָּה ה׳, יוֹצֵר הָאָדָם.

5. שׂוֹשׂ תָּשִׂישׂ וְתָגֵל הָעֲקָרָה, בְּקִבּוּץ בָּנֶיהָ לְתוֹכָהּ בְּשִׂמְחָה. בָּרוּךְ אַתָּה ה׳, מְשַׂמֵּחַ צִיּוֹן בְּבָנֶיהָ.

6. שַׂמַּח תְּשַׂמַּח רֵעִים הָאֲהוּבִים, כְּשַׂמֵּחֲךָ יְצִירְךָ בְּגַן עֵדֶן מִקֶּדֶם. בָּרוּךְ אַתָּה ה׳, מְשַׂמֵּחַ חָתָן וְכַלָּה.

7. בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בָּרָא שָׂשׂוֹן וְשִׂמְחָה, חָתָן וְכַלָּה, גִּילָה רִנָּה דִּיצָה וְחֶדְוָה, אַהֲבָה וְאַחֲוָה וְשָׁלוֹם וְרֵעוּת. מְהֵרָה ה׳ אֱלֹהֵינוּ יִשָּׁמַע בְּעָרֵי יְהוּדָה וּבְחוּצוֹת יְרוּשָׁלָיִם: קוֹל שָׂשׂוֹן וְקוֹל שִׂמְחָה, קוֹל חָתָן וְקוֹל כַּלָּה. בָּרוּךְ אַתָּה ה׳, מְשַׂמֵּחַ חָתָן עִם הַכַּלָּה.`;
