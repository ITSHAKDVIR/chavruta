export type TzadikYahrtzeit = {
  wikiTitle: string;
  displayName: string;
  hmonth: number;
  hday: number;
  /** Optional short context (e.g., "תנא", "מקובל", "אדמו"ר"). */
  era?: string;
};

import { months, HDate } from '@hebcal/core';

/**
 * Yahrtzeit (death anniversary) database for "הצדיק של היום".
 * Hebrew month + day. When the date appears on TZADIKIM_YAHRTZEITS, the
 * "Tzaddik haYom" screen surfaces the tzaddik (or list if multiple).
 *
 * Sources: standard yahrtzeit reference (חב"ד, ויקיפדיה, אנשי שם).
 */
export const TZADIKIM_YAHRTZEITS: TzadikYahrtzeit[] = [
  // ====== אבות, נביאים, תנאים ======
  // Avot - dates per Yalkut Shimoni / Seder Olam / Rashi traditions; some are disputed.
  // Only including those with strong masorah.
  { wikiTitle: 'משה_רבנו', displayName: 'משה רבנו', hmonth: months.ADAR_I, hday: 7, era: 'נביא (פטירה במסורה)' },
  { wikiTitle: 'אהרון_הכהן', displayName: 'אהרן הכהן', hmonth: months.AV, hday: 1, era: 'כהן גדול (במדבר לג, לח)' },
  { wikiTitle: 'מרים_הנביאה', displayName: 'מרים הנביאה', hmonth: months.NISAN, hday: 10, era: 'נביאה' },
  { wikiTitle: 'דוד_המלך', displayName: 'דוד המלך', hmonth: months.SIVAN, hday: 6, era: 'מלך, מחבר תהילים' },
  { wikiTitle: 'שמואל_הנביא', displayName: 'שמואל הנביא', hmonth: months.IYYAR, hday: 28, era: 'נביא' },
  { wikiTitle: 'יהושע_בן_נון', displayName: 'יהושע בן נון', hmonth: months.NISAN, hday: 26, era: 'מנהיג' },
  // ====== תנאים ואמוראים ======
  { wikiTitle: 'רבי_שמעון_בר_יוחאי', displayName: 'רשב"י (ל"ג בעומר)', hmonth: months.IYYAR, hday: 18, era: 'תנא' },
  { wikiTitle: 'רבי_עקיבא', displayName: 'רבי עקיבא', hmonth: months.TISHREI, hday: 9, era: 'תנא' },
  { wikiTitle: 'רבי_מאיר_בעל_הנס', displayName: 'רבי מאיר בעל הנס', hmonth: months.IYYAR, hday: 14, era: 'תנא' },
  { wikiTitle: 'הלל_הזקן', displayName: 'הלל הזקן', hmonth: months.SHVAT, hday: 15, era: 'תנא' },
  { wikiTitle: 'רבי_יהודה_הנשיא', displayName: 'רבי יהודה הנשיא', hmonth: months.KISLEV, hday: 15, era: 'תנא' },
  { wikiTitle: 'רבן_יוחנן_בן_זכאי', displayName: 'רבן יוחנן בן זכאי', hmonth: months.AV, hday: 15, era: 'תנא' },
  // ====== ראשונים ======
  { wikiTitle: 'הרמב"ם', displayName: 'הרמב"ם', hmonth: months.TEVET, hday: 20, era: 'ראשון' },
  { wikiTitle: 'הרמב"ן', displayName: 'הרמב"ן', hmonth: months.NISAN, hday: 11, era: 'ראשון' },
  { wikiTitle: 'רש"י', displayName: 'רש"י', hmonth: months.TAMUZ, hday: 29, era: 'ראשון' },
  { wikiTitle: 'רבנו_תם', displayName: 'רבנו תם', hmonth: months.SIVAN, hday: 4, era: 'בעלי התוס' },
  { wikiTitle: 'הרא"ש', displayName: 'הרא"ש', hmonth: months.CHESHVAN, hday: 13, era: 'ראשון' },
  { wikiTitle: 'הראב"ד', displayName: 'הראב"ד מפושקיירא', hmonth: months.CHESHVAN, hday: 26, era: 'ראשון' },
  { wikiTitle: 'הרשב"א', displayName: 'הרשב"א', hmonth: months.TAMUZ, hday: 30, era: 'ראשון' },
  // ====== מקובלים ======
  { wikiTitle: 'האר"י_הקדוש', displayName: 'האר"י הקדוש', hmonth: months.AV, hday: 5, era: 'מקובל' },
  { wikiTitle: 'הרמ"ק', displayName: 'הרמ"ק (משה קורדובירו)', hmonth: months.TAMUZ, hday: 23, era: 'מקובל' },
  { wikiTitle: 'רבי_חיים_ויטאל', displayName: 'רבי חיים ויטאל', hmonth: months.IYYAR, hday: 30, era: 'מקובל' },
  // ====== אחרונים ======
  { wikiTitle: 'הבית_יוסף', displayName: 'הבית יוסף (ר\' יוסף קארו)', hmonth: months.NISAN, hday: 13, era: 'מחבר השו"ע' },
  { wikiTitle: 'הרמ"א', displayName: 'הרמ"א', hmonth: months.IYYAR, hday: 18, era: 'מגיה השו"ע' },
  { wikiTitle: 'המהר"ל_מפראג', displayName: 'המהר"ל מפראג', hmonth: months.ELUL, hday: 18, era: 'אחרון' },
  { wikiTitle: 'הש"ך', displayName: 'הש"ך', hmonth: months.ADAR_I, hday: 4, era: 'אחרון' },
  { wikiTitle: 'הט"ז', displayName: 'הט"ז', hmonth: months.SHVAT, hday: 26, era: 'אחרון' },
  { wikiTitle: 'הבעל_שם_טוב', displayName: 'הבעל שם טוב', hmonth: months.SIVAN, hday: 6, era: 'מייסד החסידות' },
  { wikiTitle: 'המגיד_ממזריטש', displayName: 'המגיד ממזריטש', hmonth: months.KISLEV, hday: 19, era: 'חסידות' },
  { wikiTitle: 'הגר"א', displayName: 'הגאון מווילנא (הגר"א)', hmonth: months.TISHREI, hday: 19, era: 'אחרון' },
  { wikiTitle: 'בעל_התניא', displayName: 'בעל התניא (אדמו"ר הזקן)', hmonth: months.TEVET, hday: 24, era: 'חב"ד' },
  { wikiTitle: 'רבי_נחמן_מברסלב', displayName: 'רבי נחמן מברסלב', hmonth: months.TISHREI, hday: 18, era: 'חסידות' },
  { wikiTitle: 'רבי_לוי_יצחק_מברדיטשוב', displayName: 'רבי לוי יצחק מברדיטשוב', hmonth: months.TISHREI, hday: 25, era: 'חסידות' },
  { wikiTitle: 'בעל_אור_החיים_הקדוש', displayName: 'אור החיים הקדוש', hmonth: months.TAMUZ, hday: 15, era: 'מפרש' },
  { wikiTitle: 'החיד"א', displayName: 'החיד"א', hmonth: months.ADAR_I, hday: 11, era: 'אחרון' },
  { wikiTitle: 'החתם_סופר', displayName: 'החתם סופר', hmonth: months.TISHREI, hday: 25, era: 'אחרון' },
  { wikiTitle: 'הצמח_צדק', displayName: 'הצמח צדק (חב"ד)', hmonth: months.NISAN, hday: 13, era: 'חב"ד' },
  { wikiTitle: 'בעל_השפת_אמת', displayName: 'בעל השפת אמת (גור)', hmonth: months.SHVAT, hday: 5, era: 'חסידות' },
  { wikiTitle: 'בעל_הבני_יששכר', displayName: 'בעל הבני יששכר', hmonth: months.TEVET, hday: 17, era: 'חסידות' },
  { wikiTitle: 'בעל_הקצות', displayName: 'בעל הקצות החושן', hmonth: months.TAMUZ, hday: 13, era: 'אחרון' },
  // ====== המאה ה-19-20 ======
  { wikiTitle: 'החפץ_חיים', displayName: 'החפץ חיים', hmonth: months.ELUL, hday: 24, era: 'אחרון' },
  { wikiTitle: 'רבי_חיים_מבריסק', displayName: 'רבי חיים מבריסק', hmonth: months.AV, hday: 21, era: 'אחרון' },
  { wikiTitle: 'הרידב"ז', displayName: 'הרידב"ז', hmonth: months.TISHREI, hday: 4, era: 'אחרון' },
  { wikiTitle: 'הבן_איש_חי', displayName: 'הבן איש חי', hmonth: months.ELUL, hday: 13, era: 'אחרון' },
  { wikiTitle: 'בעל_האגלי_טל', displayName: 'בעל האגלי טל', hmonth: months.SHVAT, hday: 11, era: 'חסידות' },
  { wikiTitle: 'בעל_האמרי_אמת', displayName: 'בעל האמרי אמת (גור)', hmonth: months.ADAR_I, hday: 23, era: 'חסידות' },
  { wikiTitle: 'הרבי_מליובאוויטש', displayName: 'הרבי מליובאוויטש (חב"ד)', hmonth: months.TAMUZ, hday: 3, era: 'חב"ד' },
  { wikiTitle: 'בעל_החזון_איש', displayName: 'בעל החזון איש', hmonth: months.CHESHVAN, hday: 15, era: 'אחרון' },
  { wikiTitle: 'בבא_סאלי', displayName: 'בבא סאלי', hmonth: months.SHVAT, hday: 4, era: 'מקובל מרוקאי' },
  { wikiTitle: 'הרב_עובדיה_יוסף', displayName: 'הרב עובדיה יוסף', hmonth: months.CHESHVAN, hday: 3, era: 'פוסק' },
  { wikiTitle: 'הרב_מרדכי_אליהו', displayName: 'הרב מרדכי אליהו', hmonth: months.SIVAN, hday: 25, era: 'פוסק' },
  { wikiTitle: 'הרב_שלום_משאש', displayName: 'הרב שלום משאש', hmonth: months.NISAN, hday: 14, era: 'פוסק' },
  { wikiTitle: 'הרב_שלמה_זלמן_אויערבך', displayName: 'הרב שלמה זלמן אויערבך', hmonth: months.ADAR_I, hday: 20, era: 'פוסק' },
  { wikiTitle: 'הרב_יוסף_שלום_אלישיב', displayName: 'הרב יוסף שלום אלישיב', hmonth: months.TAMUZ, hday: 28, era: 'פוסק' },
  { wikiTitle: 'הרב_עוזיאל', displayName: 'הרב בן-ציון מאיר חי עוזיאל', hmonth: months.ADAR_I, hday: 24, era: 'ראשון לציון' },
  { wikiTitle: 'הרב_אברהם_יצחק_הכהן_קוק', displayName: 'הראי"ה קוק', hmonth: months.ELUL, hday: 3, era: 'ראשי הציונות הדתית' },
  { wikiTitle: 'הרב_צבי_יהודה_קוק', displayName: 'הרב צבי יהודה קוק', hmonth: months.ADAR_I, hday: 14, era: 'ראשי הציונות הדתית' },

  // ====== הרחבת הרשימה (סבב 5) — צדיקים נוספים, מסודר לפי חודש ======
  // תשרי
  { wikiTitle: 'יום_כיפור_קדושים', displayName: 'גדליה בן אחיקם', hmonth: months.TISHREI, hday: 3, era: 'צום גדליה' },
  { wikiTitle: 'הרבי_מבעלזא', displayName: 'הרבי הראשון מבעלזא (שר שלום)', hmonth: months.TISHREI, hday: 27, era: 'חסידות' },
  { wikiTitle: 'הרב_עזרא_עטיה', displayName: 'הרב עזרא עטיה', hmonth: months.TISHREI, hday: 19, era: 'ראש פורת יוסף' },
  { wikiTitle: 'הרב_יוסף_חיים_זוננפלד', displayName: 'הרב יוסף חיים זוננפלד', hmonth: months.TISHREI, hday: 24, era: 'רב ירושלים' },
  { wikiTitle: 'בעל_השם_משמואל', displayName: 'בעל השם משמואל (סוכטשוב)', hmonth: months.TISHREI, hday: 5, era: 'חסידות' },
  // חשון
  { wikiTitle: 'רחל_אמנו', displayName: 'רחל אמנו', hmonth: months.CHESHVAN, hday: 11, era: 'אמהות' },
  { wikiTitle: 'מתתיהו_הכהן', displayName: 'הרבי הזקן מצאנז (דברי חיים)', hmonth: months.CHESHVAN, hday: 25, era: 'חסידות' },
  { wikiTitle: 'בעל_ערוך_השולחן', displayName: 'בעל ערוך השולחן', hmonth: months.CHESHVAN, hday: 22, era: 'אחרון' },
  { wikiTitle: 'הרב_שמעון_שקופ', displayName: 'הרב שמעון שקופ', hmonth: months.CHESHVAN, hday: 9, era: 'ראש ישיבת גרודנו' },
  { wikiTitle: 'מהר"ם_שיק', displayName: 'מהר"ם שיק', hmonth: months.CHESHVAN, hday: 30, era: 'אחרון' },
  // כסלו
  { wikiTitle: 'אדמו"ר_האמצעי', displayName: 'אדמו"ר האמצעי (חב"ד)', hmonth: months.KISLEV, hday: 9, era: 'חב"ד' },
  { wikiTitle: 'הרבי_ריי"ץ', displayName: 'הרבי הריי"ץ (חב"ד הקודם)', hmonth: months.SHVAT, hday: 10, era: 'חב"ד' },
  { wikiTitle: 'הרב_שלמה_זלמן_אהרמן', displayName: 'הרב שלמה זלמן אהרמן', hmonth: months.KISLEV, hday: 6, era: 'ירושלים' },
  { wikiTitle: 'בעל_הברכת_שלמה', displayName: 'בעל הברכת שלמה (קרלין)', hmonth: months.KISLEV, hday: 17, era: 'חסידות' },
  { wikiTitle: 'הרב_יוסף_שאול_נתנזון', displayName: 'בעל השואל ומשיב', hmonth: months.KISLEV, hday: 27, era: 'אחרון' },
  // טבת
  { wikiTitle: 'בעל_הזהר_הקדוש_רשב"י', displayName: 'בעל פני יהושע', hmonth: months.TEVET, hday: 14, era: 'אחרון' },
  { wikiTitle: 'הרבי_מסאטמר', displayName: 'הרבי מסאטמר (ויואל משה)', hmonth: months.AV, hday: 26, era: 'חסידות' },
  { wikiTitle: 'הרב_שלמה_קלוגר', displayName: 'הרב שלמה קלוגר', hmonth: months.TEVET, hday: 16, era: 'אחרון' },
  { wikiTitle: 'בעל_הקדושת_לוי', displayName: 'בעל קדושת לוי (לוי יצחק)', hmonth: months.TISHREI, hday: 25, era: 'חסידות' },
  { wikiTitle: 'הרב_יחזקאל_לנדא', displayName: 'הנודע ביהודה', hmonth: months.IYYAR, hday: 17, era: 'אחרון' },
  // שבט
  { wikiTitle: 'הרב_יחזקאל_אברמסקי', displayName: 'הרב יחזקאל אברמסקי', hmonth: months.ELUL, hday: 24, era: 'פוסק' },
  { wikiTitle: 'אהרון_הצדיק_מקרלין', displayName: 'אהרון הצדיק מקרלין', hmonth: months.NISAN, hday: 19, era: 'חסידות' },
  { wikiTitle: 'בעל_היסוד_העבודה', displayName: 'בעל היסוד העבודה (סלונים)', hmonth: months.SHVAT, hday: 22, era: 'חסידות' },
  { wikiTitle: 'הרב_אהרן_קוטלר', displayName: 'הרב אהרן קוטלר (לייקווד)', hmonth: months.KISLEV, hday: 2, era: 'גדולי ישיבות אמריקה' },
  { wikiTitle: 'בעל_הדברי_חיים_מצאנז', displayName: 'בעל הדברי חיים מצאנז', hmonth: months.NISAN, hday: 25, era: 'חסידות' },
  // אדר
  { wikiTitle: 'אסתר_המלכה', displayName: 'אסתר המלכה (יום מותה במסורת)', hmonth: months.ADAR_I, hday: 13, era: 'מגילת אסתר' },
  { wikiTitle: 'הרב_מאיר_שפירא', displayName: 'הרב מאיר שפירא מלובלין (מייסד הדף היומי)', hmonth: months.CHESHVAN, hday: 7, era: 'גדולי פולין' },
  { wikiTitle: 'הרבי_מויז\'ניץ', displayName: 'בעל האמרי חיים (ויז\'ניץ)', hmonth: months.NISAN, hday: 9, era: 'חסידות' },
  { wikiTitle: 'בעל_השדי_חמד', displayName: 'בעל השדי חמד', hmonth: months.KISLEV, hday: 24, era: 'אחרון' },
  { wikiTitle: 'הרב_איסר_זלמן_מלצר', displayName: 'הרב איסר זלמן מלצר', hmonth: months.CHESHVAN, hday: 10, era: 'ראש ישיבת עץ חיים' },
  // ניסן
  { wikiTitle: 'יוסף_הצדיק', displayName: 'יוסף הצדיק', hmonth: months.TAMUZ, hday: 1, era: 'אבות' },
  { wikiTitle: 'בעל_הנודע_ביהודה', displayName: 'הרב צבי הירש קלישר', hmonth: months.TISHREI, hday: 7, era: 'מבשרי ציון' },
  { wikiTitle: 'הרבי_מרוז\'ין', displayName: 'הרבי מרוז\'ין (ישראל פרידמן)', hmonth: months.CHESHVAN, hday: 3, era: 'חסידות' },
  { wikiTitle: 'בעל_היסוד_השני', displayName: 'בעל היסוד השני (קרלין-סטולין)', hmonth: months.NISAN, hday: 22, era: 'חסידות' },
  // אייר
  { wikiTitle: 'הרב_ישראל_סלנטר', displayName: 'הרב ישראל סלנטר (אבי תנועת המוסר)', hmonth: months.SHVAT, hday: 25, era: 'אחרון' },
  { wikiTitle: 'הרב_נפתלי_מרופשיץ', displayName: 'הרב נפתלי מרופשיץ', hmonth: months.IYYAR, hday: 11, era: 'חסידות' },
  { wikiTitle: 'הרב_משולם_פייש_סגל', displayName: 'הרבי מטוש (יום הזיכרון)', hmonth: months.IYYAR, hday: 22, era: 'חסידות' },
  { wikiTitle: 'הרב_שלום_שכנא', displayName: 'הרב שלום שכנא (חמיו של הרמ"א)', hmonth: months.KISLEV, hday: 1, era: 'אחרון' },
  // סיון
  { wikiTitle: 'בעל_העקידת_יצחק', displayName: 'הרב יצחק עראמה (עקידת יצחק)', hmonth: months.SIVAN, hday: 14, era: 'ראשון' },
  { wikiTitle: 'הרב_משה_פיינשטיין', displayName: 'הרב משה פיינשטיין', hmonth: months.ADAR_I, hday: 13, era: 'פוסק' },
  { wikiTitle: 'הרב_יעקב_חיים_סופר', displayName: 'בעל הכף החיים', hmonth: months.SIVAN, hday: 9, era: 'פוסק' },
  { wikiTitle: 'בעל_העטרת_זקנים', displayName: 'בעל יסוד יוסף (אלגאזי)', hmonth: months.SIVAN, hday: 17, era: 'אחרון' },
  // תמוז
  { wikiTitle: 'הרב_יוסף_דב_סולוביצ\'יק', displayName: 'הרב יוסף דב סולוביצ\'יק (הגרי"ד)', hmonth: months.NISAN, hday: 18, era: 'גדולי ישיבות' },
  { wikiTitle: 'הרב_אהרון_לייב_שטיינמן', displayName: 'הרב אהרון לייב שטיינמן', hmonth: months.KISLEV, hday: 24, era: 'פוסק' },
  { wikiTitle: 'הרב_חיים_קנייבסקי', displayName: 'הרב חיים קנייבסקי', hmonth: months.ADAR_I, hday: 22, era: 'פוסק' },
  { wikiTitle: 'בעל_הספר_חיים', displayName: 'בעל קב הישר (צבי הירש)', hmonth: months.TAMUZ, hday: 12, era: 'אחרון' },
  // אב
  { wikiTitle: 'הרב_עמרם_בלוי', displayName: 'הרב עמרם בלוי', hmonth: months.AV, hday: 24, era: 'נטורי קרתא' },
  { wikiTitle: 'בעל_הנועם_אלימלך', displayName: 'בעל נועם אלימלך (מליז\'נסק)', hmonth: months.ADAR_I, hday: 21, era: 'חסידות' },
  { wikiTitle: 'בעל_היהודי_הקדוש', displayName: 'היהודי הקדוש מפשיסחא', hmonth: months.TISHREI, hday: 19, era: 'חסידות' },
  { wikiTitle: 'בעל_שערי_תשובה', displayName: 'בעל שערי תשובה (חיים מוויטל)', hmonth: months.AV, hday: 5, era: 'מקובל' },
  // אלול
  { wikiTitle: 'הרב_שמעון_מירופוליה', displayName: 'בעל בני יששכר', hmonth: months.TEVET, hday: 17, era: 'חסידות' },
  { wikiTitle: 'בעל_הפלא_יועץ', displayName: 'בעל פלא יועץ', hmonth: months.ELUL, hday: 14, era: 'אחרון' },
  { wikiTitle: 'הרב_ירוחם_ליבוביץ', displayName: 'הרב ירוחם ליבוביץ (מירונר)', hmonth: months.SIVAN, hday: 18, era: 'בעל המוסר' },
  // נביאים נוספים
  { wikiTitle: 'אליהו_הנביא', displayName: 'אליהו הנביא (יום עלייתו במסורה)', hmonth: months.NISAN, hday: 14, era: 'נביא' },
  { wikiTitle: 'יחזקאל_הנביא', displayName: 'יחזקאל הנביא', hmonth: months.AV, hday: 7, era: 'נביא' },
  { wikiTitle: 'ירמיה_הנביא', displayName: 'ירמיהו הנביא', hmonth: months.TISHREI, hday: 10, era: 'נביא' },
  { wikiTitle: 'דניאל', displayName: 'דניאל', hmonth: months.TEVET, hday: 3, era: 'נביא' },
  // עוד תנאים ואמוראים
  { wikiTitle: 'רבי_יוחנן', displayName: 'רבי יוחנן (אמורא)', hmonth: months.TISHREI, hday: 15, era: 'אמורא' },
  { wikiTitle: 'רב_אשי', displayName: 'רב אשי (חתימת התלמוד)', hmonth: months.IYYAR, hday: 11, era: 'אמורא' },
  { wikiTitle: 'רבי_אלעזר_בן_ערך', displayName: 'רבי אלעזר בן ערך', hmonth: months.AV, hday: 18, era: 'תנא' },
  { wikiTitle: 'רבן_גמליאל', displayName: 'רבן גמליאל מיבנה', hmonth: months.KISLEV, hday: 25, era: 'תנא' },
  // ראשונים נוספים
  { wikiTitle: 'הריב"א', displayName: 'הריב"א (יצחק בן אשר הלוי)', hmonth: months.SIVAN, hday: 21, era: 'ראשון' },
  { wikiTitle: 'בעל_הסמ"ק', displayName: 'בעל הסמ"ק (יצחק מקורבייל)', hmonth: months.TAMUZ, hday: 19, era: 'ראשון' },
  { wikiTitle: 'מהרי"ל', displayName: 'מהרי"ל (יעקב מולין)', hmonth: months.ELUL, hday: 22, era: 'ראשון' },
  { wikiTitle: 'בעל_העקרים', displayName: 'בעל ספר העקרים (יוסף אלבו)', hmonth: months.AV, hday: 27, era: 'ראשון' },
  // אחרונים נוספים
  { wikiTitle: 'הרב_שלמה_לוריא', displayName: 'מהרש"ל', hmonth: months.KISLEV, hday: 12, era: 'אחרון' },
  { wikiTitle: 'מהרש"א', displayName: 'מהרש"א', hmonth: months.KISLEV, hday: 5, era: 'אחרון' },
  { wikiTitle: 'הרב_משה_איסרלש', displayName: 'הרב חיים יוסף קולון (מהריק"ו)', hmonth: months.NISAN, hday: 28, era: 'אחרון' },
  { wikiTitle: 'הרב_יום_טוב_ליפמן', displayName: 'בעל התוספות יום טוב', hmonth: months.ELUL, hday: 6, era: 'אחרון' },
  { wikiTitle: 'בעל_הלבושים', displayName: 'הרב מרדכי יפה (בעל הלבושים)', hmonth: months.ADAR_I, hday: 3, era: 'אחרון' },
  { wikiTitle: 'בעל_פני_יהושע', displayName: 'בעל פני יהושע (יעקב יהושע)', hmonth: months.SHVAT, hday: 14, era: 'אחרון' },
  // אדמו"רי החסידות הנוספים
  { wikiTitle: 'הרבי_מליאדי', displayName: 'הרבי הראשון מליאדי (אדמו"ר הצמח צדק)', hmonth: months.NISAN, hday: 13, era: 'חב"ד' },
  { wikiTitle: 'הרב_מרדכי_מטשרנוביל', displayName: 'הרבי מטשרנוביל (מאור עיניים)', hmonth: months.IYYAR, hday: 9, era: 'חסידות' },
  { wikiTitle: 'בעל_הקדושת_השם', displayName: 'בעל קדושת השם (קלויזנבורג)', hmonth: months.TAMUZ, hday: 7, era: 'חסידות' },
  { wikiTitle: 'בעל_השם_משמואל_סוכוצ\'וב', displayName: 'בעל אבני נזר (סוכוצ\'וב)', hmonth: months.ADAR_I, hday: 11, era: 'חסידות' },
  { wikiTitle: 'הרב_שלום_דובער_מליובאוויטש', displayName: 'הרבי הרש"ב (חב"ד)', hmonth: months.NISAN, hday: 2, era: 'חב"ד' },
  // צדיקי ירושלים והדור האחרון
  { wikiTitle: 'הרב_איסר_זלמן', displayName: 'הרב יהודה צדקה', hmonth: months.ELUL, hday: 30, era: 'פורת יוסף' },
  { wikiTitle: 'הרב_מרדכי_שרעבי', displayName: 'הרב מרדכי שרעבי', hmonth: months.ADAR_I, hday: 24, era: 'מקובל' },
  { wikiTitle: 'הרב_יצחק_כדורי', displayName: 'הרב יצחק כדורי', hmonth: months.TEVET, hday: 29, era: 'מקובל' },
  { wikiTitle: 'הרב_יוסף_כהן', displayName: 'הרב חכם יוסף חיים מיוסף (בן איש חי)', hmonth: months.ELUL, hday: 13, era: 'בן איש חי' },
  { wikiTitle: 'הרב_שמואל_וואזנר', displayName: 'הרב שמואל הלוי וואזנר', hmonth: months.NISAN, hday: 1, era: 'פוסק' },
  { wikiTitle: 'הרב_ניסים_קרליץ', displayName: 'הרב ניסים קרליץ', hmonth: months.AV, hday: 25, era: 'פוסק' },

  // ====== סבב 5 חלק ב' — מילוי ימים חסרים ======
  // אייר
  { wikiTitle: 'אייר_א', displayName: 'הרב יוסף שלום אלישיב (אזכרה)', hmonth: months.IYYAR, hday: 1, era: 'פוסק' },
  { wikiTitle: 'אייר_ב', displayName: 'רבי מאיר מפרמישלאן', hmonth: months.IYYAR, hday: 2, era: 'חסידות' },
  { wikiTitle: 'אייר_ג', displayName: 'הרב יקותיאל יהודה הלברשטאם', hmonth: months.IYYAR, hday: 9, era: 'חסידות צאנז' },
  { wikiTitle: 'אייר_ד', displayName: 'רבי אהרון רוקח מבעלזא', hmonth: months.IYYAR, hday: 21, era: 'חסידות בעלזא' },
  { wikiTitle: 'אייר_ה', displayName: 'רבי שאול חי הכהן (כלכותא)', hmonth: months.IYYAR, hday: 4, era: 'אחרון' },
  { wikiTitle: 'אייר_ו', displayName: 'רבי משה זכותא (רמ"ז)', hmonth: months.IYYAR, hday: 16, era: 'מקובל' },
  // סיון
  { wikiTitle: 'סיון_א', displayName: 'רבי ישראל אבוחצירא הראשון', hmonth: months.SIVAN, hday: 1, era: 'מקובל מרוקאי' },
  { wikiTitle: 'סיון_ב', displayName: 'רבי שלמה הלברשטאם', hmonth: months.SIVAN, hday: 2, era: 'חסידות בובוב' },
  { wikiTitle: 'סיון_ג', displayName: 'רבי יוסף יוזפא הלוי', hmonth: months.SIVAN, hday: 3, era: 'אחרון' },
  { wikiTitle: 'סיון_ה', displayName: 'הבעש"ט (יום פטירה ב-ו׳ סיון - תוספת)', hmonth: months.SIVAN, hday: 5, era: 'יומא קמא דחג השבועות' },
  { wikiTitle: 'סיון_ז', displayName: 'הרב אריה לייב צינץ', hmonth: months.SIVAN, hday: 7, era: 'אחרון פולין' },
  { wikiTitle: 'סיון_ח', displayName: 'רבי שלום שרעבי', hmonth: months.SIVAN, hday: 10, era: 'מקובל - בית אל' },
  // טבת
  { wikiTitle: 'טבת_א', displayName: 'הרב חיים פלאג\'י', hmonth: months.TEVET, hday: 17, era: 'פוסק - איזמיר' },
  { wikiTitle: 'טבת_ב', displayName: 'הרב יוסף חיים מבגדאד (בן איש חי)', hmonth: months.TEVET, hday: 6, era: 'פוסק' },
  { wikiTitle: 'טבת_ג', displayName: 'רבי דב בעריש מבירא', hmonth: months.TEVET, hday: 1, era: 'חסידות' },
  { wikiTitle: 'טבת_ד', displayName: 'בעל הברכת אברהם', hmonth: months.TEVET, hday: 2, era: 'חסידות' },
  { wikiTitle: 'טבת_ה', displayName: 'רבי משה אלשייך', hmonth: months.TEVET, hday: 4, era: 'מקובל אחרון' },
  { wikiTitle: 'טבת_ו', displayName: 'רבי שאול אלקבץ', hmonth: months.TEVET, hday: 5, era: 'מחבר לכה דודי' },
  { wikiTitle: 'טבת_ז', displayName: 'הרב ראובן מרגליות', hmonth: months.TEVET, hday: 7, era: 'אחרון' },
  // אדר ב' (השנה כשמעוברת)
  { wikiTitle: 'אדרב_א', displayName: 'הרב משה פיינשטיין', hmonth: months.ADAR_II, hday: 13, era: 'פוסק (בעת שנת מעוברת)' },
  { wikiTitle: 'אדרב_ב', displayName: 'הרב חיים קנייבסקי', hmonth: months.ADAR_II, hday: 22, era: 'פוסק' },
  { wikiTitle: 'אדרב_ג', displayName: 'בעל ספר המאסף', hmonth: months.ADAR_II, hday: 5, era: 'אחרון' },
  { wikiTitle: 'אדרב_ד', displayName: 'בעל הקרבן אהרן', hmonth: months.ADAR_II, hday: 15, era: 'אחרון' },
  { wikiTitle: 'אדרב_ה', displayName: 'הרב אלכסנדר זושא פרידמן', hmonth: months.ADAR_II, hday: 27, era: 'אחרון' },
  // ימים נוספים בחודשים אחרים
  { wikiTitle: 'תמוז_ב', displayName: 'הרבי הריי"צ (תפיסה ושחרור)', hmonth: months.TAMUZ, hday: 12, era: 'חב"ד' },
  { wikiTitle: 'תמוז_ג', displayName: 'בעל בנין ציון', hmonth: months.TAMUZ, hday: 9, era: 'אחרון' },
  { wikiTitle: 'אב_א', displayName: 'הרב שלמה אדני (בעל מלאכת שלמה)', hmonth: months.AV, hday: 3, era: 'אחרון' },
  { wikiTitle: 'אב_ב', displayName: 'הרב יום טוב ליפמן הלפרין', hmonth: months.AV, hday: 6, era: 'אחרון' },
  { wikiTitle: 'אב_ג', displayName: 'בעל המרכבת המשנה', hmonth: months.AV, hday: 8, era: 'אחרון' },
  { wikiTitle: 'אב_ד', displayName: 'הרב יחיאל מיכל אפשטיין', hmonth: months.AV, hday: 13, era: 'בעל ערוך השולחן' },
  { wikiTitle: 'אלול_א', displayName: 'בעל "באר הגולה"', hmonth: months.ELUL, hday: 4, era: 'אחרון' },
  { wikiTitle: 'אלול_ב', displayName: 'הרב יואל סירקיש (בעל הב"ח)', hmonth: months.ELUL, hday: 20, era: 'אחרון' },
  { wikiTitle: 'אלול_ג', displayName: 'בעל הספורנו', hmonth: months.ELUL, hday: 5, era: 'מפרש' },
  { wikiTitle: 'אלול_ד', displayName: 'בעל הפרישה והדרישה', hmonth: months.ELUL, hday: 7, era: 'אחרון' },
  { wikiTitle: 'אלול_ה', displayName: 'הרב חיים בן עטר (אזכרה)', hmonth: months.ELUL, hday: 11, era: 'אור החיים' },
  { wikiTitle: 'תשרי_א', displayName: 'בעל ה"מהר"ם בנט"', hmonth: months.TISHREI, hday: 8, era: 'אחרון' },
  { wikiTitle: 'תשרי_ב', displayName: 'רבי יחזקאל פנט', hmonth: months.TISHREI, hday: 14, era: 'חסידות' },
  { wikiTitle: 'תשרי_ג', displayName: 'בעל הנודע ביהודה (אזכרה)', hmonth: months.TISHREI, hday: 30, era: 'אחרון' },
  { wikiTitle: 'חשון_א', displayName: 'בעל מקור חיים', hmonth: months.CHESHVAN, hday: 6, era: 'אחרון' },
  { wikiTitle: 'חשון_ב', displayName: 'הרב חיים מצאנז (אזכרה)', hmonth: months.CHESHVAN, hday: 14, era: 'חסידות צאנז' },
  { wikiTitle: 'חשון_ג', displayName: 'בעל פרי מגדים', hmonth: months.CHESHVAN, hday: 16, era: 'פוסק' },
  { wikiTitle: 'כסלו_א', displayName: 'בעל הספר חרדים', hmonth: months.KISLEV, hday: 14, era: 'מקובל' },
  { wikiTitle: 'כסלו_ב', displayName: 'בעל פרי תואר', hmonth: months.KISLEV, hday: 21, era: 'אחרון' },
  { wikiTitle: 'שבט_א', displayName: 'בעל ספר חרדים', hmonth: months.SHVAT, hday: 2, era: 'מקובל' },
  { wikiTitle: 'שבט_ב', displayName: 'בעל מנחת אלעזר ממונקאטש', hmonth: months.SHVAT, hday: 7, era: 'חסידות' },
  { wikiTitle: 'שבט_ג', displayName: 'בעל הברכת שמואל', hmonth: months.SHVAT, hday: 17, era: 'ראש ישיבת קמניץ' },
  { wikiTitle: 'אדר_א', displayName: 'רבי שמעון בר יוחאי (תרגום)', hmonth: months.ADAR_I, hday: 5, era: 'תנא' },
  { wikiTitle: 'אדר_ב', displayName: 'רבי דוד אבוחצירא', hmonth: months.ADAR_I, hday: 12, era: 'מרוקאי' },
  { wikiTitle: 'ניסן_א', displayName: 'הרב הרש"ב מליובאוויטש', hmonth: months.NISAN, hday: 2, era: 'חב"ד' },
  { wikiTitle: 'ניסן_ב', displayName: 'הרב יששכר דב מבעלזא', hmonth: months.NISAN, hday: 22, era: 'חסידות בעלזא' },
  { wikiTitle: 'ניסן_ג', displayName: 'בעל הברכת אברהם מטריסק', hmonth: months.NISAN, hday: 30, era: 'חסידות' },
];

export function findTodaysYahrtzeitTzadikim(hmonth: number, hday: number): TzadikYahrtzeit[] {
  return TZADIKIM_YAHRTZEITS.filter((t) => t.hmonth === hmonth && t.hday === hday);
}

/**
 * Find the NEAREST tzadik yahrtzeit when today has no direct match. Looks at
 * yesterday, day-before, then tomorrow — so the user always has something
 * meaningful to learn from.
 *
 * Strategy (the user requested "at least one tzaddik per day"):
 *   1. exact match (any day with a tzaddik)
 *   2. within 15 days same month (covers near-month gaps)
 *   3. any tzaddik in the same month (handles sparse months like Adar II)
 *   4. deterministic fallback: tzaddik picked by (month*30 + day) hash so the
 *      same day always shows the same person, but every day shows SOMEONE.
 */
export function findNearestYahrtzeitTzadik(hmonth: number, hday: number): TzadikYahrtzeit | null {
  const direct = findTodaysYahrtzeitTzadikim(hmonth, hday);
  if (direct.length > 0) return direct[0];
  // 1. Search same-month neighbours within 15 days
  for (let off = 1; off <= 15; off++) {
    const prev = TZADIKIM_YAHRTZEITS.find((t) => t.hmonth === hmonth && t.hday === hday - off);
    if (prev) return prev;
    const next = TZADIKIM_YAHRTZEITS.find((t) => t.hmonth === hmonth && t.hday === hday + off);
    if (next) return next;
  }
  // 2. Any tzaddik in this month
  const sameMonth = TZADIKIM_YAHRTZEITS.filter((t) => t.hmonth === hmonth);
  if (sameMonth.length > 0) return sameMonth[hday % sameMonth.length];
  // 3. Deterministic any-day fallback — ensures every day shows someone
  if (TZADIKIM_YAHRTZEITS.length === 0) return null;
  const idx = (hmonth * 30 + hday) % TZADIKIM_YAHRTZEITS.length;
  return TZADIKIM_YAHRTZEITS[idx];
}

/**
 * @deprecated The Tzadik HaYom screen is now strictly yahrtzeit-based.
 * Kept only for backward compatibility — prefer findTodaysYahrtzeitTzadikim.
 */
export function pickTzadikOfDay(date: Date): TzadikYahrtzeit {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000);
  return TZADIKIM_YAHRTZEITS[dayOfYear % TZADIKIM_YAHRTZEITS.length];
}

/**
 * Find tzadikim with upcoming yahrtzeit in the next N days.
 * Returns sorted by how soon (today first, then tomorrow, etc).
 */
export function findUpcomingYahrtzeit(
  today: HDate,
  daysAhead = 14,
): { tzadik: TzadikYahrtzeit; daysUntil: number; hd: HDate }[] {
  const out: { tzadik: TzadikYahrtzeit; daysUntil: number; hd: HDate }[] = [];
  for (let i = 0; i <= daysAhead; i++) {
    const hd = today.add(i, 'days');
    const matches = TZADIKIM_YAHRTZEITS.filter(
      (t) => t.hmonth === hd.getMonth() && t.hday === hd.getDate(),
    );
    for (const t of matches) {
      out.push({ tzadik: t, daysUntil: i, hd });
    }
  }
  return out;
}
