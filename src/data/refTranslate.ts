import { hebrewNumeral } from './hebrewNumbers';

const BOOK_HE: Record<string, string> = {
  Genesis: 'בראשית', Exodus: 'שמות', Leviticus: 'ויקרא', Numbers: 'במדבר', Deuteronomy: 'דברים',
  Joshua: 'יהושע', Judges: 'שופטים', 'I Samuel': 'שמואל א׳', 'II Samuel': 'שמואל ב׳',
  'I Kings': 'מלכים א׳', 'II Kings': 'מלכים ב׳', Isaiah: 'ישעיהו', Jeremiah: 'ירמיהו', Ezekiel: 'יחזקאל',
  Hosea: 'הושע', Joel: 'יואל', Amos: 'עמוס', Obadiah: 'עובדיה', Jonah: 'יונה', Micah: 'מיכה',
  Nahum: 'נחום', Habakkuk: 'חבקוק', Zephaniah: 'צפניה', Haggai: 'חגי', Zechariah: 'זכריה', Malachi: 'מלאכי',
  Psalms: 'תהילים', Proverbs: 'משלי', Job: 'איוב', 'Song of Songs': 'שיר השירים', Ruth: 'רות',
  Lamentations: 'איכה', Ecclesiastes: 'קהלת', Esther: 'אסתר', Daniel: 'דניאל',
  Ezra: 'עזרא', Nehemiah: 'נחמיה', 'I Chronicles': 'דברי הימים א׳', 'II Chronicles': 'דברי הימים ב׳',

  Berakhot: 'ברכות', Shabbat: 'שבת', Eruvin: 'עירובין', Pesachim: 'פסחים', Shekalim: 'שקלים',
  Yoma: 'יומא', Sukkah: 'סוכה', Beitzah: 'ביצה', 'Rosh Hashanah': 'ראש השנה', Taanit: 'תענית',
  Megillah: 'מגילה', 'Moed Katan': 'מועד קטן', Chagigah: 'חגיגה', Yevamot: 'יבמות', Ketubot: 'כתובות',
  Nedarim: 'נדרים', Nazir: 'נזיר', Sotah: 'סוטה', Gittin: 'גיטין', Kiddushin: 'קידושין',
  'Bava Kamma': 'בבא קמא', 'Bava Metzia': 'בבא מציעא', 'Bava Batra': 'בבא בתרא', Sanhedrin: 'סנהדרין',
  Makkot: 'מכות', Shevuot: 'שבועות', 'Avodah Zarah': 'עבודה זרה', Horayot: 'הוריות', Zevachim: 'זבחים',
  Menachot: 'מנחות', Chullin: 'חולין', Bekhorot: 'בכורות', Arakhin: 'ערכין', Temurah: 'תמורה',
  Keritot: 'כריתות', Meilah: 'מעילה', Niddah: 'נדה',

  Mishnah: 'משנה', 'Mishneh Torah': 'משנה תורה', 'Shulchan Arukh': 'שולחן ערוך',
  'Arukh HaShulchan': 'ערוך השולחן', 'Orach Chayim': 'אורח חיים', 'Orach Chaim': 'אורח חיים',
  'Yoreh Deah': 'יורה דעה', 'Even HaEzer': 'אבן העזר', 'Choshen Mishpat': 'חושן משפט',
  'Yalkut Yosef': 'ילקוט יוסף', Tanya: 'תניא', Onkelos: 'אונקלוס',
  Rashi: 'רש"י', 'Rashi on': 'רש"י על',
  Sabbath: 'הלכות שבת', Vows: 'הלכות נדרים', Nazariteship: 'הלכות נזירות',
  'Jerusalem Talmud': 'ירושלמי',
};

const HE_RANGE_SEP = '-';

/**
 * Translate a Sefaria English ref to Hebrew with Hebrew numerals.
 * "Numbers 5:1-5:10" → "במדבר ה׳:א׳-י׳"
 * "Mishnah Kelim 5:9-10" → "משנה כלים ה׳:ט׳-י׳"
 * "Chullin 26" → "חולין כ״ו"
 */
export function translateRef(ref: string): string {
  if (!ref) return '';
  let out = ref;

  // Replace book names (longest first to avoid partial matches)
  const books = Object.keys(BOOK_HE).sort((a, b) => b.length - a.length);
  for (const en of books) {
    const re = new RegExp(`\\b${en.replace(/\s+/g, '\\s+')}\\b`, 'g');
    out = out.replace(re, BOOK_HE[en]);
  }

  // Replace digit sequences with Hebrew numerals
  out = out.replace(/(\d+)/g, (_m, num) => hebrewNumeral(parseInt(num, 10)));

  // Replace separators
  out = out.replace(/\s*,\s*/g, ' ');
  return out;
}
