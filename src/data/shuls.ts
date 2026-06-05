/**
 * Israeli synagogues with typical daily minyan times.
 * Verify times against zmanemet.com / godaven.com before relying on them for
 * specific occasions. Times reflect general patterns at each shul.
 */
export type ShulNusach = 'ashkenazi' | 'sephardi' | 'edot-mizrach' | 'chabad' | 'mixed';

export type Shul = {
  name: string;
  city: string;
  neighborhood?: string;
  address: string;
  nusach: ShulNusach;
  shacharit: string[];
  mincha: string[];
  maariv: string[];
  lat: number;
  lng: number;
  phone?: string;
  specialServices?: string;
};

export const SHULS: Shul[] = [
  // ירושלים
  { name: 'ישיבת מרכז הרב', city: 'ירושלים', neighborhood: 'קריית משה', address: 'הרב צבי יהודה 2', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:30'], mincha: ['13:30', '19:00'], maariv: ['20:00', '21:30'], lat: 31.7889, lng: 35.1965, phone: '02-6529920', specialServices: 'ותיקין, שיעורי הראי"ה' },
  { name: 'בית הכנסת הגדול ע"ש הרצוג', city: 'ירושלים', neighborhood: 'מרכז העיר', address: "המלך ג'ורג' 56", nusach: 'mixed', shacharit: ['6:30', '8:00'], mincha: ['13:15', '18:30'], maariv: ['19:30'], lat: 31.7799, lng: 35.2197, phone: '02-6230628', specialServices: 'מקהלה בשבת' },
  { name: 'ישורון', city: 'ירושלים', neighborhood: 'מרכז העיר', address: "המלך ג'ורג' 23", nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00', '9:00'], mincha: ['13:30', '18:00'], maariv: ['19:15', '20:30'], lat: 31.7811, lng: 35.2206, phone: '02-6243942', specialServices: 'דף יומי' },
  { name: 'החורבה', city: 'ירושלים', neighborhood: 'הרובע היהודי', address: 'רחוב הקראים, רובע יהודי', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '18:00'], maariv: ['19:30'], lat: 31.7754, lng: 35.2316, phone: '02-6265922', specialServices: 'סיורים' },
  { name: 'בית הכנסת בעלזא הגדול', city: 'ירושלים', neighborhood: 'קריית בעלזא', address: 'דובר שלום 14', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '19:00'], maariv: ['20:00', '22:00'], lat: 31.7977, lng: 35.2114, phone: '02-5371777', specialServices: 'תפילת חסידות בעלזא' },
  { name: 'בית כנסת בית יעקב (בית וגן)', city: 'ירושלים', neighborhood: 'בית וגן', address: 'הרב פרנק 6', nusach: 'ashkenazi', shacharit: ['6:15', '7:15', '8:15'], mincha: ['13:30', '18:30'], maariv: ['19:30', '21:00'], lat: 31.7619, lng: 35.1898, phone: '02-6433346', specialServices: 'דף יומי' },
  { name: 'בית מדרש קהילת חניכי הישיבות (גרוס)', city: 'ירושלים', neighborhood: 'הר נוף', address: 'אגסי 14', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:30'], mincha: ['13:30', '18:45'], maariv: ['20:00', '21:30'], lat: 31.7878, lng: 35.1851, specialServices: 'דף יומי, שיעורי הלכה' },
  { name: 'בית הכנסת המרכזי הר נוף', city: 'ירושלים', neighborhood: 'הר נוף', address: 'קצנלבוגן 11', nusach: 'mixed', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:45'], lat: 31.7872, lng: 35.1838 },
  { name: 'בית הכנסת זכרון משה', city: 'ירושלים', neighborhood: 'זכרון משה', address: 'יואל משה סלומון 12', nusach: 'mixed', shacharit: ['5:30', '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00'], mincha: ['12:30', '13:00', '13:30', '14:00', '18:00', '18:30', '19:00'], maariv: ['19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '23:00', '0:00'], lat: 31.7858, lng: 35.2169, specialServices: 'מנייני שעה' },
  { name: 'הגר"א - שערי חסד', city: 'ירושלים', neighborhood: 'שערי חסד', address: 'הרב צירלסון 10', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '19:00'], maariv: ['20:00'], lat: 31.7819, lng: 35.2117, specialServices: 'נוסח הגר"א' },
  { name: 'בית כנסת הספרדי הרובע', city: 'ירושלים', neighborhood: 'הרובע היהודי', address: 'ארבעת בתי הכנסת הספרדיים', nusach: 'edot-mizrach', shacharit: ['6:30', '7:30'], mincha: ['13:30', '18:00'], maariv: ['19:15'], lat: 31.7748, lng: 35.2312, phone: '02-6280592' },
  { name: "ישיבת פוניבז' ירושלים - גבעת שאול", city: 'ירושלים', neighborhood: 'גבעת שאול', address: 'הרב סורוצקין 16', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:30'], mincha: ['13:30', '19:00'], maariv: ['20:00', '21:30'], lat: 31.7905, lng: 35.2018, specialServices: 'ותיקין' },
  { name: 'בית כנסת איצקוביץ ירושלים (סנהדריה)', city: 'ירושלים', neighborhood: 'סנהדריה', address: 'בר אילן 47', nusach: 'ashkenazi', shacharit: ['5:30', '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00'], mincha: ['12:45', '13:15', '13:45', '18:30', '19:00', '19:30'], maariv: ['19:45', '20:15', '20:45', '21:30', '22:30', '23:30'], lat: 31.7975, lng: 35.2243, specialServices: 'מנייני שעה רצופים' },
  { name: 'ישיבת מיר', city: 'ירושלים', neighborhood: 'בית ישראל', address: 'בית ישראל 3', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:30', '9:30'], mincha: ['13:30', '19:00'], maariv: ['20:00', '21:30'], lat: 31.7898, lng: 35.2230, specialServices: 'כולל בכל היום' },
  { name: 'בית כנסת ימין משה', city: 'ירושלים', neighborhood: 'ימין משה', address: 'ימין משה', nusach: 'edot-mizrach', shacharit: ['6:30', '7:30'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 31.7726, lng: 35.2241 },
  { name: 'בית כנסת חב"ד גאולה', city: 'ירושלים', neighborhood: 'גאולה', address: 'מלכי ישראל 36', nusach: 'chabad', shacharit: ['6:30', '7:30', '8:30'], mincha: ['13:30', '19:00'], maariv: ['20:00'], lat: 31.7920, lng: 35.2189, specialServices: 'שיעורי תניא' },
  // בני ברק
  { name: 'בית כנסת לדרמן', city: 'בני ברק', neighborhood: 'מרכז', address: 'רשב"ם 7', nusach: 'ashkenazi', shacharit: ['5:00', '5:30', '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00'], mincha: ['12:30', '13:00', '13:30', '14:00', '18:00', '18:30', '19:00', '19:30'], maariv: ['19:45', '20:15', '20:45', '21:15', '22:00', '23:00', '0:00'], lat: 32.0816, lng: 34.8332, specialServices: 'מנייני שעה 24/7, בית מדרשו של החזון איש' },
  { name: 'בית כנסת איצקוביץ', city: 'בני ברק', neighborhood: 'מרכז', address: 'עזרא 5', nusach: 'ashkenazi', shacharit: ['5:00', '5:30', '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30'], mincha: ['12:45', '13:15', '13:45', '14:15', '18:30', '19:00', '19:30'], maariv: ['19:45', '20:15', '20:45', '21:30', '22:30', '23:30'], lat: 32.0828, lng: 34.8341, specialServices: 'מנייני שעה רצופים' },
  { name: 'בית כנסת קהילת יעקב (קרליץ)', city: 'בני ברק', neighborhood: 'מרכז', address: 'החזון איש 17', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '19:00'], maariv: ['20:00', '21:30'], lat: 32.0824, lng: 34.8366 },
  { name: "ישיבת פוניבז'", city: 'בני ברק', neighborhood: 'צפון', address: 'הרב כהנמן 18', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:30'], mincha: ['13:30', '19:00'], maariv: ['20:00', '21:30'], lat: 32.0863, lng: 34.8323, specialServices: 'ותיקין' },
  { name: 'בית כנסת זכרון מאיר', city: 'בני ברק', neighborhood: 'זכרון מאיר', address: 'הרב לנדא 7', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:45', '21:00'], lat: 32.0879, lng: 34.8389 },
  { name: "בית כנסת ויז'ניץ", city: 'בני ברק', neighborhood: "קריית ויז'ניץ", address: "ויז'ניץ 1", nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '19:00'], maariv: ['20:00', '21:30'], lat: 32.0930, lng: 34.8388, specialServices: "נוסח חסידות ויז'ניץ" },
  { name: 'בית כנסת חב"ד בני ברק', city: 'בני ברק', neighborhood: 'מרכז', address: "ז'בוטינסקי 153", nusach: 'chabad', shacharit: ['6:30', '7:30', '8:30'], mincha: ['13:30', '19:00'], maariv: ['20:00'], lat: 32.0834, lng: 34.8401 },
  // תל אביב
  { name: 'ההיכל המרכזי - הבימה הגדולה', city: 'תל אביב', neighborhood: 'לב העיר', address: 'אלנבי 110', nusach: 'ashkenazi', shacharit: ['6:30', '7:30', '8:30'], mincha: ['13:30', '18:30'], maariv: ['19:45'], lat: 32.0697, lng: 34.7728, phone: '03-5604905', specialServices: 'מקהלה, חזנות מסורתית' },
  { name: 'בית כנסת אוהל מועד', city: 'תל אביב', neighborhood: 'לב העיר', address: "שדרות רוטשילד 5", nusach: 'edot-mizrach', shacharit: ['6:30', '7:30'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 32.0651, lng: 34.7704, specialServices: 'נוסח ספרדי ירושלמי' },
  { name: 'בית כנסת חב"ד תל אביב', city: 'תל אביב', neighborhood: 'צפון ישן', address: 'פרישמן 49', nusach: 'chabad', shacharit: ['7:00', '8:30'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 32.0816, lng: 34.7720, phone: '03-5223317' },
  { name: 'ישיבת היכל אליהו - רמת אביב', city: 'תל אביב', neighborhood: 'רמת אביב', address: 'איינשטיין 40', nusach: 'ashkenazi', shacharit: ['6:30', '7:30', '8:30'], mincha: ['13:30', '18:30'], maariv: ['19:30', '21:00'], lat: 32.1156, lng: 34.8000 },
  // חיפה
  { name: 'בית הכנסת הגדול חיפה', city: 'חיפה', neighborhood: 'הדר הכרמל', address: 'הרצל 76', nusach: 'ashkenazi', shacharit: ['6:30', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 32.8156, lng: 34.9892, phone: '04-8662278' },
  { name: 'מורשת אברהם', city: 'חיפה', neighborhood: 'אחוזה', address: 'מוריה 75', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:45'], lat: 32.7768, lng: 34.9819 },
  { name: 'מוריה - בית הכנסת המרכזי כרמל', city: 'חיפה', neighborhood: 'כרמל מרכזי', address: 'שדרות הנשיא 124', nusach: 'mixed', shacharit: ['6:30', '7:30'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 32.7958, lng: 34.9933 },
  { name: 'בית כנסת חב"ד חיפה', city: 'חיפה', neighborhood: 'הדר', address: 'ביאליק 19', nusach: 'chabad', shacharit: ['7:00', '8:30'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 32.8126, lng: 34.9933 },
  // ראשון לציון
  { name: 'בית הכנסת הגדול ראשל"צ', city: 'ראשון לציון', neighborhood: 'הישנה', address: 'רוטשילד 17', nusach: 'edot-mizrach', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 31.9696, lng: 34.7649, phone: '03-9647410' },
  { name: 'בית כנסת חב"ד ראשל"צ', city: 'ראשון לציון', neighborhood: 'מרכז', address: "ז'בוטינסקי 23", nusach: 'chabad', shacharit: ['7:00', '8:30'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 31.9713, lng: 34.7894 },
  // רמת גן
  { name: 'בית הכנסת המרכזי רמת גן', city: 'רמת גן', neighborhood: 'מרכז', address: 'ביאליק 26', nusach: 'ashkenazi', shacharit: ['6:30', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 32.0822, lng: 34.8141, phone: '03-6724002' },
  { name: 'ישיבת בני עקיבא בר אילן', city: 'רמת גן', neighborhood: 'קריית בר אילן', address: 'אוניברסיטת בר אילן', nusach: 'ashkenazi', shacharit: ['6:30', '7:15', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:45', '21:00'], lat: 32.0708, lng: 34.8425 },
  // פתח תקווה
  { name: 'בית הכנסת הגדול פ"ת', city: 'פתח תקווה', neighborhood: 'מרכז', address: 'מוהליבר 17', nusach: 'ashkenazi', shacharit: ['6:30', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 32.0879, lng: 34.8861, phone: '03-9223434' },
  { name: "ישיבת לומז'ה", city: 'פתח תקווה', neighborhood: 'מרכז', address: 'פינסקר 23', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:30'], mincha: ['13:30', '19:00'], maariv: ['20:00'], lat: 32.0867, lng: 34.8829 },
  // רחובות
  { name: 'בית הכנסת הגדול רחובות', city: 'רחובות', neighborhood: 'מרכז', address: 'הרצל 184', nusach: 'ashkenazi', shacharit: ['6:30', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 31.8920, lng: 34.8079, phone: '08-9466660' },
  { name: 'ישיבת ההסדר רחובות (מורשת)', city: 'רחובות', neighborhood: 'רמת אלון', address: 'הרב גולד 1', nusach: 'ashkenazi', shacharit: ['6:00', '7:00'], mincha: ['13:30', '18:30'], maariv: ['19:45'], lat: 31.8893, lng: 34.8167 },
  // מודיעין
  { name: 'בית הכנסת המרכזי מודיעין', city: 'מודיעין', neighborhood: 'הכרמים', address: 'עמק זבולון 10', nusach: 'ashkenazi', shacharit: ['6:30', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:30', '21:00'], lat: 31.8949, lng: 35.0103 },
  { name: 'בית כנסת אהבת ישראל - בוכמן', city: 'מודיעין', neighborhood: 'בוכמן', address: 'תלתן 30', nusach: 'mixed', shacharit: ['6:30', '7:30', '8:30'], mincha: ['13:30', '18:30'], maariv: ['19:45'], lat: 31.9007, lng: 35.0223 },
  // בית שמש
  { name: 'בית כנסת הגדול בית שמש', city: 'בית שמש', neighborhood: 'ותיקה', address: 'הנשיא 41', nusach: 'edot-mizrach', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 31.7472, lng: 34.9889 },
  { name: 'בית מדרש אהבת תורה - רמב"ש ג', city: 'בית שמש', neighborhood: 'רמת בית שמש ג', address: 'נחל לוז 19', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '19:00'], maariv: ['20:00', '21:30'], lat: 31.7280, lng: 34.9939 },
  { name: 'אהבת שלום - רמב"ש א', city: 'בית שמש', neighborhood: 'רמת בית שמש א', address: 'נחל דולב 12', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:45', '21:00'], lat: 31.7396, lng: 35.0012 },
  // נתניה
  { name: 'בית הכנסת הגדול נתניה', city: 'נתניה', neighborhood: 'מרכז', address: 'הרצל 6', nusach: 'ashkenazi', shacharit: ['6:30', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 32.3290, lng: 34.8569, phone: '09-8624313' },
  { name: 'ישיבת ההסדר נתניה', city: 'נתניה', neighborhood: 'קריית צאנז', address: 'הרב קוק 10', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '18:30'], maariv: ['19:45'], lat: 32.3208, lng: 34.8639 },
  // באר שבע
  { name: 'בית הכנסת הגדול תפארת ישראל', city: 'באר שבע', neighborhood: 'העיר העתיקה', address: 'סמילנסקי 41', nusach: 'ashkenazi', shacharit: ['6:30', '8:00'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 31.2407, lng: 34.7903, phone: '08-6277744' },
  { name: 'בית כנסת חב"ד באר שבע', city: 'באר שבע', neighborhood: "ד'", address: 'השומר 4', nusach: 'chabad', shacharit: ['7:00', '8:30'], mincha: ['13:30', '18:30'], maariv: ['19:30'], lat: 31.2531, lng: 34.7951 },

  // ==================== יהודה ושומרון ====================
  // אלון מורה
  { name: 'בית הכנסת המרכזי אלון מורה', city: 'אלון מורה', neighborhood: 'מרכז', address: 'רחוב הרצל', nusach: 'mixed', shacharit: ['6:00', '7:00', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 32.2305, lng: 35.3592, specialServices: 'ותיקין, דף יומי' },
  { name: 'ישיבת ברכת יוסף', city: 'אלון מורה', neighborhood: 'מרכז', address: 'ישיבת ברכת יוסף', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 32.2298, lng: 35.3585, specialServices: 'ישיבת הסדר' },
  { name: 'בית כנסת ספרדי אלון מורה', city: 'אלון מורה', neighborhood: 'שכונת המייסדים', address: 'אלון מורה', nusach: 'edot-mizrach', shacharit: ['6:15', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.2310, lng: 35.3600 },
  // איתמר
  { name: 'בית כנסת המרכזי איתמר', city: 'איתמר', address: 'מרכז היישוב', nusach: 'mixed', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:00'], maariv: ['19:30', '21:00'], lat: 32.1805, lng: 35.3390 },
  { name: 'ישיבת איתמר', city: 'איתמר', address: 'ישיבת איתמר', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:00'], maariv: ['20:00'], lat: 32.1810, lng: 35.3395 },
  // יצהר
  { name: 'בית כנסת דורשי יחודך', city: 'יצהר', address: 'מרכז יצהר', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:00'], maariv: ['19:30', '21:00'], lat: 32.1870, lng: 35.2475, specialServices: 'ותיקין' },
  { name: 'ישיבת עוד יוסף חי', city: 'יצהר', address: 'ישיבת עוד יוסף חי', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:00'], maariv: ['20:00'], lat: 32.1875, lng: 35.2480 },
  // הר ברכה
  { name: 'ישיבת הר ברכה', city: 'הר ברכה', address: 'ישיבת הר ברכה', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 32.1830, lng: 35.2750, phone: '02-9974111', specialServices: 'ישיבת הסדר, שיעורי הרב אליעזר מלמד' },
  { name: 'בית כנסת מרכזי הר ברכה', city: 'הר ברכה', neighborhood: 'מרכז', address: 'הר ברכה', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.1835, lng: 35.2755 },
  // קדומים
  { name: 'בית הכנסת המרכזי קדומים', city: 'קדומים', neighborhood: 'מצפה ישי', address: 'קדומים', nusach: 'mixed', shacharit: ['6:00', '7:00', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 32.2130, lng: 35.0945 },
  { name: 'בית כנסת ספרדי קדומים', city: 'קדומים', address: 'קדומים', nusach: 'edot-mizrach', shacharit: ['6:15', '7:30'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.2135, lng: 35.0950 },
  // קרני שומרון
  { name: 'בית הכנסת המרכזי קרני שומרון', city: 'קרני שומרון', address: 'קרני שומרון', nusach: 'ashkenazi', shacharit: ['6:00', '7:15', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 32.1790, lng: 35.0925 },
  { name: 'בית כנסת רמת גילעד', city: 'קרני שומרון', neighborhood: 'רמת גילעד', address: 'רמת גילעד', nusach: 'mixed', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.1795, lng: 35.0930 },
  // אריאל
  { name: 'בית הכנסת המרכזי אריאל', city: 'אריאל', neighborhood: 'מרכז', address: 'רחוב הירדן', nusach: 'mixed', shacharit: ['6:00', '7:00', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 32.1065, lng: 35.1765 },
  { name: 'בית חב"ד אריאל', city: 'אריאל', address: 'אריאל', nusach: 'chabad', shacharit: ['6:30', '8:00'], mincha: ['13:30', '19:00'], maariv: ['19:30', '21:00'], lat: 32.1070, lng: 35.1770 },
  { name: 'בית כנסת ספרדי אריאל', city: 'אריאל', neighborhood: 'שכונת אלון', address: 'אריאל', nusach: 'edot-mizrach', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.1060, lng: 35.1760 },
  // עלי, שילה, בית אל, עפרה, כוכב יעקב
  { name: 'ישיבת בני דוד', city: 'עלי', address: 'ישיבת בני דוד', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 31.9735, lng: 35.2820, specialServices: 'מכינה קדם צבאית' },
  { name: 'בית הכנסת המרכזי עלי', city: 'עלי', address: 'מרכז עלי', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 31.9730, lng: 35.2825 },
  { name: 'בית כנסת המשכן בשילה', city: 'שילה', address: 'שילה הקדומה', nusach: 'mixed', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.9930, lng: 35.2905, specialServices: 'ותיקין' },
  { name: 'ישיבת שבות ישראל', city: 'שילה', address: 'שילה', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00'], lat: 31.9925, lng: 35.2900 },
  { name: 'ישיבת בית אל', city: 'בית אל', address: 'ישיבת בית אל', nusach: 'ashkenazi', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 31.9450, lng: 35.2315, phone: '02-9975554', specialServices: 'שיעורי הרב זלמן מלמד' },
  { name: 'בית הכנסת המרכזי בית אל', city: 'בית אל', neighborhood: "בית אל א'", address: 'בית אל', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 31.9445, lng: 35.2310 },
  { name: 'בית הכנסת המרכזי עפרה', city: 'עפרה', address: 'מרכז עפרה', nusach: 'ashkenazi', shacharit: ['6:00', '7:15', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.9575, lng: 35.2435 },
  { name: 'בית הכנסת המרכזי כוכב יעקב', city: 'כוכב יעקב', address: 'כוכב יעקב', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.8905, lng: 35.2475 },
  // גוש עציון
  { name: 'ישיבת הר עציון', city: 'אלון שבות', address: 'ישיבת הר עציון', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 31.6605, lng: 35.1315, phone: '02-9937333', specialServices: 'ישיבת הסדר' },
  { name: 'בית הכנסת המרכזי אלון שבות', city: 'אלון שבות', address: 'אלון שבות', nusach: 'mixed', shacharit: ['6:00', '7:15', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 31.6610, lng: 35.1320 },
  { name: 'בית הכנסת המרכזי אפרת', city: 'אפרת', neighborhood: 'תאנה', address: 'אפרת', nusach: 'mixed', shacharit: ['6:00', '7:15', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.6580, lng: 35.1575 },
  { name: 'בית כנסת אהל נחמה', city: 'אפרת', neighborhood: 'זית', address: 'רחוב הזית', nusach: 'ashkenazi', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 31.6585, lng: 35.1580 },
  { name: 'בית הכנסת המרכזי תקוע', city: 'תקוע', address: 'תקוע', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.6385, lng: 35.2265 },
  { name: 'בית הכנסת המרכזי כפר עציון', city: 'כפר עציון', address: 'כפר עציון', nusach: 'mixed', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 31.6545, lng: 35.1185 },
  // מעלה אדומים
  { name: 'ישיבת ברכת משה', city: 'מעלה אדומים', neighborhood: 'מצפה נבו', address: 'ישיבת ברכת משה', nusach: 'ashkenazi', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 31.7735, lng: 35.2995 },
  { name: 'ישיבת ההסדר מעלה אדומים', city: 'מעלה אדומים', address: 'מעלה אדומים', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00'], lat: 31.7680, lng: 35.3020, specialServices: 'ישיבת הסדר' },
  { name: 'בית הכנסת הגדול מעלה אדומים', city: 'מעלה אדומים', neighborhood: 'מצפה נבו', address: 'מעלה אדומים', nusach: 'mixed', shacharit: ['6:00', '7:00', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.7730, lng: 35.2990 },
  { name: 'בית כנסת ספרדי מעלה אדומים', city: 'מעלה אדומים', address: 'מעלה אדומים', nusach: 'edot-mizrach', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 31.7740, lng: 35.3000 },
  // גבעת זאב, חברון, קרית ארבע, עתניאל
  { name: 'בית הכנסת המרכזי גבעת זאב', city: 'גבעת זאב', address: 'גבעת זאב', nusach: 'mixed', shacharit: ['6:00', '7:15', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.8605, lng: 35.1795 },
  { name: 'בית הכנסת אברהם אבינו', city: 'חברון', neighborhood: 'היישוב היהודי', address: 'רובע אברהם אבינו', nusach: 'mixed', shacharit: ['5:30', '7:00'], mincha: ['13:30', '19:00'], maariv: ['19:30', '21:00'], lat: 31.5300, lng: 35.1080, specialServices: 'ותיקין' },
  { name: 'מערת המכפלה - יצחק אבינו', city: 'חברון', address: 'מערת המכפלה', nusach: 'mixed', shacharit: ['5:00', '6:30', '8:00'], mincha: ['13:30', '19:00'], maariv: ['19:30'], lat: 31.5247, lng: 35.1108, specialServices: 'ותיקין' },
  { name: 'ישיבת שבי חברון', city: 'קריית ארבע', address: 'ישיבת שבי חברון', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00'], lat: 31.5265, lng: 35.1205, specialServices: 'ישיבת הסדר' },
  { name: 'בית הכנסת המרכזי קריית ארבע', city: 'קריית ארבע', address: 'קריית ארבע', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.5260, lng: 35.1200 },
  { name: 'ישיבת ההסדר עתניאל', city: 'עתניאל', address: 'ישיבת עתניאל', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:00'], maariv: ['20:00', '21:30'], lat: 31.4120, lng: 35.0450 },

  // ==================== ירושלים - נוספים ====================
  { name: 'ישיבת אש התורה', city: 'ירושלים', neighborhood: 'הרובע היהודי', address: 'הכותל המערבי', nusach: 'ashkenazi', shacharit: ['6:00', '7:30', '9:00'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 31.7765, lng: 35.2345, phone: '02-6286321' },
  { name: 'ישיבת אור שמח', city: 'ירושלים', neighborhood: 'מעלות דפנה', address: 'שמעון הצדיק 22', nusach: 'ashkenazi', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00'], lat: 31.7975, lng: 35.2305 },
  { name: 'ישיבת מרכז הרב', city: 'ירושלים', neighborhood: 'קריית משה', address: 'הרב צבי יהודה 25', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 31.7855, lng: 35.1995 },
  { name: 'ישיבת קול תורה', city: 'ירושלים', neighborhood: 'בית וגן', address: 'רחוב הקבלן 19', nusach: 'ashkenazi', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00'], lat: 31.7635, lng: 35.1845 },
  { name: 'בית הכנסת הגדול בית וגן', city: 'ירושלים', neighborhood: 'בית וגן', address: 'רחוב הפסגה', nusach: 'mixed', shacharit: ['6:00', '7:00', '8:00', '9:00'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.7625, lng: 35.1840, specialServices: 'דף יומי' },
  { name: 'חורבות זכר משה', city: 'ירושלים', neighborhood: 'גאולה', address: 'רחוב מלכי ישראל', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:00', '9:00'], mincha: ['13:30', '19:15'], maariv: ['19:30', '20:30', '22:00'], lat: 31.7895, lng: 35.2225, specialServices: 'מנייני שעה' },
  { name: 'ישיבת מיר', city: 'ירושלים', neighborhood: 'בית ישראל', address: 'רחוב בית ישראל 2', nusach: 'ashkenazi', shacharit: ['6:30', '8:00'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 31.7905, lng: 35.2235 },
  { name: 'ישיבת חברון', city: 'ירושלים', neighborhood: 'גבעת מרדכי', address: 'רחוב לוין אפשטיין', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00'], lat: 31.7665, lng: 35.1985 },
  { name: 'בית כנסת ישורון', city: 'ירושלים', neighborhood: 'רחביה', address: "המלך ג'ורג' 44", nusach: 'ashkenazi', shacharit: ['6:30', '7:30', '8:30'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 31.7815, lng: 35.2195 },
  { name: 'בית כנסת מוסיוף', city: 'ירושלים', neighborhood: 'בוכרים', address: 'שכונת הבוכרים', nusach: 'edot-mizrach', shacharit: ['6:00', '7:15', '8:30'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.7910, lng: 35.2245, specialServices: 'מקובלים' },
  { name: 'בית אל - ישיבת המקובלים', city: 'ירושלים', neighborhood: 'מאה שערים', address: 'רחוב רש"י', nusach: 'edot-mizrach', shacharit: ['5:00', '7:00'], mincha: ['13:30', '19:00'], maariv: ['19:30'], lat: 31.7900, lng: 35.2240, specialServices: 'כוונות הרש"ש' },
  { name: 'ישיבת פורת יוסף', city: 'ירושלים', neighborhood: 'גאולה', address: 'ירושלים', nusach: 'edot-mizrach', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00'], lat: 31.7895, lng: 35.2230 },

  // ==================== מודיעין עילית ====================
  { name: 'בית הכנסת המרכזי מודיעין עילית', city: 'מודיעין עילית', neighborhood: 'קריית ספר', address: 'רחוב נתיבות המשפט', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.9325, lng: 35.0395 },
  { name: 'בית כנסת ברכפלד', city: 'מודיעין עילית', neighborhood: 'ברכפלד', address: 'מודיעין עילית', nusach: 'ashkenazi', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 31.9340, lng: 35.0410 },

  // ==================== ביתר עילית ====================
  { name: 'בית הכנסת המרכזי ביתר עילית', city: 'ביתר עילית', neighborhood: "גבעה א'", address: 'ביתר עילית', nusach: 'ashkenazi', shacharit: ['6:00', '7:00', '8:15'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 31.6995, lng: 35.1185 },
  { name: 'בית כנסת גור ביתר', city: 'ביתר עילית', neighborhood: "גבעה ב'", address: 'ביתר עילית', nusach: 'ashkenazi', shacharit: ['7:00', '8:30'], mincha: ['13:30', '19:15'], maariv: ['20:00'], lat: 31.7000, lng: 35.1190 },

  // ==================== ראש העין, יבנה, ערים נוספות ====================
  { name: 'ישיבת ראש העין', city: 'ראש העין', address: 'ישיבת ראש העין', nusach: 'edot-mizrach', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00'], lat: 32.0840, lng: 34.9550, specialServices: 'ישיבת הסדר תימני' },
  { name: 'ישיבת כרם ביבנה', city: 'יבנה', address: 'ישיבת כרם ביבנה', nusach: 'ashkenazi', shacharit: ['6:30', '7:30'], mincha: ['13:30', '19:15'], maariv: ['20:00', '21:30'], lat: 31.8580, lng: 34.7385, specialServices: 'ישיבת הסדר' },
  { name: 'בית הכנסת המרכזי אילת', city: 'אילת', address: 'רחוב התמרים', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 29.5560, lng: 34.9510 },
  { name: 'בית חב"ד אילת', city: 'אילת', address: 'אילת', nusach: 'chabad', shacharit: ['6:30', '8:00'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 29.5570, lng: 34.9520 },
  { name: 'בית הכנסת הגדול עפולה', city: 'עפולה', address: 'רחוב יהושע חנקין', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.6075, lng: 35.2895 },
  { name: 'בית הכנסת הגדול חדרה', city: 'חדרה', address: 'רחוב הרברט סמואל', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.4365, lng: 34.9195 },
  { name: 'בית הכנסת המרכזי נוף הגליל', city: 'נוף הגליל', address: 'נוף הגליל', nusach: 'mixed', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.7080, lng: 35.3215 },
  { name: 'בית הכנסת המרכזי כרמיאל', city: 'כרמיאל', address: 'רחוב מעלה כמון', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.9165, lng: 35.2945 },
  { name: 'בית הכנסת המרכזי ערד', city: 'ערד', address: 'רחוב יהודה', nusach: 'mixed', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:00'], maariv: ['19:30'], lat: 31.2585, lng: 35.2125 },
  { name: 'בית הכנסת המרכזי דימונה', city: 'דימונה', address: 'רחוב הרצל', nusach: 'edot-mizrach', shacharit: ['6:00', '7:15'], mincha: ['13:30', '19:00'], maariv: ['19:30'], lat: 31.0680, lng: 35.0335 },

  // ==================== בתי חב"ד נוספים ====================
  { name: 'בית חב"ד תל אביב מרכז', city: 'תל אביב', neighborhood: 'מרכז', address: 'רחוב נחלת בנימין 28', nusach: 'chabad', shacharit: ['6:30', '8:00', '9:30'], mincha: ['13:30', '19:15'], maariv: ['19:45', '21:00'], lat: 32.0680, lng: 34.7710 },
  { name: 'בית חב"ד חיפה', city: 'חיפה', neighborhood: 'הדר', address: 'רחוב הרצל 95', nusach: 'chabad', shacharit: ['6:30', '8:00'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.8170, lng: 34.9890 },
  { name: 'בית חב"ד נתניה', city: 'נתניה', address: 'נתניה', nusach: 'chabad', shacharit: ['6:30', '8:00'], mincha: ['13:30', '19:15'], maariv: ['19:45'], lat: 32.3290, lng: 34.8580 },
  { name: 'בית חב"ד צפת', city: 'צפת', address: 'רחוב ירושלים', nusach: 'chabad', shacharit: ['6:00', '7:30'], mincha: ['13:30', '19:00'], maariv: ['19:30'], lat: 32.9640, lng: 35.4970 },
  { name: 'בית חב"ד טבריה', city: 'טבריה', address: 'טבריה', nusach: 'chabad', shacharit: ['6:30', '8:00'], mincha: ['13:30', '19:00'], maariv: ['19:30'], lat: 32.7910, lng: 35.5310 },
];

export const NUSACH_LABEL: Record<ShulNusach, string> = {
  ashkenazi: 'אשכנז',
  sephardi: 'ספרד',
  'edot-mizrach': 'עדות מזרח',
  chabad: 'חב"ד',
  mixed: 'מעורב',
};
