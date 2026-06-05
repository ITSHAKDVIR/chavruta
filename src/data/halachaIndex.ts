export type HalachaCategory =
  | 'shabbat'
  | 'kashrut'
  | 'moadim'
  | 'tefilah'
  | 'family'
  | 'mitzvot-haaretz'
  | 'aveilut'
  | 'misc';

export const CATEGORY_LABELS: Record<HalachaCategory, string> = {
  shabbat: 'שבת',
  kashrut: 'כשרות',
  moadim: 'מועדים',
  tefilah: 'תפילה וברכות',
  family: 'משפחה',
  'mitzvot-haaretz': 'מצוות התלויות בארץ',
  aveilut: 'אבלות',
  misc: 'שונות',
};

export const CATEGORY_EMOJI: Record<HalachaCategory, string> = {
  shabbat: '🕯️',
  kashrut: '🥩',
  moadim: '🎉',
  tefilah: '📿',
  family: '👨‍👩‍👧',
  'mitzvot-haaretz': '🌾',
  aveilut: '🕯',
  misc: '📚',
};

export type HalachaTopic = {
  id: string;
  title: string;
  category: HalachaCategory;
  summary: string;
  keywords: string[];
  sources: string;
};

// NOTE: Per Rabbi Dvir's halachic review (comment 97), the entire halacha index
// has been removed. The summaries here were a rough digest and were superseded
// by direct sources. The file is kept as an empty array for backwards
// compatibility with consumers (e.g. /tools/halacha-search.tsx), which now
// shows an empty list. Consider removing the search tool entirely.
export const HALACHA_INDEX: HalachaTopic[] = [
  /* Removed per Rabbi Dvir's review.
  { id: 'muktze', title: 'מוקצה בשבת', category: 'shabbat', summary: 'מוקצה הוא חפץ שאסור לטלטלו בשבת. סוגים: מוקצה מחמת גופו (אבנים, כסף), כלי שמלאכתו לאיסור (פטיש), ומוקצה מחמת חסרון כיס (סכין שחיטה).', keywords: ['מוקצה', 'מקצה', 'muktze', 'טלטול בשבת'], sources: 'שו"ע או"ח שח' },
  { id: 'kira-blech', title: 'כירה ובלעך בשבת', category: 'shabbat', summary: 'אסור להשהות תבשיל על אש גלויה בכניסת שבת אלא אם כן גרוף וקטום או מכוסה בבלעך. הבלעך מתיר השהיה וחזרה בתנאים מסוימים.', keywords: ['בלעך', 'כירה', 'פלטה', 'השהיה'], sources: 'שו"ע או"ח רנג' },
  { id: 'chazara', title: 'חזרת תבשיל בשבת', category: 'shabbat', summary: 'מותר להחזיר תבשיל לפלטה בשבת בתנאים: התבשיל מבושל כל צרכו, חם, היה בדעתו להחזירו, ולא הניחו על הקרקע.', keywords: ['חזרה', 'החזרה', 'פלטה', 'תבשיל חם'], sources: 'שו"ע או"ח רנג, ב' },
  { id: 'bishul-shabbat', title: 'בישול בשבת', category: 'shabbat', summary: 'אסור לבשל בשבת מאכל שאינו מבושל כל צרכו. יש איסור בישול אחר בישול בלח שהצטנן, ואין בישול אחר בישול ביבש לדעת השו"ע.', keywords: ['בישול', 'מבשל', 'יד סולדת'], sources: 'שו"ע או"ח שיח' },
  { id: 'borer', title: 'בורר בשבת', category: 'shabbat', summary: 'אסור להפריד תערובת בשבת. מותר לברור אוכל מתוך פסולת ביד, לאלתר, ולצורך אכילה מיידית.', keywords: ['בורר', 'ברירה', 'אוכל מפסולת'], sources: 'שו"ע או"ח שיט' },
  { id: 'lash', title: 'לישה בשבת', category: 'shabbat', summary: 'אסור ללוש בשבת. לבלילה רכה מותר לערב בשינוי. עירוב מים בקמח אסור אפילו בכלי שני.', keywords: ['לש', 'לישה', 'בלילה'], sources: 'שו"ע או"ח שכא' },
  { id: 'kotev', title: 'כותב ומוחק', category: 'shabbat', summary: 'אסור לכתוב או למחוק בשבת אפילו אות אחת. כולל שימוש במחשב, פתיחת עטיפה עם אותיות.', keywords: ['כותב', 'מוחק', 'כתיבה'], sources: 'שו"ע או"ח שמ' },
  { id: 'amira-l-akum', title: 'אמירה לעכו"ם', category: 'shabbat', summary: 'אסור לומר לנוכרי לעשות מלאכה עבור ישראל בשבת, אף ברמז. הותר במקום מצוה, חולי, או הפסד מרובה.', keywords: ['אמירה לגוי', 'שבת גוי'], sources: 'שו"ע או"ח שז' },
  { id: 'tchum-shabbat', title: 'תחום שבת', category: 'shabbat', summary: 'אסור לצאת מחוץ לאלפיים אמה מעיר בשבת. בעיר עצמה אין איסור. אפשר להרחיב ע"י עירוב תחומין.', keywords: ['תחום', 'אלפיים אמה', 'עירוב תחומין'], sources: 'שו"ע או"ח שצו' },
  { id: 'eruv-chatzerot', title: 'עירוב חצרות', category: 'shabbat', summary: 'מתיר טלטול בחצר משותפת או רשות הרבים מוקפת מחיצות. נעשה ע"י פת המשתפת את הדיירים.', keywords: ['עירוב', 'ערוב', 'טלטול'], sources: 'שו"ע או"ח שסו' },
  { id: 'kabalat-shabbat', title: 'קבלת שבת', category: 'shabbat', summary: 'מקבלים שבת לפחות מפלג המנחה ולכל המאוחר בשקיעה. נשים מקבלות בהדלקת נרות.', keywords: ['קבלת שבת', 'תוספת שבת', 'פלג'], sources: 'שו"ע או"ח רסא' },
  { id: 'hadlakat-nerot-shabbat', title: 'הדלקת נרות שבת', category: 'shabbat', summary: 'מצוה להדליק נרות לפני שקיעה, ברכה לאחר ההדלקה. זמן הדלקה 18-40 דקות לפני שקיעה לפי המנהג.', keywords: ['נרות שבת', 'הדלקה'], sources: 'שו"ע או"ח רסג' },
  { id: 'kiddush', title: 'קידוש בשבת', category: 'shabbat', summary: 'מצוה מן התורה לקדש על היין בכניסת שבת. צריך לשתות רוב רביעית. מקדשים במקום סעודה.', keywords: ['קידוש', 'יין', 'רביעית'], sources: 'שו"ע או"ח רעא' },
  { id: 'havdalah', title: 'הבדלה במוצאי שבת', category: 'shabbat', summary: 'מבדילים על יין, בשמים ונר. נשים חייבות. אם לא הבדיל אומר עד יום שלישי.', keywords: ['הבדלה', 'בשמים', 'נר הבדלה'], sources: 'שו"ע או"ח רצו' },
  { id: 'shalosh-seudot', title: 'שלוש סעודות שבת', category: 'shabbat', summary: 'חייב לאכול שלוש סעודות בשבת. סעודה שלישית מחצות היום ואילך.', keywords: ['סעודה שלישית', 'שלוש סעודות', 'מלוה מלכה'], sources: 'שו"ע או"ח רצא' },
  { id: 'pikuach-nefesh-shabbat', title: 'פיקוח נפש דוחה שבת', category: 'shabbat', summary: 'ספק נפשות דוחה שבת, ומצוה לחלל. הזריז הרי זה משובח.', keywords: ['פיקוח נפש', 'ספק נפשות', 'חילול שבת'], sources: 'שו"ע או"ח שכט' },
  { id: 'basar-b-chalav', title: 'בשר בחלב', category: 'kashrut', summary: 'אסור מן התורה לבשל, לאכול וליהנות. ממתינים שש שעות מבשר לחלב.', keywords: ['בשר בחלב', 'שש שעות', 'גבינה קשה'], sources: 'שו"ע יו"ד פז-פט' },
  { id: 'melicha', title: 'מליחת בשר', category: 'kashrut', summary: 'להוצאת הדם: שריה חצי שעה, מליחה במלח בינוני שעה, והדחה שלוש פעמים.', keywords: ['מליחה', 'ניקוי בשר'], sources: 'שו"ע יו"ד סט' },
  { id: 'betzim-dam', title: 'ביצים - בדיקת דם', category: 'kashrut', summary: 'ביצה שנמצא בה דם - אם נמצא בחלמון או בקשר החיבור אסורה. דם בחלבון מותר בהסרתו.', keywords: ['ביצים', 'דם בביצה'], sources: 'שו"ע יו"ד סו' },
  { id: 'bishul-akum', title: 'בישול עכו"ם', category: 'kashrut', summary: 'תבשיל שבישלו נוכרי אסור גם בכלי כשר, אם המאכל עולה על שולחן מלכים ואינו נאכל חי.', keywords: ['בישול גוי', 'בישולי עכום', 'פת עכום'], sources: 'שו"ע יו"ד קיג' },
  { id: 'pat-akum', title: 'פת עכו"ם', category: 'kashrut', summary: 'פת שנעשתה ע"י נוכרי. פת פלטר מותרת לרוב הספרדים ובמקום שאין פת ישראל.', keywords: ['פת עכום', 'פת פלטר', 'פת ישראל'], sources: 'שו"ע יו"ד קיב' },
  { id: 'chalav-akum', title: 'חלב עכו"ם', category: 'kashrut', summary: 'חלב שחלבו נוכרי בלי השגחה אסור. הגרמ"פ מתיר חלב מפוקח, החזו"א מחמיר.', keywords: ['חלב עכום', 'חלב ישראל', 'חלב מפוקח'], sources: 'שו"ע יו"ד קטו' },
  { id: 'yayin-nesech', title: 'יין נסך וסתם יינם', category: 'kashrut', summary: 'יין שנגע בו נוכרי אסור בשתיה. יין מבושל אינו נאסר במגע.', keywords: ['יין נסך', 'סתם יינם', 'יין מבושל'], sources: 'שו"ע יו"ד קכג' },
  { id: 'tolaim', title: 'תולעים במזון', category: 'kashrut', summary: 'תולעת במזון אסורה משש לאוין. חובת בדיקה בירקות עליים, קטניות ופירות יבשים.', keywords: ['תולעים', 'חרקים', 'בדיקת ירקות'], sources: 'שו"ע יו"ד פד' },
  { id: 'hagalat-kelim', title: 'הגעלת כלים', category: 'kashrut', summary: 'כלי שבלע איסור צריך הכשרה כדרך בליעתו. ליבון לאש, הגעלה לרותחים. חרס אינו יוצא.', keywords: ['הגעלה', 'ליבון', 'כשרת כלים'], sources: 'שו"ע יו"ד קכא' },
  { id: 'tevilat-kelim', title: 'טבילת כלים', category: 'kashrut', summary: 'כלי מתכת וזכוכית של אכילה שנקנו מנוכרי טעונים טבילה במקוה כשר עם ברכה.', keywords: ['טבילת כלים', 'מקוה כלים'], sources: 'שו"ע יו"ד קכ' },
  { id: 'shechita', title: 'שחיטה', category: 'kashrut', summary: 'חמש הלכות: שהייה, דרסה, חלדה, הגרמה ועיקור. הסכין צריכה בדיקה.', keywords: ['שחיטה', 'שוחט', 'סכין שחיטה'], sources: 'שו"ע יו"ד א-ז' },
  { id: 'rosh-hashana', title: 'ראש השנה', category: 'moadim', summary: 'יום הדין. תקיעת שופר ביום, אם חל בשבת אין תוקעים. מנהגי סימנים בליל החג.', keywords: ['ראש השנה', 'שופר', 'יום הדין', 'סימנים'], sources: 'שו"ע או"ח תקפא-תקצז' },
  { id: 'yom-kippur', title: 'יום כיפור', category: 'moadim', summary: 'חמשה עינויים: אכילה ושתיה, רחיצה, סיכה, נעילת הסנדל, ותשמיש המטה. אסור במלאכה.', keywords: ['יום כיפור', 'צום', 'חמשה עינויים'], sources: 'שו"ע או"ח תרז-תרכד' },
  { id: 'sukkah', title: 'סוכה', category: 'moadim', summary: 'צריכה שתי דפנות וטפח, סכך כשר מפסולת גורן ויקב. שיעור 7x7 טפחים על 10 טפחים גובה.', keywords: ['סוכה', 'סכך', 'דפנות'], sources: 'שו"ע או"ח תרכה-תרמד' },
  { id: 'arba-minim', title: 'ארבעת המינים', category: 'moadim', summary: 'לולב, הדס, ערבה ואתרוג. נוטל בידו ומברך, יום ראשון של חג. צריכים שלמים, יפים.', keywords: ['ארבעת המינים', 'לולב', 'אתרוג'], sources: 'שו"ע או"ח תרמה-תרסט' },
  { id: 'chol-hamoed', title: 'מלאכה בחול המועד', category: 'moadim', summary: 'אסור במלאכה אלא במקום הצורך: דבר האבד, צרכי המועד, מעשה הדיוט.', keywords: ['חול המועד', 'דבר האבד'], sources: 'שו"ע או"ח תקל-תקמח' },
  { id: 'chanukah', title: 'חנוכה', category: 'moadim', summary: 'מדליקים שמונה ימים, נר ביום הראשון ומוסיף והולך. זמן הדלקה משקיעה עד שתכלה רגל מן השוק.', keywords: ['חנוכה', 'נרות חנוכה', 'פרסומי ניסא'], sources: 'שו"ע או"ח תרעא-תרפד' },
  { id: 'purim', title: 'פורים', category: 'moadim', summary: 'ארבע מצוות: מקרא מגילה, משלוח מנות, מתנות לאביונים, סעודת פורים.', keywords: ['פורים', 'מגילה', 'משלוח מנות'], sources: 'שו"ע או"ח תרפה-תרצז' },
  { id: 'bedikat-chametz', title: 'בדיקת וביעור חמץ', category: 'moadim', summary: 'בודקים בליל י"ד בניסן לאור הנר. ביעור בערב פסח עד חצות. ביטול בלב ובפה.', keywords: ['בדיקת חמץ', 'ביעור', 'מכירת חמץ'], sources: 'שו"ע או"ח תלא-תמח' },
  { id: 'leil-haseder', title: 'ליל הסדר', category: 'moadim', summary: 'ארבע כוסות, מצה (כזית בכל אחת מהן), מרור, סיפור יציאת מצרים, הלל. הסבה לזכר חירות.', keywords: ['סדר פסח', 'ארבע כוסות', 'מצה', 'אפיקומן'], sources: 'שו"ע או"ח תעב-תפד' },
  { id: 'sfirat-haomer', title: 'ספירת העומר', category: 'moadim', summary: '49 יום מליל ב\' פסח. מצוה לכל גבר בערב בעמידה. שכח יום שלם - יספור בלא ברכה.', keywords: ['ספירת העומר', 'עומר', 'אבלות'], sources: 'שו"ע או"ח תפט-תצג' },
  { id: 'shavuot', title: 'שבועות', category: 'moadim', summary: 'חג מתן תורה. מנהג ללמוד כל הלילה. אוכלים מאכלי חלב. קוראים מגילת רות.', keywords: ['שבועות', 'מתן תורה', 'תיקון ליל שבועות'], sources: 'שו"ע או"ח תצד' },
  { id: 'tisha-bav', title: 'תשעה באב', category: 'moadim', summary: 'צום מבין השמשות עד צאת. חמשה עינויים כיום כיפור. דיני אבלות.', keywords: ['תשעה באב', 'ט"ב', 'תשעת הימים', 'בין המצרים'], sources: 'שו"ע או"ח תקמט-תקסא' },
  { id: 'tzomot', title: 'ארבעה צומות', category: 'moadim', summary: 'גדליה, עשרה בטבת, י"ז בתמוז, ט\' באב. צום משחר ועד צאת הכוכבים. תפילת עננו.', keywords: ['צום', 'צומות', 'עננו'], sources: 'שו"ע או"ח תקמט' },
  { id: 'krias-shema-zman', title: 'ק"ש - זמני קריאה', category: 'tefilah', summary: 'זמן ק"ש של שחרית עד סוף שעה שלישית מהנץ (מג"א), או מעלות (גר"א).', keywords: ['קריאת שמע', 'זמן קש', 'שלוש שעות'], sources: 'שו"ע או"ח נח, רלה' },
  { id: 'tefilah-bkavana', title: 'תפילה בכוונה', category: 'tefilah', summary: 'מצוה לכוון בכל התפילה, ולפחות בפסוק ראשון של שמע ובברכה ראשונה של עמידה.', keywords: ['כוונה', 'תפילה', 'אבות'], sources: 'שו"ע או"ח קא' },
  { id: 'zman-tefila', title: 'זמני התפילה', category: 'tefilah', summary: 'שחרית מהנץ עד סוף שעה רביעית. מנחה מחצי שעה אחר חצות עד שקיעה. ערבית מצאת ועד חצות.', keywords: ['זמן תפילה', 'שחרית', 'מנחה', 'ערבית'], sources: 'שו"ע או"ח פט, רלג' },
  { id: 'tachnun', title: 'מתי אומרים תחנון', category: 'tefilah', summary: 'תחנון בשחרית ומנחה. אין אומרים: שבת, יו"ט, ר"ח, חנוכה, פורים, ערב פסח, ט"ו בשבט וט"ו באב, חתן.', keywords: ['תחנון', 'נפילת אפים', 'חתן'], sources: 'שו"ע או"ח קלא' },
  { id: 'minyan', title: 'תפילה במניין', category: 'tefilah', summary: 'מצוה להתפלל במנין עשרה מישראל זכרים גדולים. דבר שבקדושה רק במנין.', keywords: ['מנין', 'עשרה', 'דבר שבקדושה'], sources: 'שו"ע או"ח צ, נה' },
  { id: 'kaddish', title: 'קדיש', category: 'tefilah', summary: 'נאמר במנין. אבל אומר קדיש על הוריו כל י"א חודש. קדיש יתום, קדיש דרבנן.', keywords: ['קדיש', 'קדיש יתום', 'אבל'], sources: 'שו"ע או"ח נה, קלב' },
  { id: 'birkat-cohanim', title: 'ברכת כהנים', category: 'tefilah', summary: 'מצוה לכהן לישא כפיו. בארץ ישראל בכל יום, בחו"ל ברוב הקהילות רק ביו"ט.', keywords: ['ברכת כהנים', 'נשיאת כפים', 'דוכן'], sources: 'שו"ע או"ח קכח' },
  { id: 'kriat-hatorah', title: 'קריאת התורה', category: 'tefilah', summary: 'קוראים בשני, חמישי, שבת, יו"ט, ר"ח, חנוכה, פורים ותעניות. צריך מנין.', keywords: ['קריאת התורה', 'עליה לתורה'], sources: 'שו"ע או"ח קלה-קמט' },
  { id: 'birkot-haraiya', title: 'ברכות הראייה', category: 'tefilah', summary: 'על מראות מיוחדים: ים גדול שהחיינו, ברקים עושה מעשה בראשית, ענקים משנה הבריות.', keywords: ['ברכות הראייה', 'ראיה'], sources: 'שו"ע או"ח רכג-רל' },
  { id: 'tefillin', title: 'תפילין', category: 'tefilah', summary: 'מצוה להניח בכל יום חוץ משבת ויו"ט. תפילין של יד ושל ראש. מניחים מבר מצוה.', keywords: ['תפילין', 'של יד', 'של ראש'], sources: 'שו"ע או"ח כה-לח' },
  { id: 'tzitzit', title: 'ציצית', category: 'tefilah', summary: 'מצות עשה לבעל בגד בן ארבע כנפות. טלית קטן מבר מצוה. תכלת לרוב הפוסקים.', keywords: ['ציצית', 'טלית', 'תכלת'], sources: 'שו"ע או"ח ח-כד' },
  { id: 'netilat-yadayim', title: 'נטילת ידיים', category: 'tefilah', summary: 'נוטלים שחרית, לסעודה (כל פת כביצה), לאחר שירותים. שיעור רביעית.', keywords: ['נטילת ידיים', 'נטלא', 'כביצה'], sources: 'שו"ע או"ח קנח-קסה' },
  { id: 'birkat-hamazon', title: 'ברכת המזון', category: 'tefilah', summary: 'מצוה מן התורה אחר אכילת פת כזית. ארבע ברכות. נשים חייבות. בשלשה - זימון.', keywords: ['ברכת המזון', 'בהמ"ז', 'ברכון'], sources: 'שו"ע או"ח קפב-קצז' },
  { id: 'zimun', title: 'ברכת הזימון - 3, 10', category: 'tefilah', summary: 'אכלו שלושה כאחד - חייבים בזימון. בעשרה מזכירים שם שמים ("נברך אלקינו").', keywords: ['זימון', 'שלשה', 'עשרה'], sources: 'שו"ע או"ח קצב-קצט' },
  { id: 'shehakol-haetz', title: 'ברכות הנהנין', category: 'tefilah', summary: 'פת - המוציא, מזונות, גפן, עץ, אדמה, שהכל. ברכה אחרונה: על המחיה, על הגפן, על העץ, בורא נפשות.', keywords: ['ברכות הנהנין', 'מזונות', 'שהכל'], sources: 'שו"ע או"ח רב-רכט' },
  { id: 'shehecheyanu', title: 'שהחיינו', category: 'tefilah', summary: 'ברכים על פרי חדש, בגד חדש, מצוה הבאה מזמן לזמן. לקרוב משפחה ועל בשורות טובות.', keywords: ['שהחיינו', 'ברכת הזמן', 'פרי חדש'], sources: 'שו"ע או"ח רכה' },
  { id: '13-ikarim', title: 'שלוש עשרה עיקרים', category: 'tefilah', summary: 'עיקרי האמונה של הרמב"ם. מציאות הבורא, אחדותו, נבואה, תורה, גמול, גאולה, ותחיית המתים.', keywords: ['יג עיקרים', 'אני מאמין', 'עיקרי האמונה'], sources: 'רמב"ם פיהמ"ש סנהדרין פרק י' },
  { id: 'kiddush-levana', title: 'קידוש לבנה', category: 'tefilah', summary: 'ברכים על הלבנה משלשה ימים אחר המולד עד ט"ו (או י"ד שעות לפני). בחוץ, מול הלבנה, במנין.', keywords: ['קידוש לבנה', 'ברכת הלבנה'], sources: 'שו"ע או"ח תכו' },
  { id: 'yichud', title: 'ייחוד', category: 'family', summary: 'אסור לאיש להתייחד עם אישה אחת זרה. עם שתי נשים - מותר במקצת מצבים.', keywords: ['יחוד', 'ייחוד', 'התייחדות'], sources: 'שו"ע אבה"ע כב' },
  { id: 'negiya', title: 'נגיעה בעריות', category: 'family', summary: 'אסור מן התורה לקרב לאישה ערוה דרך חיבה. גם נגיעה בלא חיבה אסורה מדרבנן.', keywords: ['נגיעה', 'שומר נגיעה'], sources: 'שו"ע אבה"ע כא' },
  { id: 'tznius', title: 'צניעות', category: 'family', summary: 'אישה נשואה - כיסוי ראש. חיוב לכסות מרפק, ברך, וקנה הרגל.', keywords: ['צניעות', 'כיסוי ראש', 'פיאה'], sources: 'שו"ע אבה"ע כא' },
  { id: 'nida', title: 'נידה', category: 'family', summary: 'אישה שראתה דם - אסורה בנגיעה ובתשמיש עד לטבילה. מינימום שבעה נקיים אחר ראיית הדם.', keywords: ['נדה', 'נידה', 'שבעה נקיים', 'טבילה'], sources: 'שו"ע יו"ד קפג' },
  { id: 'kidushin', title: 'קידושין', category: 'family', summary: 'האישה נקנית בכסף, שטר, או ביאה. צריך עדים כשרים. ברכת אירוסין ונישואין.', keywords: ['קידושין', 'אירוסין', 'טבעת', 'חופה'], sources: 'שו"ע אבה"ע כו-לד' },
  { id: 'ketubah', title: 'כתובה', category: 'family', summary: 'מסמך חיוב הבעל לאשתו - 200 זוז לבתולה, 100 לאלמנה ולגרושה. תוספת כתובה.', keywords: ['כתובה', 'מאתיים זוז'], sources: 'שו"ע אבה"ע סו-סט' },
  { id: 'gerushin', title: 'גירושין', category: 'family', summary: 'גט פיטורין - כתב כריתות לאישה. סופר ועדים מומחים. צריך בית דין.', keywords: ['גירושין', 'גט', 'סירוב'], sources: 'שו"ע אבה"ע קיט-קנד' },
  { id: 'kibud-horim', title: 'כיבוד אב ואם', category: 'family', summary: 'כיבוד במעשה: מאכיל ומשקה ומלביש. ומורא: לא לעמוד במקומו, לא לסתור דבריו.', keywords: ['כיבוד הורים', 'מורא הורים'], sources: 'שו"ע יו"ד רמ' },
  { id: 'shmita', title: 'שמיטה', category: 'mitzvot-haaretz', summary: 'השנה השביעית - שביתת הארץ. יבול ישראל קדוש בקדושת שביעית.', keywords: ['שמיטה', 'שביעית', 'היתר מכירה', 'אוצר בית דין'], sources: 'שו"ע יו"ד שלא' },
  { id: 'orla', title: 'ערלה', category: 'mitzvot-haaretz', summary: 'פירות שלוש שנים ראשונות אסורים בארץ ובחו"ל. גוש: שתל בגוש 1.7 ליטר.', keywords: ['ערלה', 'שלש שנים', 'גוש שתילה'], sources: 'שו"ע יו"ד רצד' },
  { id: 'trumot-maasrot', title: 'תרומות ומעשרות', category: 'mitzvot-haaretz', summary: 'אחר גמר מלאכה: תרומה גדולה, מעשר ראשון, תרומת מעשר, מעשר שני או עני.', keywords: ['תרומות ומעשרות', 'מעשר', 'תרומה'], sources: 'שו"ע יו"ד שלא' },
  { id: 'challah', title: 'הפרשת חלה', category: 'mitzvot-haaretz', summary: 'מ-1.2 ק"ג קמח מפרישים בלא ברכה. מ-1.66 ק"ג בברכה. שורפים את החלה.', keywords: ['חלה', 'הפרשת חלה', 'שיעור חלה'], sources: 'שו"ע יו"ד שכד' },
  { id: 'kilayim', title: 'כלאיים', category: 'mitzvot-haaretz', summary: 'אסור להרכיב ולזרוע מינים שונים. כלאי הכרם - חרצן, חיטה ושעורה. כלאי בגדים - שעטנז.', keywords: ['כלאיים', 'שעטנז', 'כלאי הכרם', 'הרכבה'], sources: 'שו"ע יו"ד רצה-שב' },
  { id: 'neta-revai', title: 'נטע רבעי', category: 'mitzvot-haaretz', summary: 'פירות שנה רביעית. בארץ עולים לירושלים או נפדים על פרוטה. בחו"ל פודין בלא ברכה.', keywords: ['נטע רבעי', 'רבעי', 'פדיון רבעי'], sources: 'שו"ע יו"ד רצד, ז' },
  { id: 'aninut', title: 'אנינות', category: 'aveilut', summary: 'אונן - שמתו מוטל לפניו ועליו לקוברו. פטור מכל המצוות.', keywords: ['אנינות', 'אונן'], sources: 'שו"ע יו"ד שמא' },
  { id: 'kria', title: 'קריעה', category: 'aveilut', summary: 'על שבעה קרובים. אב ואם - בצד שמאל ולא מאחה. שאר קרובים - צד ימין ומאחה.', keywords: ['קריעה', 'קרע על המת'], sources: 'שו"ע יו"ד שמ' },
  { id: 'shiva', title: 'שבעת ימי אבלות', category: 'aveilut', summary: 'מקבורה. אבלות חמורה - אסור במלאכה, רחיצה, סיכה, נעילת הסנדל, תשמיש, ת"ת.', keywords: ['שבעה', 'אבל', 'בית האבל'], sources: 'שו"ע יו"ד שעה-שצג' },
  { id: 'shloshim', title: 'שלשים יום', category: 'aveilut', summary: 'אבלות עד 30 יום. אסור בתספורת, גיהוץ, חתונה. על הורים - 12 חודש.', keywords: ['שלושים', 'שנים עשר חודש'], sources: 'שו"ע יו"ד שצא-תג' },
  { id: 'yahrzeit', title: 'יום השנה', category: 'aveilut', summary: 'ביום פטירת ההורים - תענית, קדיש, עליה לתורה, הדלקת נר.', keywords: ['יארצייט', 'יום השנה', 'אזכרה'], sources: 'שו"ע יו"ד תב, יב' },
  { id: 'kohen-tuma', title: 'טומאת כהנים', category: 'aveilut', summary: 'כהן אסור להיטמא למת אלא לשבעה קרובים. אסור להיכנס לבית קברות.', keywords: ['כהן', 'טומאה', 'בית קברות'], sources: 'שו"ע יו"ד שסט-שעד' },
  { id: 'shiur-kzayit', title: 'שיעור כזית', category: 'misc', summary: 'שיעור אכילה. רוב הפוסקים: 27-30 גרם. החזו"א: 50.', keywords: ['כזית', 'שיעור', '27 גרם'], sources: 'שו"ע או"ח תפו' },
  { id: 'shiur-reviit', title: 'שיעור רביעית', category: 'misc', summary: 'הגר"ח נאה: 86 מ"ל. החזו"א: 150 מ"ל.', keywords: ['רביעית', 'שיעור שתיה'], sources: 'שו"ע או"ח רעא' },
  { id: 'neder-shvua', title: 'נדרים ושבועות', category: 'misc', summary: 'נדר אוסר חפץ עליו. שבועה אוסרת אותו ממעשה. ביטול ע"י התרת חכם. "בלי נדר" למניעה.', keywords: ['נדרים', 'שבועות', 'התרת נדרים', 'בלי נדר'], sources: 'שו"ע יו"ד רג-רלט' },
  { id: 'tzedaka', title: 'צדקה', category: 'misc', summary: 'מצוה לתת לעני. שיעור: חומש מהונו מצוה מן המובחר, מעשר בינוני.', keywords: ['צדקה', 'מעשר כספים', 'חומש'], sources: 'שו"ע יו"ד רמז-רנט' },
  { id: 'lashon-hara', title: 'לשון הרע', category: 'misc', summary: 'איסור לדבר בגנות הזולת אף אם אמת. רכילות - לספר מה שאמר עליו. הותר לתועלת בתנאים.', keywords: ['לשון הרע', 'רכילות', 'חפץ חיים'], sources: 'ספר חפץ חיים' },
  { id: 'talmud-torah', title: 'תלמוד תורה', category: 'misc', summary: 'מצוה כל יום ולילה לפי כוחו. הת"ת כנגד כולם. ביטול תורה - חמור.', keywords: ['תלמוד תורה', 'לימוד תורה'], sources: 'שו"ע יו"ד רמו' },
  { id: 'mezuzah', title: 'מזוזה', category: 'misc', summary: 'בכל פתח של בית קבוע. בצד ימין לכניסה, בשליש העליון, באלכסון.', keywords: ['מזוזה', 'פתח'], sources: 'שו"ע יו"ד רפה-רצא' },
  { id: 'brit-mila', title: 'ברית מילה', category: 'misc', summary: 'ביום השמיני. דוחה שבת בזמנה אם הוולד בריא. צהבת או חולשה - דוחים.', keywords: ['ברית מילה', 'מילה', 'מוהל'], sources: 'שו"ע יו"ד רס-רסו' },
  { id: 'pidyon-haben', title: 'פדיון הבן', category: 'misc', summary: 'בכור לאמו ביום ה-31. פודים בחמישה סלעי כסף לכהן.', keywords: ['פדיון הבן', 'בכור', 'ה סלעים'], sources: 'שו"ע יו"ד שה' },
  { id: 'ribit', title: 'ריבית', category: 'misc', summary: 'איסור הלוואה בריבית מישראל לישראל. גם אבק ריבית מדרבנן אסור. היתר עסקה.', keywords: ['ריבית', 'אבק ריבית', 'היתר עסקה'], sources: 'שו"ע יו"ד קנט-קעז' },
  { id: 'rosh-chodesh', title: 'ראש חודש', category: 'moadim', summary: 'יעלה ויבוא בתפילה ובהמ"ז. חצי הלל. מוסף. נשים פטורות ממלאכות. סעודה קלה.', keywords: ['ראש חודש', 'יעלה ויבוא', 'חצי הלל'], sources: 'שו"ע או"ח תיז-תכז' },
  */
];

/** Lightweight fuzzy search: matches keywords + title + summary substring. */
export function searchHalacha(query: string): HalachaTopic[] {
  const q = query.trim().toLowerCase().replace(/[֑-ׇ]/g, ''); // strip nikud
  if (!q) return HALACHA_INDEX;
  return HALACHA_INDEX.filter((t) => {
    const hay =
      [t.title, t.summary, ...t.keywords].join(' ').toLowerCase().replace(/[֑-ׇ]/g, '');
    return hay.includes(q);
  });
}
