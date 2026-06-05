export type BrachaEntry = {
  id: string;
  category: string;
  trigger: string;
  examples?: string[];
  before?: string;
  after?: string;
  notes?: string;
};

const HAMOTZI = 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמּוֹצִיא לֶחֶם מִן הָאָרֶץ.';
const MEZONOT = 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא מִינֵי מְזוֹנוֹת.';
const GEFEN = 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.';
const ETZ = 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הָעֵץ.';
const ADAMA = 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הָאֲדָמָה.';
const SHEHAKOL = 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהַכֹּל נִהְיֶה בִּדְבָרוֹ.';
const NEFASHOT = 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא נְפָשׁוֹת רַבּוֹת וְחֶסְרוֹנָן, עַל כָּל מַה שֶּׁבָּרָאתָ לְהַחֲיוֹת בָּהֶם נֶפֶשׁ כָּל חָי, בָּרוּךְ חֵי הָעוֹלָמִים.';
const AL_HAMICHYA = 'על המחיה (מעין שלוש)';
const AL_HAETZ = 'על העץ ועל פרי העץ (מעין שלוש - על 7 המינים מהארץ)';
const AL_HAGEFEN = 'על הגפן ועל פרי הגפן (מעין שלוש)';

export const BRACHOT_HANEHENIN: BrachaEntry[] = [
  // -------- פת --------
  { id: 'bread', category: 'פת', trigger: 'לחם, פיתה, חלה, לחמניות', before: HAMOTZI, after: 'ברכת המזון מלאה (4 ברכות)', notes: 'נטילת ידיים בברכה לפני - "על נטילת ידיים". אכילה ב-2 ידיים, ממליחים את הפת.' },
  { id: 'matza', category: 'פת', trigger: 'מצה (אחרי פסח, או בפסח)', before: HAMOTZI, after: 'ברכת המזון' },
  { id: 'pat-kisnin', category: 'פת/מזונות', trigger: 'פת הבאה בכיסנין (מאפים מתוקים)', examples: ['בורקס', 'דניש', 'עוגיות חלב', 'פיצה', 'קרואסון'], before: MEZONOT, after: AL_HAMICHYA, notes: 'אם קובע סעודה (אוכל יותר משיעור 4 ביצים ≈ 240 גרם) - הופך לפת ומברך המוציא + ברכת המזון.' },

  // -------- מזונות --------
  { id: 'cake', category: 'מאפים', trigger: 'עוגות', examples: ['עוגת שמרים', 'עוגת שמן', 'עוגת גבינה', 'עוגת שוקולד'], before: MEZONOT, after: AL_HAMICHYA },
  { id: 'cookies', category: 'מאפים', trigger: 'עוגיות', examples: ['בייגלה רך', 'עוגיות', 'מאפינס'], before: MEZONOT, after: AL_HAMICHYA },
  { id: 'pasta', category: 'דגן', trigger: 'פסטה', examples: ['ספגטי', 'פנה', 'מקרוני', 'אטריות'], before: MEZONOT, after: AL_HAMICHYA, notes: 'ראויה לסעודה - יש מחמירים שצריך פת.' },
  { id: 'rice', category: 'דגן', trigger: 'אורז', before: MEZONOT, after: NEFASHOT, notes: 'אורז לבן/חום - מזונות (מנהג רוב הפוסקים). יש מקילים בורא פרי האדמה.' },
  { id: 'oats', category: 'דגן', trigger: 'שיבולת שועל (קוואקר)', before: MEZONOT, after: AL_HAMICHYA },
  { id: 'cereal', category: 'דגן', trigger: 'קורנפלקס וקאפים', examples: ['קורנפלקס', 'צ\'יריוס', 'גרנולה'], before: MEZONOT, after: AL_HAMICHYA, notes: 'אם רוב המוצר מחיטה/שעורה/שיפון/שיבולת שועל. אם רוב תירס - שהכל.' },
  { id: 'couscous', category: 'דגן', trigger: 'קוסקוס, בורגול, פרקעך', before: MEZONOT, after: AL_HAMICHYA },
  { id: 'pancakes', category: 'מאפים', trigger: 'פנקייק, וופלים, חביתות מקמח', before: MEZONOT, after: AL_HAMICHYA },
  { id: 'pizza', category: 'מאפים', trigger: 'פיצה', before: MEZONOT, after: AL_HAMICHYA, notes: 'אם רוצים סעודה מלאה (3 חתיכות גדולות) - מומלץ ליטול ידיים ולברך המוציא.' },

  // -------- גפן --------
  { id: 'wine', category: 'משקה', trigger: 'יין', examples: ['יין אדום', 'יין לבן', 'יין מקושטא'], before: GEFEN, after: AL_HAGEFEN, notes: 'רביעית (86 מ"ל) - מברכים אחרי. פחות - בורא נפשות.' },
  { id: 'grape-juice', category: 'משקה', trigger: 'מיץ ענבים טבעי', before: GEFEN, after: AL_HAGEFEN, notes: 'רק אם זה מיץ ענבים אמיתי (לא משקה ענבים מתועש שהוא בעיקר מים).' },

  // -------- בורא פרי העץ --------
  { id: 'apple', category: 'פרי עץ', trigger: 'תפוח', before: ETZ, after: NEFASHOT },
  { id: 'pear', category: 'פרי עץ', trigger: 'אגס', before: ETZ, after: NEFASHOT },
  { id: 'orange', category: 'פרי עץ', trigger: 'תפוז', before: ETZ, after: NEFASHOT, notes: 'אם אוכל קליפה - היא בורא פרי האדמה.' },
  { id: 'lemon', category: 'פרי עץ', trigger: 'לימון, אשכולית', before: ETZ, after: NEFASHOT, notes: 'מיץ לימון בפני עצמו - שהכל.' },
  { id: 'mango', category: 'פרי עץ', trigger: 'מנגו, פפאיה, ליצ\'י', before: ETZ, after: NEFASHOT },
  { id: 'plum', category: 'פרי עץ', trigger: 'שזיף, אפרסק, נקטרינה, משמש', before: ETZ, after: NEFASHOT },
  { id: 'cherry', category: 'פרי עץ', trigger: 'דובדבן, גודג\'י', before: ETZ, after: NEFASHOT },
  { id: 'kiwi', category: 'פרי עץ', trigger: 'קיווי', before: ETZ, after: NEFASHOT },
  { id: 'persimmon', category: 'פרי עץ', trigger: 'אפרסמון', before: ETZ, after: NEFASHOT },
  { id: 'avocado', category: 'פרי עץ', trigger: 'אבוקדו', before: ETZ, after: NEFASHOT, notes: 'גם נחשב פרי עץ אף שאינו מתוק. יש מקילים אדמה.' },
  { id: 'nuts', category: 'פרי עץ', trigger: 'אגוזים, שקדים, פיסטוקים, קשיו, מקדמיה, פקאן', before: ETZ, after: NEFASHOT, notes: 'בוטנים - אדמה (קטניות).' },

  // 7 המינים
  { id: 'olive', category: '7 המינים', trigger: 'זית', before: ETZ, after: AL_HAETZ, notes: 'זית בפני עצמו (לא בשמן). שמן זית בפני עצמו - שהכל.' },
  { id: 'date', category: '7 המינים', trigger: 'תמר', before: ETZ, after: AL_HAETZ, notes: 'דבש מתמרים - שהכל.' },
  { id: 'grape', category: '7 המינים', trigger: 'ענבים בעין', before: ETZ, after: AL_HAETZ, notes: 'אם אוכל ענבים - העץ. אם שותה יין/מיץ ענבים - הגפן.' },
  { id: 'fig', category: '7 המינים', trigger: 'תאנה (טריה / מיובשת)', before: ETZ, after: AL_HAETZ },
  { id: 'pomegranate', category: '7 המינים', trigger: 'רימון, מיץ רימונים', before: ETZ, after: AL_HAETZ, notes: 'מיץ רימונים סחוט טרי - שהכל. רימון בעין - העץ.' },

  // -------- בורא פרי האדמה --------
  { id: 'tomato', category: 'ירק', trigger: 'עגבניה', before: ADAMA, after: NEFASHOT },
  { id: 'cucumber', category: 'ירק', trigger: 'מלפפון', before: ADAMA, after: NEFASHOT },
  { id: 'pepper', category: 'ירק', trigger: 'פלפל (אדום/ירוק/צהוב)', before: ADAMA, after: NEFASHOT },
  { id: 'lettuce', category: 'ירק', trigger: 'חסה', before: ADAMA, after: NEFASHOT, notes: 'הקפד על בדיקת חרקים יסודית.' },
  { id: 'cabbage', category: 'ירק', trigger: 'כרוב, כרובית, ברוקולי', before: ADAMA, after: NEFASHOT, notes: 'דורש בדיקת חרקים יסודית.' },
  { id: 'eggplant', category: 'ירק', trigger: 'חציל, קישוא, דלעת', before: ADAMA, after: NEFASHOT },
  { id: 'carrot', category: 'ירק', trigger: 'גזר, סלק, צנון, צנונית', before: ADAMA, after: NEFASHOT },
  { id: 'potato', category: 'ירק', trigger: 'תפוח אדמה, בטטה', before: ADAMA, after: NEFASHOT, notes: 'תפוחי אדמה מטוגנים / אפויים - אדמה.' },
  { id: 'onion', category: 'ירק', trigger: 'בצל, שום, כרשה', before: ADAMA, after: NEFASHOT },
  { id: 'green-leaves', category: 'ירק', trigger: 'פטרוזיליה, כוסברה, נענע, שמיר, רוקט', before: ADAMA, after: NEFASHOT, notes: 'דורש בדיקת חרקים.' },
  { id: 'banana', category: 'ירק', trigger: 'בננה', before: ADAMA, after: NEFASHOT, notes: 'בננה - לא נחשבת עץ הלכתית, כי הגזע אינו מתקיים משנה לשנה.' },
  { id: 'strawberry', category: 'ירק', trigger: 'תות שדה', before: ADAMA, after: NEFASHOT },
  { id: 'pineapple', category: 'ירק', trigger: 'אננס', before: ADAMA, after: NEFASHOT },
  { id: 'watermelon', category: 'ירק', trigger: 'אבטיח, מלון', before: ADAMA, after: NEFASHOT },
  { id: 'wheat-grain', category: '7 המינים', trigger: 'חיטה ושעורה בעין (לא מאפים)', before: ADAMA, after: NEFASHOT, notes: 'כשבישלה לחלוטין ונשתנה צורתה - מזונות.' },
  { id: 'corn', category: 'דגן', trigger: 'תירס', before: ADAMA, after: NEFASHOT, notes: 'תירס חם בקלח. פופקורן - אדמה. קורנפלקס - מזונות.' },
  { id: 'mushroom', category: 'אחר', trigger: 'פטריות', before: SHEHAKOL, after: NEFASHOT, notes: 'פטריות אינן ירק - אינן צומחות מהאדמה אלא מתפטרות. לכן שהכל.' },
  { id: 'legumes', category: 'קטניות', trigger: 'שעועית, אפונה, עדשים, חומוס, בוטנים', before: ADAMA, after: NEFASHOT, notes: 'אם נטחנו לתבשיל סמיך (כמו פלאפל) - אדמה.' },

  // -------- שהכל --------
  { id: 'meat', category: 'בשר', trigger: 'בשר בקר, עוף, כבש', before: SHEHAKOL, after: NEFASHOT, notes: 'גם בשר עוף ועוף הים.' },
  { id: 'fish', category: 'דגים', trigger: 'דגים', examples: ['סלמון', 'אמנון', 'הרינג', 'טונה'], before: SHEHAKOL, after: NEFASHOT },
  { id: 'eggs', category: 'ביצים', trigger: 'ביצים בכל אופן', before: SHEHAKOL, after: NEFASHOT },
  { id: 'dairy', category: 'חלב', trigger: 'חלב, חמאה, גבינה, יוגורט, שמנת', before: SHEHAKOL, after: NEFASHOT },
  { id: 'water', category: 'משקה', trigger: 'מים', before: SHEHAKOL, after: NEFASHOT, notes: 'רק אם שותה לצימאון. שותה לטעם - לא מברך.' },
  { id: 'soft-drinks', category: 'משקה', trigger: 'משקאות קלים', examples: ['קולה', 'סודה', 'מיצים'], before: SHEHAKOL, after: NEFASHOT },
  { id: 'coffee', category: 'משקה', trigger: 'קפה, תה, נס קפה', before: SHEHAKOL, after: NEFASHOT, notes: 'תה צמחים (כמו נענע / ירוק) - שהכל.' },
  { id: 'fruit-juice', category: 'משקה', trigger: 'מיץ פירות / ירקות סחוט', before: SHEHAKOL, after: NEFASHOT, notes: 'אפילו מיץ תפוז סחוט טרי - שהכל (לא בורא פרי העץ).' },
  { id: 'beer', category: 'משקה', trigger: 'בירה, ליקרים, יין שרף', before: SHEHAKOL, after: NEFASHOT, notes: 'יין מזוקק (וודקה, ויסקי) - שהכל.' },
  { id: 'chocolate', category: 'ממתקים', trigger: 'שוקולד, סוכריות, מרציפן', before: SHEHAKOL, after: NEFASHOT },
  { id: 'icecream', category: 'ממתקים', trigger: 'גלידה, ארטיק, פופסיקל', before: SHEHAKOL, after: NEFASHOT, notes: 'גלידה עם וופל - אם הוופל מהותי - יש שמברכים גם מזונות. רוב הפוסקים: שהכל בלבד.' },
  { id: 'sugar', category: 'ממתקים', trigger: 'סוכר, דבש, סירופ', before: SHEHAKOL, after: NEFASHOT },
  { id: 'oil', category: 'תבלין', trigger: 'שמן זית / חמניות / קנולה (לבד)', before: SHEHAKOL, after: NEFASHOT, notes: 'שמן זית לבד - שהכל (לא העץ, כי לא טעם הזית בעין).' },
  { id: 'salt', category: 'תבלין', trigger: 'מלח, פלפל, בשמים', before: SHEHAKOL, after: NEFASHOT, notes: 'בדרך כלל אינו מצריך ברכה (לא נאכל לבד).' },
  { id: 'vinegar', category: 'תבלין', trigger: 'חומץ', before: SHEHAKOL, after: NEFASHOT, notes: 'אינו מצריך ברכה אם משתמש כתבלין. חומץ לבד (לרפואה) - שהכל.' },

  // ============== הרחבה - פירות נוספים ==============
  { id: 'apricot-dried', category: 'פרי עץ', trigger: 'משמש מיובש', before: ETZ, after: NEFASHOT },
  { id: 'raisin', category: 'פרי עץ', trigger: 'צימוקים', before: ETZ, after: NEFASHOT, notes: 'צימוקים נחשבים פרי - לא משנה את הברכה.' },
  { id: 'prune', category: 'פרי עץ', trigger: 'שזיף מיובש, חמוציות', before: ETZ, after: NEFASHOT },
  { id: 'guava', category: 'פרי עץ', trigger: 'גויאבה, מנגוסטין, רמבוטן', before: ETZ, after: NEFASHOT },
  { id: 'tropical', category: 'פרי עץ', trigger: 'פסיפלורה, דרגון פרוט (פרי הדרקון)', before: ETZ, after: NEFASHOT },
  { id: 'kumquat', category: 'פרי עץ', trigger: 'קומקווט (מנדרינה קטנה)', before: ETZ, after: NEFASHOT, notes: 'אוכלים עם הקליפה.' },
  { id: 'tangerine', category: 'פרי עץ', trigger: 'מנדרינה, קלמנטינה', before: ETZ, after: NEFASHOT },
  { id: 'grapefruit', category: 'פרי עץ', trigger: 'אשכולית, פומלית', before: ETZ, after: NEFASHOT },
  { id: 'starfruit', category: 'פרי עץ', trigger: 'פרי כוכב (carambola)', before: ETZ, after: NEFASHOT },
  { id: 'durian', category: 'פרי עץ', trigger: 'דוריאן', before: ETZ, after: NEFASHOT },
  { id: 'jackfruit', category: 'פרי עץ', trigger: "ג'אקפרוט", before: ETZ, after: NEFASHOT },
  { id: 'pomelo', category: 'פרי עץ', trigger: 'פומלה', before: ETZ, after: NEFASHOT },
  { id: 'coconut', category: 'פרי עץ', trigger: 'קוקוס (פנים), חלב קוקוס', before: ETZ, after: NEFASHOT, notes: 'חלב קוקוס סחוט - שהכל.' },
  { id: 'sabra', category: 'פרי עץ', trigger: 'צבר (פרי קקטוס)', before: ETZ, after: NEFASHOT },
  { id: 'mulberry', category: 'פרי עץ', trigger: 'תות עץ', before: ETZ, after: NEFASHOT, notes: 'תות שדה - אדמה. תות עץ - העץ.' },
  { id: 'cranberry', category: 'פרי עץ', trigger: 'חמוציות (Cranberry)', before: ETZ, after: NEFASHOT },
  { id: 'blueberry', category: 'פרי עץ', trigger: 'אוכמניות, פטל, פטל שחור', before: ETZ, after: NEFASHOT },

  // ============== ירקות נוספים ==============
  { id: 'celery', category: 'ירק', trigger: 'סלרי, פנקיולי, כרוב סיני', before: ADAMA, after: NEFASHOT },
  { id: 'asparagus', category: 'ירק', trigger: 'אספרגוס, ארטישוק, קולורבי', before: ADAMA, after: NEFASHOT },
  { id: 'spinach', category: 'ירק', trigger: 'תרד, מנגולד, חסת בוסטון', before: ADAMA, after: NEFASHOT, notes: 'דורש בדיקת חרקים יסודית.' },
  { id: 'okra', category: 'ירק', trigger: 'במיה', before: ADAMA, after: NEFASHOT },
  { id: 'beetroot', category: 'ירק', trigger: 'סלק (כל הצבעים), לפת', before: ADAMA, after: NEFASHOT },
  { id: 'sweet-potato', category: 'ירק', trigger: 'בטטה, מניוק (קסבה), ימה', before: ADAMA, after: NEFASHOT },
  { id: 'ginger', category: 'ירק', trigger: 'זנגביל (ג׳ינג׳ר), כורכום טרי', before: ADAMA, after: NEFASHOT, notes: 'תה ג׳ינג׳ר - שהכל.' },
  { id: 'lemongrass', category: 'ירק', trigger: 'למון גראס', before: ADAMA, after: NEFASHOT },
  { id: 'radish-sprouts', category: 'ירק', trigger: 'נבטים (אלפלפא, צנון)', before: ADAMA, after: NEFASHOT, notes: 'דורש בדיקת חרקים.' },
  { id: 'cauliflower-broccoli', category: 'ירק', trigger: 'פרגוסט, ברוקולי סגול, רומנסקו', before: ADAMA, after: NEFASHOT, notes: 'דורש בדיקת חרקים יסודית.' },
  { id: 'pumpkin-seeds', category: 'ירק', trigger: 'גרעיני דלעת, חמניות, פשתן', before: ADAMA, after: NEFASHOT },
  { id: 'tofu', category: 'קטניות', trigger: 'טופו, חלב סויה', before: SHEHAKOL, after: NEFASHOT, notes: 'מעובד מאד - שהכל. רק אם בעין כפול סויה - אדמה.' },

  // ============== ארוחות מורכבות ==============
  { id: 'salad', category: 'תבשיל', trigger: 'סלט ירקות מעורב', before: ADAMA, after: NEFASHOT, notes: 'הרוב ירקות אדמה. אם רוב הסלט פרי עץ - העץ.' },
  { id: 'fruit-salad', category: 'תבשיל', trigger: 'סלט פירות', before: ETZ, after: NEFASHOT, notes: 'אם רוב הפירות פרי עץ - העץ. אם רוב פרי אדמה - אדמה. בורא נפשות לסיום.' },
  { id: 'hummus', category: 'תבשיל', trigger: 'חומוס (מוצר מוכן), טחינה', before: ADAMA, after: NEFASHOT, notes: 'חומוס/טחינה מעובדים - הירק הטמון.' },
  { id: 'falafel', category: 'תבשיל', trigger: 'פלאפל (כדורי), שניצל סויה', before: ADAMA, after: NEFASHOT },
  { id: 'shakshuka', category: 'תבשיל', trigger: 'שקשוקה (ביצים בעגבניות)', before: SHEHAKOL, after: NEFASHOT, notes: 'הברכה הולכת אחרי העיקר - בדרך כלל הביצה - שהכל.' },
  { id: 'soup', category: 'תבשיל', trigger: 'מרק (ירקות / עוף / גריסים)', before: SHEHAKOL, after: NEFASHOT, notes: 'בדרך כלל שהכל - מים והרבה דברים מעורבבים.' },
  { id: 'sushi', category: 'תבשיל', trigger: 'סושי, אורז עם דגים', before: MEZONOT, after: AL_HAMICHYA, notes: 'העיקר הוא האורז = מזונות. אם אוכל את הדג בנפרד - שהכל.' },
  { id: 'sandwich', category: 'תבשיל', trigger: 'סנדוויץ׳ (לחם + מילוי)', before: HAMOTZI, after: 'ברכת המזון', notes: 'הברכה על הלחם פוטרת את המילוי.' },
  { id: 'shawarma', category: 'תבשיל', trigger: 'שווארמה, קבב, גריל בשר', before: SHEHAKOL, after: NEFASHOT, notes: 'אם בפיתה - מוסיף ברכת המוציא על הפיתה.' },
  { id: 'pita-fillings', category: 'תבשיל', trigger: 'פיתה ממולאת (חומוס/פלאפל)', before: HAMOTZI, after: 'ברכת המזון', notes: 'הברכה על הפיתה (כפת) פוטרת את המילוי. אם הפיתה מעט מאד - יש מקילים מזונות.' },
  { id: 'lasagna', category: 'תבשיל', trigger: 'לזניה, פסטה ברוטב', before: MEZONOT, after: AL_HAMICHYA, notes: 'אם הפסטה היא העיקר. אם הבשר/גבינה רבים יותר - שהכל.' },
  { id: 'rice-dish', category: 'תבשיל', trigger: 'אורז עם ירקות / בשר', before: MEZONOT, after: NEFASHOT, notes: 'אם האורז הוא העיקר - מזונות. שאר הדברים נפטרים בברכה זו.' },

  // ============== ממתקים וחטיפים ==============
  { id: 'halva', category: 'ממתקים', trigger: 'חלווה (טחינה מתוקה)', before: SHEHAKOL, after: NEFASHOT },
  { id: 'baklava', category: 'מאפים', trigger: 'בקלאווה, רוגלך, סופלגניות', before: MEZONOT, after: AL_HAMICHYA, notes: 'מאפים על בסיס בצק. סופגנייה מטוגנת - מזונות.' },
  { id: 'wafers', category: 'מאפים', trigger: 'וופלים, ביסקוויטים', before: MEZONOT, after: AL_HAMICHYA },
  { id: 'pretzels', category: 'מאפים', trigger: 'בייגלה (קשה), פיצוחים מקמח', before: MEZONOT, after: AL_HAMICHYA },
  { id: 'rice-cake', category: 'מאפים', trigger: 'פריכיות אורז', before: MEZONOT, after: NEFASHOT, notes: 'בורא נפשות - אורז מנופח לא מקבל ברכת מעין שלוש.' },
  { id: 'popcorn', category: 'דגן', trigger: 'פופקורן (תירס מנופח)', before: ADAMA, after: NEFASHOT, notes: 'תירס - אדמה (לא דגן הלכתית).' },
  { id: 'chips', category: 'מאפים', trigger: "צ׳יפס, ביסלי, במבה", before: ADAMA, after: NEFASHOT, notes: 'בייסס תפוח אדמה - אדמה. ביסלי / במבה מבוטנים/תירס - אדמה. במבה משוקולד - שהכל.' },
  { id: 'pringles', category: 'מאפים', trigger: 'פרינגלס (תפוצ"א משוחזר)', before: SHEHAKOL, after: NEFASHOT, notes: 'מעובד מאד - שהכל, לא אדמה.' },
  { id: 'gum', category: 'ממתקים', trigger: 'מסטיק', before: SHEHAKOL, after: 'אין ברכה אחרונה', notes: 'אין ברכה אחרונה כי לא נכנס לקיבה.' },
  { id: 'cotton-candy', category: 'ממתקים', trigger: 'צמר גפן מתוק, סוכר על מקל', before: SHEHAKOL, after: NEFASHOT },

  // ============== משקאות ==============
  { id: 'milk-shake', category: 'משקה', trigger: 'שייק חלב, מילקשייק', before: SHEHAKOL, after: NEFASHOT },
  { id: 'energy', category: 'משקה', trigger: 'משקה אנרגיה (רד בול וכו׳)', before: SHEHAKOL, after: NEFASHOT },
  { id: 'kombucha', category: 'משקה', trigger: 'קומבוצ׳ה, קווס', before: SHEHAKOL, after: NEFASHOT },
  { id: 'iced-tea', category: 'משקה', trigger: 'תה קר, תה צמחים', before: SHEHAKOL, after: NEFASHOT },
  { id: 'mojito', category: 'משקה', trigger: 'קוקטיילים (מוחיטו, מרגריטה)', before: SHEHAKOL, after: NEFASHOT, notes: 'אם רוב הקוקטייל יין - הגפן.' },
  { id: 'coconut-water', category: 'משקה', trigger: 'מי קוקוס', before: SHEHAKOL, after: NEFASHOT },
  { id: 'soy-milk', category: 'משקה', trigger: 'חלב סויה, חלב שקדים, חלב שיבולת שועל', before: SHEHAKOL, after: NEFASHOT },

  // ============== מוצרי חלב ==============
  { id: 'yogurt', category: 'חלב', trigger: 'יוגורט, גביעי שוקו, פודינג חלבי', before: SHEHAKOL, after: NEFASHOT },
  { id: 'cheese-types', category: 'חלב', trigger: 'גבינות מסוגים שונים (צהובה, לבנה, גרידי)', before: SHEHAKOL, after: NEFASHOT },
  { id: 'icecream-cone', category: 'ממתקים', trigger: 'גלידה בגביע / קונוס', before: SHEHAKOL, after: NEFASHOT, notes: 'הגביע משלים את הגלידה - לא דורש ברכה נפרדת בדרך כלל.' },
  { id: 'cream', category: 'חלב', trigger: 'שמנת מתוקה, קרם, מוס', before: SHEHAKOL, after: NEFASHOT },

  // ============== בשר ודגים ==============
  { id: 'sausage', category: 'בשר', trigger: 'נקניק, נקניקיות, פסטרמה', before: SHEHAKOL, after: NEFASHOT },
  { id: 'fish-sushi', category: 'דגים', trigger: 'סלמון נא (סשימי, סושי בלי אורז)', before: SHEHAKOL, after: NEFASHOT, notes: 'סושי עם אורז - מזונות.' },
  { id: 'roe', category: 'דגים', trigger: 'ביצי דגים (קוויאר, ביצי סלמון)', before: SHEHAKOL, after: NEFASHOT },
  { id: 'tuna-can', category: 'דגים', trigger: 'טונה בקופסה, סרדינים, מטיאס', before: SHEHAKOL, after: NEFASHOT },

  // ============== ביצים ==============
  { id: 'omelette', category: 'ביצים', trigger: 'חביתה, ביצה רכה / קשה, מקושקשת', before: SHEHAKOL, after: NEFASHOT },
  { id: 'eggs-cooked-noodle', category: 'ביצים', trigger: 'ביצה עם פסטה / אורז (העיקר ביצה)', before: SHEHAKOL, after: NEFASHOT, notes: 'אם הפסטה / אורז העיקר - מזונות.' },

  // ============== נוסחים מיוחדים ==============
  { id: 'birthday-cake', category: 'מאפים', trigger: 'עוגת יום הולדת', before: MEZONOT, after: AL_HAMICHYA, notes: 'אם זה פרי חדש לעונה / מועד - גם שהחיינו.' },
  { id: 'hamantashen', category: 'מאפים', trigger: 'אזני המן (פורים)', before: MEZONOT, after: AL_HAMICHYA },
  { id: 'sufganiyot', category: 'מאפים', trigger: 'סופגנייה (חנוכה)', before: MEZONOT, after: AL_HAMICHYA, notes: 'מטוגן בשמן עמוק - לפי רוב הפוסקים מזונות. יש מחמירים שהכל.' },
  { id: 'levivot', category: 'מאפים', trigger: 'לביבות (חנוכה - תפוח אדמה)', before: ADAMA, after: NEFASHOT, notes: 'לביבות תפוחי אדמה - אדמה. לביבות גבינה - שהכל. לביבות עם בלילת קמח - יש מבררים.' },
  { id: 'matza-meal', category: 'מאפים', trigger: 'קניידלך, קציצות מצה (פסח)', before: MEZONOT, after: AL_HAMICHYA },
  { id: 'maror', category: 'תבשיל', trigger: 'מרור (חזרת / חסה לליל הסדר)', before: ADAMA, after: NEFASHOT, notes: 'בליל הסדר אומרים גם "על אכילת מרור". בשאר ימים - אדמה.' },
  { id: 'haroset', category: 'תבשיל', trigger: 'חרוסת (פסח)', before: ETZ, after: NEFASHOT, notes: 'חרוסת מאגוזים+תפוחים - העץ. בליל הסדר - יוצאים בברכה על המרור.' },
];

export const BRACHOT_HAREIYA: BrachaEntry[] = [
  // -------- מאורעות טבע --------
  { id: 'rainbow', category: 'טבע', trigger: 'קשת בענן', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, זוֹכֵר הַבְּרִית וְנֶאֱמָן בִּבְרִיתוֹ וְקַיָּם בְּמַאֲמָרוֹ.', notes: 'אסור להסתכל בקשת זמן רב. מברכים פעם אחת ביום שראיה.' },
  { id: 'thunder', category: 'טבע', trigger: 'רעם', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁכֹּחוֹ וּגְבוּרָתוֹ מָלֵא עוֹלָם.', notes: 'מברכים פעם בעת ראייה (יש מקילים אחת לסערה).' },
  { id: 'lightning', category: 'טבע', trigger: 'ברק', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.', notes: 'מברכים מיד כשרואים את הברק. גם על מטאוריט / כוכב נופל.' },
  { id: 'storm', category: 'טבע', trigger: 'רוחות חזקות', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.' },
  { id: 'earthquake', category: 'טבע', trigger: 'רעידת אדמה', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁכֹּחוֹ וּגְבוּרָתוֹ מָלֵא עוֹלָם.', notes: 'יש מברכים "עושה מעשה בראשית".' },

  // -------- נופים --------
  { id: 'mountains', category: 'ראייה', trigger: 'הרים גבוהים', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.', notes: 'אחת ל-30 יום.' },
  { id: 'deserts', category: 'ראייה', trigger: 'מדבריות', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.', notes: 'אחת ל-30 יום.' },
  { id: 'rivers', category: 'ראייה', trigger: 'נהרות גדולים', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.', notes: 'אחת ל-30 יום.' },
  { id: 'mediterranean', category: 'ראייה', trigger: 'הים הגדול (תיכון)', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁעָשָׂה אֶת הַיָּם הַגָּדוֹל.', notes: 'אחת ל-30 יום. ראה כלי "ברכות הים".' },
  { id: 'other-seas', category: 'ראייה', trigger: 'ים אחר (כינרת, ים המלח, ים סוף)', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.', notes: 'אחת ל-30 יום.' },

  // -------- אנשים --------
  { id: 'kings-jew', category: 'אנשים', trigger: 'מלך ישראל', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁחָלַק מִכְּבוֹדוֹ לִירֵאָיו.', notes: 'בימינו - על נשיא המדינה (יש דעות).' },
  { id: 'kings-gentile', category: 'אנשים', trigger: 'מלך גוי / ראש מדינה', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁנָּתַן מִכְּבוֹדוֹ לְבָשָׂר וָדָם.', notes: 'אחת ל-30 יום.' },
  { id: 'chacham', category: 'אנשים', trigger: 'חכם מופלג בתורה', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁחָלַק מֵחָכְמָתוֹ לִירֵאָיו.', notes: 'אחת ל-30 יום, על חכם שגדול בתורה ובמידות.' },
  { id: 'wise-secular', category: 'אנשים', trigger: 'חכם בחכמות העולם', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁנָּתַן מֵחָכְמָתוֹ לְבָשָׂר וָדָם.', notes: 'מדענים, מומחים בתחומם.' },
  { id: 'beauty', category: 'אנשים', trigger: 'בריות נאות במיוחד', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁכָּכָה לוֹ בְּעוֹלָמוֹ.', notes: 'גם על אילנות מלבלבים יפים.' },
  { id: 'unusual', category: 'אנשים', trigger: 'בריות משונות (גמדים, ענקים)', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, מְשַׁנֶּה הַבְּרִיּוֹת.' },
  { id: 'meet-friend', category: 'אנשים', trigger: 'פגישת חבר אחרי 30 יום או יותר', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, מְחַיֵּה הַמֵּתִים.', notes: 'אחרי 12 חודש פגישה. בין 30 יום ל-12 חודש - "שהחיינו".' },

  // -------- ריחות --------
  { id: 'fragrance-flowers', category: 'ריח', trigger: 'פרחים ועשבים ריחניים', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא עִשְׂבֵי בְשָׂמִים.' },
  { id: 'fragrance-tree', category: 'ריח', trigger: 'בשמים מעץ (עץ הדס וכו׳)', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא עֲצֵי בְשָׂמִים.' },
  { id: 'fragrance-fruit', category: 'ריח', trigger: 'ריח של פרי', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַנּוֹתֵן רֵיחַ טוֹב בַּפֵּרוֹת.' },
  { id: 'fragrance-other', category: 'ריח', trigger: 'בשמים שאינם נכללים (קטורת, מוסק)', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא מִינֵי בְשָׂמִים.' },

  // -------- זמן --------
  { id: 'shehecheyanu', category: 'זמן', trigger: 'פרי חדש (בעונה) / בגד חדש משמעותי / מועד', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.', notes: 'על פרי חדש בעונה, מועדים, בגד חדש משמעותי.' },
  { id: 'hatov-meytiv', category: 'זמן', trigger: 'בגד חדש שמשמח גם אחרים', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַטּוֹב וְהַמֵּטִיב.', notes: 'גם על יין שני שטוב יותר מהראשון.' },

  // -------- בשורה --------
  { id: 'good-news', category: 'בשורה', trigger: 'בשורה טובה', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַטּוֹב וְהַמֵּטִיב.', notes: 'גם על לידת בן.' },
  { id: 'bad-news', category: 'בשורה', trigger: 'בשורה רעה / פטירה', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, דַּיַּן הָאֱמֶת.' },
  { id: 'birth-daughter', category: 'בשורה', trigger: 'לידת בת', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַטּוֹב וְהַמֵּטִיב.', notes: 'בלידה של בן בכור - גם פדיון הבן. בלידת בת - שהחיינו לאם.' },

  // -------- מקומות וזיקות --------
  { id: 'holy-land', category: 'מקומות', trigger: 'ראיית ערי יהודה (לרגע)', before: 'יש שמברכים: "מי שעשה נסים לאבותינו במקום הזה".', notes: 'על מקומות שנעשו בהם ניסים.' },
  { id: 'eretz-yisrael', category: 'מקומות', trigger: 'ראיית ארץ ישראל אחרי 30 יום מחו"ל', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.', notes: 'בנחיתה במטוס - שהחיינו.' },
  { id: 'kotel', category: 'מקומות', trigger: 'הכותל המערבי (אחרי 30 יום)', before: 'בָּרוּךְ דַּיַּן הָאֱמֶת.', notes: 'מנהג קריעה אחת ל-30 יום אם לא ראה. בימינו - יש מקילים.' },

  // -------- ניצול --------
  { id: 'escape-danger', category: 'הצלה', trigger: 'יציאה מסכנה / מחלה / מאסר / ים / מדבר', before: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַגּוֹמֵל לְחַיָּבִים טוֹבוֹת, שֶׁגְּמָלַנִי כָּל טוֹב.', after: 'הציבור עונה: "מי שגמלך כל טוב, הוא יגמלך כל טוב, סלה."', notes: 'ברכת הגומל - בעלייה לתורה בציבור.' },
];
