export type Tool = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  /** Optional Lucide icon name. When set, the UI renders the icon instead
      of the emoji (matches the agreed design with consistent line icons). */
  iconName?: string;
  route: string;
  tone?: 'default' | 'accent';
  category: ToolCategory;
};

export type ToolCategory =
  | 'time'
  | 'tfila'
  | 'moadim'
  | 'mitzvot'
  | 'learning'
  | 'lifecycle'
  | 'location'
  | 'calc'
  | 'personal';

export const CATEGORIES: Array<{ id: ToolCategory; label: string }> = [
  { id: 'time', label: 'זמנים ולוח שנה' },
  { id: 'tfila', label: 'תפילות וטקסטים' },
  { id: 'moadim', label: 'מועדי השנה' },
  { id: 'mitzvot', label: 'מצוות וברכות' },
  { id: 'learning', label: 'לימוד' },
  { id: 'lifecycle', label: 'מעגלי חיים' },
  { id: 'location', label: 'מיקום וניווט' },
  { id: 'calc', label: 'מחשבונים והמרות' },
  { id: 'personal', label: 'מעקב אישי' },
];

export const TOOLS: Tool[] = [
  // ============================================================
  // זמנים ולוח שנה
  // ============================================================
  { id: 'zmanim', title: 'זמני היום', description: 'נץ, סוז"ש, שקיעה, צאת', emoji: '🌅', iconName: 'sun', route: '/zmanim', category: 'time' },
  { id: 'motzaei-shabbat', title: 'מוצאי שבת', description: 'זמני יציאה + הבדלה', emoji: '🌃', iconName: 'moon', route: '/tools/motzaei-shabbat', category: 'time' },
  { id: 'molad', title: 'מולד וברכת הלבנה', description: 'חלון הברכה החודשי', emoji: '🌙', iconName: 'moon', route: '/tools/molad', category: 'time' },
  { id: 'tekufot', title: 'תקופות השנה', description: 'מעבר תקופה + השפעה הלכתית', emoji: '🍂', iconName: 'sunrise', route: '/tools/tekufot', category: 'time' },
  { id: 'tal-geshem', title: 'חזקה לטל וגשם', description: 'מונה 90 תפילות', emoji: '💧', iconName: 'water', route: '/tools/tal-geshem', category: 'time' },

  // ============================================================
  // תפילות וטקסטים
  // ============================================================
  // סידור ותפילות בסיסיות
  { id: 'tfilon', title: 'סידור תפילה', description: 'אשכנז / ספרד / עדות מזרח / חב"ד', emoji: '📖', iconName: 'book', route: '/tfilon', category: 'tfila' },
  { id: 'tehillim', title: 'תהילים', description: '150 פרקים + פרק יומי', emoji: '📜', iconName: 'scroll', route: '/tehillim', category: 'tfila' },
  { id: 'tfilot', title: 'תפילות קצרות', description: 'שמע, ברה"מ, ק"ש על המיטה, תפילת הדרך', emoji: '📿', iconName: 'book', route: '/tfilot', category: 'tfila' },
  { id: 'tefila-today', title: 'תוספות לתפילה היום', description: 'יעלה ויבוא, על הניסים, עננו', emoji: '✨', iconName: 'calendarTime', route: '/tools/tefila-today', category: 'tfila' },
  // עזרי תפילה
  { id: 'compass', title: 'מצפן תפילה לירושלים', description: 'GPS + כיוון המכשיר', emoji: '🧭', iconName: 'compass', route: '/tools/compass', category: 'tfila' },
  // 'shul-halachot' removed per user request — the dedicated page added nothing on top of the Sefaria entries.
  // תפילות מיוחדות
  { id: 'tikkun-klali', title: 'תיקון הכללי', description: '10 פרקי ר׳ נחמן', emoji: '🌟', iconName: 'star', route: '/tools/tikkun-klali', category: 'tfila' },
  { id: 'perekshira', title: 'פרק שירה', description: 'שירת הבריאה', emoji: '🐦', iconName: 'volume', route: '/tools/perek-shira', category: 'tfila' },
  // תפילות לחולים ובקבוצה
  { id: 'cholim', title: 'רשימת חולים לתפילה', description: 'מי שברך + יהי רצון לרפאינו', emoji: '🩹', iconName: 'book', route: '/tools/cholim', category: 'tfila' },
  { id: 'refuah-acrostic', title: 'תהילים לרפואה לפי שם', description: 'פרקי קי"ט לאותיות השם', emoji: '🙏', iconName: 'book', route: '/tools/refuah-acrostic', category: 'tfila' },
  { id: 'tehillim-split', title: 'חלוקת תהילים בקבוצה', description: '150 פרקים בין משתתפים', emoji: '👥', iconName: 'book', route: '/tools/tehillim-split', category: 'tfila' },

  // ============================================================
  // מועדי השנה (לפי הסדר במחזור)
  // ============================================================
  // ספירת העומר
  { id: 'omer', title: 'ספירת העומר', description: 'מד יומי + ברכה + מידת היום', emoji: '🌾', iconName: 'wheat', route: '/tools/omer', category: 'moadim' },
  // ימים נוראים
  { id: 'selichot', title: 'סליחות', description: 'נוסח אשכנז וספרד', emoji: '💭', iconName: 'moon', route: '/tools/selichot', category: 'moadim' },
  { id: 'hatarat-nedarim', title: 'התרת נדרים', description: 'נוסח אשכנז וספרד', emoji: '📜', iconName: 'scroll', route: '/tools/hatarat-nedarim', category: 'moadim' },
  { id: 'kaparot', title: 'כפרות', description: 'ערב יום כיפור - נוסח', emoji: '🐓', iconName: 'fish', route: '/tools/kaparot', category: 'moadim' },
  // סוכות
  { id: 'eruv-tavshilin', title: 'ערוב תבשילין', description: 'יו"ט שחל ביום שישי', emoji: '🍞', iconName: 'wheat', route: '/tools/eruv-tavshilin', category: 'moadim' },
  { id: 'arba-minim', title: 'בדיקת ארבעת המינים', description: 'מדריך מלא לפי מין', emoji: '🍋', iconName: 'wheat', route: '/tools/arba-minim', category: 'moadim' },
  { id: 'netilat-arba-minim', title: 'נטילת ארבעת המינים', description: 'לשם יחוד, ברכה וניענוע', emoji: '🌿', iconName: 'wheat', route: '/tools/netilat-arba-minim', category: 'moadim' },
  { id: 'hoshanot', title: 'הושענות', description: '7 ימי סוכות + הקפות', emoji: '🌿', iconName: 'wheat', route: '/tools/hoshanot', category: 'moadim' },
  { id: 'lavud-photo', title: 'מודד לבוד', description: 'צילום + AI - מדידה אוטומטית', emoji: '📐', iconName: 'ruler', route: '/tools/lavud-photo', category: 'moadim' },
  { id: 'sechach-meter', title: 'מודד צילתה מרובה מחמתה', description: 'ניתוח תמונת סכך', emoji: '☀️', iconName: 'sun', route: '/tools/sechach-meter', category: 'moadim' },
  // חנוכה / ט"ו בשבט / פורים
  { id: 'tu-bishvat', title: 'ט"ו בשבט', description: 'סדר + פירות שבעת המינים', emoji: '🌳', iconName: 'fruit', route: '/tools/tu-bishvat', category: 'moadim' },
  { id: 'purim', title: 'פורים', description: '4 מצוות + מקרא מגילה', emoji: '🎭', iconName: 'star', route: '/tools/purim', category: 'moadim' },
  { id: 'raashan', title: 'רעשן פורים', description: 'לכל הזכרת המן - 5 צלילים', emoji: '🪅', iconName: 'volume', route: '/tools/raashan', category: 'moadim' },
  // פסח
  { id: 'bedikat-chametz', title: 'בדיקת חמץ', description: 'צ׳ק-ליסט + נוסחים', emoji: '🔍', iconName: 'search', route: '/tools/bedikat-chametz', category: 'moadim' },
  { id: 'kashering', title: 'הכשרת המטבח לפסח', description: 'מדריך כושרות לפסח', emoji: '🫕', iconName: 'flame', route: '/tools/kashering', category: 'moadim' },
  { id: 'kashering-sim', title: 'סימולטור הכשרות', description: 'שאלות תקלות במטבח', emoji: '❓', iconName: 'helpCircle', route: '/tools/kashering-simulator', category: 'moadim' },
  { id: 'kashering-vessels', title: 'הוראות הכשרת כלים', description: 'לא לפסח · מדריך כושרות', emoji: '🍽', iconName: 'utensils', route: '/tools/kashering-vessels', category: 'moadim' },

  // ============================================================
  // מצוות וברכות
  // ============================================================
  // ברכות
  { id: 'brachot', title: 'ברכות מיוחדות', description: 'ים, לבנה, אילנות - עם GPS', emoji: '🌊', iconName: 'sparkles', route: '/brachot', category: 'mitzvot' },
  { id: 'brachot-db', title: 'מאגר ברכות', description: 'הנהנין + הראייה', emoji: '✨', iconName: 'library', route: '/brachot/db', category: 'mitzvot' },
  { id: 'hundred-brachot', title: '100 ברכות יומיות', description: 'מד עם autocount מתפילות', emoji: '💯', iconName: 'book', route: '/tools/hundred-brachot', category: 'mitzvot' },
  // כשרות
  { id: 'meatmilk', title: 'מונה בשר/חלב', description: '6 או 3 שעות + שעון פעיל', emoji: '🥩', iconName: 'utensils', route: '/tools/meatmilk', category: 'mitzvot' },
  { id: 'bug-check', title: 'בדיקת חרקים', description: 'מדריך מפורט לפי סוג מאכל', emoji: '🦟', iconName: 'eye', route: '/tools/bug-check', category: 'mitzvot' },
  { id: 'cosmetics-check', title: 'בדיקת קוסמטיקה', description: 'ניתוח רכיבים מתוך תמונה', emoji: '💄', iconName: 'sparkles', route: '/tools/cosmetics-check', category: 'mitzvot' },
  // מצוות התלויות בארץ
  { id: 'trumot', title: 'תרומות ומעשרות', description: 'נוסח ושלבי הפרשה', emoji: '🌾', iconName: 'wheat', route: '/halacha/trumot', category: 'mitzvot' },
  { id: 'maasrot-calc', title: 'מחשבון תרו"מ', description: 'כמה גרם מכל סוג', emoji: '⚖️', iconName: 'scale', route: '/halacha/maasrot-calc', category: 'mitzvot' },
  { id: 'challah', title: 'הפרשת חלה', description: 'שיעורים, נוסח, רשימת מאפים', emoji: '🥖', iconName: 'wheat', route: '/halacha/challah', category: 'mitzvot' },
  { id: 'orla', title: 'מחשבון ערלה', description: 'לפי שנת נטיעה עברית', emoji: '🍎', iconName: 'fruit', route: '/halacha/orla', category: 'mitzvot' },
  { id: 'shemita', title: 'שביעית', description: 'לוח ביעור + קדושת שביעית', emoji: '🌱', iconName: 'wheat', route: '/halacha/shemita', category: 'mitzvot' },
  { id: 'kilayim', title: 'כלאיים', description: 'הרחקות בגינה ביתית', emoji: '🌿', iconName: 'wheat', route: '/halacha/kilayim', category: 'mitzvot' },
  // חיפוש הלכה — removed per Rabbi Dvir's review (was a rough digest, not authoritative).

  // ============================================================
  // לימוד
  // ============================================================
  { id: 'halacha-yomit-kosharot', title: 'הלכה יומית', description: 'לימוד יומי לפי תאריך עברי', emoji: '📘', iconName: 'book', route: '/learn/halacha-yomit-kosharot', category: 'learning' },
  { id: 'shnayim', title: 'שניים מקרא', description: 'צ׳ק-ליסט שבועי', emoji: '✦', iconName: 'book', route: '/tools/shnayim', category: 'learning' },
  { id: 'parsha', title: 'פרשת השבוע', description: 'טקסט מלא מ-Sefaria', emoji: '📖', iconName: 'book', route: '/tools/parsha', category: 'learning' },
  { id: 'chok-lyisrael', title: 'חוק לישראל', description: '7 מקורות יומיים', emoji: '📚', iconName: 'book', route: '/tools/chok-lyisrael', category: 'learning' },
  { id: 'daily-quiz', title: 'חידון יומי', description: 'שאלה אחת בכל יום', emoji: '🎲', iconName: 'helpCircle', route: '/tools/daily-quiz', category: 'learning' },
  { id: 'tzadik', title: 'הצדיק של היום', description: 'יארצייטים + ביוגרפיה', emoji: '✨', iconName: 'star', route: '/tools/tzadik', category: 'learning' },
  { id: 'jewish-history', title: 'היום בהיסטוריה', description: 'מאורעות בתאריך עברי זה', emoji: '📜', iconName: 'scroll', route: '/tools/jewish-history', category: 'learning' },
  { id: 'learning-plan', title: 'תוכניות לימוד', description: 'יעדים + קצב יומי', emoji: '🎯', iconName: 'graduation', route: '/tools/learning-plan', category: 'learning' },
  { id: 'books-learned', title: 'ספרים שלמדתי', description: 'מעקב סיומים', emoji: '📚', iconName: 'book', route: '/tools/books-learned', category: 'learning' },
  { id: 'chiddushim', title: 'פנקס חידושים', description: 'שמירת חידושים אישיים', emoji: '✍️', iconName: 'notebook', route: '/tools/chiddushim', category: 'learning' },
  { id: 'ask-chavruta', title: 'הרב שלך בכשרות', description: 'AI · שאל שאלות כשרות', emoji: '🤖', iconName: 'ai', route: '/tools/ask-chavruta', category: 'learning', tone: 'accent' },

  // ============================================================
  // מעגלי חיים (לפי הסדר הטבעי בחיים)
  // ============================================================
  { id: 'brit', title: 'ברית מילה', description: 'חישוב + ברכות + סדר', emoji: '👶', iconName: 'heart', route: '/tools/brit', category: 'lifecycle' },
  { id: 'pidyon', title: 'פדיון הבן', description: 'חישוב יום 31 + נוסחים', emoji: '🪙', iconName: 'percent', route: '/tools/pidyon', category: 'lifecycle' },
  { id: 'chuppah', title: 'הכנות לחופה', description: 'צ׳ק-ליסט + 7 ברכות', emoji: '💒', iconName: 'heart', route: '/tools/chuppah', category: 'lifecycle' },
  { id: 'tahara', title: 'לוח טהרה', description: 'זמני פרישה + הערכת ביוץ', emoji: '🕊️', iconName: 'water', route: '/tools/tahara', category: 'lifecycle' },
  { id: 'aveilus', title: 'תאריכי אבלות', description: 'שבעה, שלושים, יב חודש', emoji: '🕯️', iconName: 'flame', route: '/tools/aveilus', category: 'lifecycle' },
  { id: 'yahrzeit', title: 'יארצייט וקדיש', description: 'מעקב + תזכורות אוטומטיות', emoji: '🕯️', iconName: 'flame', route: '/tools/yahrzeit', category: 'lifecycle' },
  { id: 'kever-visit', title: 'עליה לקבר', description: 'נוסח + אותיות שם ונשמה', emoji: '🪦', iconName: 'pin', route: '/tools/kever-visit', category: 'lifecycle' },
  { id: 'mishnayos-neshama', title: 'משניות לעילוי נשמה', description: 'פרקי משנה לפי אותיות השם', emoji: '📚', iconName: 'book', route: '/tools/mishnayos-neshama', category: 'lifecycle' },

  // ============================================================
  // מיקום וניווט
  // ============================================================
  { id: 'travel', title: 'תפילת הדרך אוטומטית', description: 'התראת GPS כשמתחילים נסיעה', emoji: '🚗', iconName: 'book', route: '/tools/travel', category: 'location' },
  { id: 'minyan-finder', title: 'מאתר מניין', description: '120+ בתי כנסת + זמני תפילה', emoji: '📿', iconName: 'book', route: '/tools/minyan-finder', category: 'location' },
  { id: 'mikvah-finder', title: 'מאתר מקווה', description: '160+ מקוואות + ניווט', emoji: '💧', iconName: 'water', route: '/tools/mikvah-finder', category: 'location' },
  { id: 'kvarim', title: 'קברי צדיקים', description: 'מאגר + ניווט + תפילה', emoji: '🕯️', iconName: 'flame', route: '/tools/kvarim', category: 'location' },
  { id: 'kosher-restaurants', title: 'מסעדות כשרות', description: 'מאגר עסקים עם השגחה', emoji: '🍽️', iconName: 'utensils', route: '/tools/kosher-restaurants', category: 'location' },
  { id: 'shul-times', title: 'זמני בה״כ שלי', description: 'צילום לוח → תזכורות', emoji: '📷', iconName: 'clock', route: '/tools/shul-times', category: 'location' },

  // ============================================================
  // מחשבונים והמרות
  // ============================================================
  { id: 'dates', title: 'המרת תאריכים', description: 'עברי ↔ לועזי', emoji: '📆', iconName: 'calendar', route: '/tools/dates', category: 'calc' },
  { id: 'hebrew-birthday', title: 'יום הולדת עברי', description: 'גיל עברי + ספירה לקראת', emoji: '🎂', iconName: 'calendarHebrew', route: '/tools/hebrew-birthday', category: 'calc' },
  { id: 'gematria', title: 'גימטריה', description: '7 שיטות חישוב', emoji: '🔢', iconName: 'hash', route: '/tools/gematria', category: 'calc' },
  { id: 'shiurim', title: 'שיעורי חז״ל', description: 'כזית, רביעית, אמה, פרסה', emoji: '⚖️', iconName: 'scale', route: '/tools/shiurim', category: 'calc' },

  // ============================================================
  // מעקב אישי
  // ============================================================
  { id: 'maaser', title: 'מעשר כספים', description: 'מעקב הכנסות ונתינה', emoji: '💰', iconName: 'sparkles', route: '/tools/maaser', category: 'personal' },
  { id: 'lashon-hara', title: 'שמירת הלשון', description: 'מעקב יומי + טיפים', emoji: '🤫', iconName: 'sparkles', route: '/tools/lashon-hara', category: 'personal' },
  { id: 'parent-call', title: 'כיבוד הורים', description: 'תזכורת התקשרות שבועית', emoji: '📞', iconName: 'phone', route: '/tools/parent-call', category: 'personal' },
];

export const TOOLS_BY_ID: Record<string, Tool> = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

/** Default shortcuts shown to new users (before they pin anything). */
export const DEFAULT_SHORTCUT_IDS = [
  'tfilon',
  'tehillim',
  'zmanim',
  'halacha-yomit-kosharot',
  'ask-chavruta',
  'kosher-restaurants',
];
