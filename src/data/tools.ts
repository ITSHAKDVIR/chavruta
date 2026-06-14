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
  { id: 'zmanim', title: 'זמני היום', description: 'כל הזמנים ההלכתיים ליום שלך - נץ, סוז"ש, חצות, מנחה, שקיעה, צאת', emoji: '🌅', iconName: 'sun', route: '/zmanim', category: 'time' },
  { id: 'motzaei-shabbat', title: 'מוצאי שבת', description: 'מתי מותר לעשות מלאכה במוצ"ש לפי 7 שיטות + נוסח הבדלה', emoji: '🌃', iconName: 'moonStar', route: '/tools/motzaei-shabbat', category: 'time' },
  { id: 'molad', title: 'מולד וברכת הלבנה', description: 'חישוב המולד החודשי וחלון ברכת הלבנה (3-15 בחודש)', emoji: '🌙', iconName: 'moon', route: '/tools/molad', category: 'time' },
  { id: 'tekufot', title: 'תקופות השנה', description: 'מעבר תקופת ניסן/תמוז/תשרי/טבת + השפעה על תפילת הגשם', emoji: '🍂', iconName: 'cloudSunRain', route: '/tools/tekufot', category: 'time' },
  { id: 'tal-geshem', title: 'חזקה לטל וגשם', description: 'מד 90 תפילות לחזקה בנוסח החורף, מתחיל מ-ז\' חשון', emoji: '💧', iconName: 'cloudRain', route: '/tools/tal-geshem', category: 'time' },

  // ============================================================
  // תפילות וטקסטים
  // ============================================================
  { id: 'tfilon', title: 'סידור תפילה', description: '4 נוסחים: אשכנז, ספרד, עדות מזרח, חב"ד - מסונן לפי היום', emoji: '📖', iconName: 'book', route: '/tfilon', category: 'tfila' },
  { id: 'tehillim', title: 'תהילים', description: '150 פרקים + פרק יומי + חלוקה לקבוצה להבראת חולה', emoji: '📜', iconName: 'scrollText', route: '/tehillim', category: 'tfila' },
  { id: 'tfilot', title: 'תפילות קצרות', description: 'שמע, ברה"מ, ק"ש על המיטה, תפילת הדרך, אשר יצר ועוד', emoji: '📿', iconName: 'feather', route: '/tfilot', category: 'tfila' },
  { id: 'tefila-today', title: 'תוספות לתפילה היום', description: 'יעלה ויבוא, על הניסים, עננו - מתחלפים אוטומטית לפי היום', emoji: '✨', iconName: 'calendarTime', route: '/tools/tefila-today', category: 'tfila' },
  { id: 'compass', title: 'מצפן תפילה לירושלים', description: 'GPS + מצפן הטלפון מחשבים את הכיוון המדויק להר הבית', emoji: '🧭', iconName: 'compass', route: '/tools/compass', category: 'tfila' },
  { id: 'tikkun-klali', title: 'תיקון הכללי', description: '10 פרקי תהילים שתיקן ר׳ נחמן מברסלב כסגולה כללית', emoji: '🌟', iconName: 'sparkles', route: '/tools/tikkun-klali', category: 'tfila' },
  { id: 'perekshira', title: 'פרק שירה', description: 'שירת בעלי החיים והצמחים לבורא עולם, פסוקים מהתנ"ך', emoji: '🐦', iconName: 'bird', route: '/tools/perek-shira', category: 'tfila' },
  { id: 'cholim', title: 'רשימת חולים לתפילה', description: 'נהל רשימת חולים אישית ושלב אותה בתפילת מי שברך', emoji: '🩹', iconName: 'bandage', route: '/tools/cholim', category: 'tfila' },
  { id: 'refuah-acrostic', title: 'תהילים לרפואה לפי שם', description: 'פרקי קי"ט (אלפא ביתא) מחולקים לפי אותיות שם החולה', emoji: '🙏', iconName: 'heartHandshake', route: '/tools/refuah-acrostic', category: 'tfila' },
  { id: 'tehillim-split', title: 'חלוקת תהילים בקבוצה', description: 'מחלק את 150 הפרקים בין משתתפי קבוצה (לחולה/לזכרון)', emoji: '👥', iconName: 'usersRound', route: '/tools/tehillim-split', category: 'tfila' },

  // ============================================================
  // מועדי השנה
  // ============================================================
  { id: 'omer', title: 'ספירת העומר', description: 'ספירה אוטומטית מליל ב\' פסח עד ערב שבועות + מידת היום', emoji: '🌾', iconName: 'wheat', route: '/tools/omer', category: 'moadim' },
  { id: 'selichot', title: 'סליחות', description: 'נוסח מלא אשכנז וספרד - מסונן ליום הספציפי בלוח הסליחות', emoji: '💭', iconName: 'cloudMoon', route: '/tools/selichot', category: 'moadim' },
  { id: 'hatarat-nedarim', title: 'התרת נדרים', description: 'נוסח בית דין לערב ראש השנה - אשכנז וספרד', emoji: '📜', iconName: 'unlink', route: '/tools/hatarat-nedarim', category: 'moadim' },
  { id: 'kaparot', title: 'כפרות', description: 'נוסח "זה חליפתי" - לכפרות כסף (מומלץ) או תרנגול', emoji: '🐓', iconName: 'coins', route: '/tools/kaparot', category: 'moadim' },
  { id: 'eruv-tavshilin', title: 'עירוב תבשילין', description: 'לימי יו"ט שחל ביום שישי - נוסח + מה צריך להכין', emoji: '🍞', iconName: 'cookingPot', route: '/tools/eruv-tavshilin', category: 'moadim' },
  { id: 'arba-minim', title: 'בדיקת ארבעת המינים', description: 'קריטריוני כשרות מ"כושרות" - לולב, אתרוג, הדס, ערבה', emoji: '🍋', iconName: 'citrus', route: '/tools/arba-minim', category: 'moadim' },
  { id: 'netilat-arba-minim', title: 'נטילת ארבעת המינים', description: 'לשם יחוד + ברכה + כיווני הניענוע לכל יום', emoji: '🌿', iconName: 'leaf', route: '/tools/netilat-arba-minim', category: 'moadim' },
  { id: 'hoshanot', title: 'הושענות', description: 'הושענות לכל יום מסוכות - מסתגל אוטומטית לפי היום', emoji: '🌿', iconName: 'palmtree', route: '/tools/hoshanot', category: 'moadim' },
  { id: 'lavud-photo', title: 'מודד לבוד', description: 'צילום הסכך/הקיר → AI מודד פערים אוטומטית', emoji: '📐', iconName: 'camera', route: '/tools/lavud-photo', category: 'moadim' },
  { id: 'sechach-meter', title: 'מודד צילתה מרובה מחמתה', description: 'ניתוח תמונת סכך לבדוק אם הסכך מספיק', emoji: '☀️', iconName: 'shieldHalf', route: '/tools/sechach-meter', category: 'moadim' },
  { id: 'tu-bishvat', title: 'ט"ו בשבט', description: 'סדר ט"ו בשבט + מדרשים על שבעת המינים', emoji: '🌳', iconName: 'trees', route: '/tools/tu-bishvat', category: 'moadim' },
  { id: 'purim', title: 'פורים', description: '4 מצוות פורים + מקרא מגילה + שושנת יעקב', emoji: '🎭', iconName: 'venetianMask', route: '/tools/purim', category: 'moadim' },
  { id: 'raashan', title: 'רעשן פורים', description: '5 צלילי רעשן + הפעלה בכל הזכרת המן במגילה', emoji: '🪅', iconName: 'music2', route: '/tools/raashan', category: 'moadim' },
  { id: 'bedikat-chametz', title: 'בדיקת חמץ', description: 'צ׳ק-ליסט מקומות בבית + נוסחי ברכה וביטול', emoji: '🔍', iconName: 'flashlight', route: '/tools/bedikat-chametz', category: 'moadim' },
  { id: 'kashering', title: 'הכשרת המטבח לפסח', description: 'מדריך הכושרות המלא - מה ניתן להכשיר ואיך', emoji: '🫕', iconName: 'flame', route: '/tools/kashering', category: 'moadim' },
  { id: 'kashering-sim', title: 'סימולטור הכשרות', description: 'שאלות תקלות במטבח ("כף בשרית בסיר חלבי") + תשובה', emoji: '❓', iconName: 'helpCircle', route: '/tools/kashering-simulator', category: 'moadim' },
  { id: 'kashering-vessels', title: 'הוראות הכשרת כלים', description: 'מדריך הכשרת כלים חדשים - הגעלה, ליבון, טבילה', emoji: '🍽', iconName: 'utensilsCrossed', route: '/tools/kashering-vessels', category: 'moadim' },

  // ============================================================
  // מצוות וברכות
  // ============================================================
  { id: 'brachot', title: 'ברכות מיוחדות', description: 'ברכת הים, הלבנה, אילנות - הצעות אוטומטיות לפי GPS', emoji: '🌊', iconName: 'waves', route: '/brachot', category: 'mitzvot' },
  { id: 'brachot-db', title: 'מאגר ברכות', description: 'מאגר ברכות הנהנין והראייה - חיפוש לפי מאכל/מראה', emoji: '✨', iconName: 'listChecks', route: '/brachot/db', category: 'mitzvot' },
  { id: 'hundred-brachot', title: '100 ברכות יומיות', description: 'מד אוטומטי שסופר את ברכותיך מהתפילות + ברכות הנהנין', emoji: '💯', iconName: 'checkCheck', route: '/tools/hundred-brachot', category: 'mitzvot' },
  { id: 'meatmilk', title: 'מונה בשר/חלב', description: 'טיימר המתנה: 1, 3, 5, 5.5, 6 שעות - לפי המנהג שלך', emoji: '🥩', iconName: 'beef', route: '/tools/meatmilk', category: 'mitzvot' },
  { id: 'bug-check', title: 'בדיקת חרקים', description: 'מדריך ויזואלי לכל ירק/פרי - איך בודקים ומה מחפשים', emoji: '🦟', iconName: 'bug', route: '/tools/bug-check', category: 'mitzvot' },
  { id: 'cosmetics-check', title: 'בדיקת קוסמטיקה', description: 'צילום רכיבים → ניתוח AI לרכיבים בעייתיים מבחינת כשרות', emoji: '💄', iconName: 'brush', route: '/tools/cosmetics-check', category: 'mitzvot' },
  { id: 'trumot', title: 'תרומות ומעשרות', description: 'נוסח ההפרשה + 6 שלבים מסודרים + ברכה', emoji: '🌾', iconName: 'leafyGreen', route: '/halacha/trumot', category: 'mitzvot' },
  { id: 'maasrot-calc', title: 'מחשבון תרו"מ', description: 'כמה גרם להפריש מכל סוג פרי/ירק/דגן', emoji: '⚖️', iconName: 'calculator', route: '/halacha/maasrot-calc', category: 'mitzvot' },
  { id: 'challah', title: 'הפרשת חלה', description: '5 שיטות כושרות לשיעור חיוב + נוסח + רשימת מאפים', emoji: '🥖', iconName: 'croissant', route: '/halacha/challah', category: 'mitzvot' },
  { id: 'orla', title: 'מחשבון ערלה', description: 'חישוב לפי שנת נטיעה עברית - מתי הפרי מותר באכילה', emoji: '🍎', iconName: 'apple', route: '/halacha/orla', category: 'mitzvot' },
  { id: 'shemita', title: 'שביעית', description: 'לוח ביעור פירות שביעית + קדושת שביעית', emoji: '🌱', iconName: 'sprout', route: '/halacha/shemita', category: 'mitzvot' },
  { id: 'kilayim', title: 'כלאיים', description: 'הרחקות בגינה ביתית בין מינים שונים', emoji: '🌿', iconName: 'flower', route: '/halacha/kilayim', category: 'mitzvot' },

  // ============================================================
  // לימוד
  // ============================================================
  { id: 'halacha-yomit-kosharot', title: 'הלכה יומית', description: 'פרק יומי של הרב יצחק דביר + סרטון יוטיוב להמחשה', emoji: '📘', iconName: 'graduationCap', route: '/learn/halacha-yomit-kosharot', category: 'learning' },
  { id: 'shnayim', title: 'שניים מקרא', description: 'צ׳ק-ליסט שבועי לשניים מקרא ואחד תרגום', emoji: '✦', iconName: 'layers', route: '/tools/shnayim', category: 'learning' },
  { id: 'parsha', title: 'פרשת השבוע', description: 'טקסט מלא של הפרשה מ-Sefaria + רש"י', emoji: '📖', iconName: 'bookText', route: '/tools/parsha', category: 'learning' },
  { id: 'chok-lyisrael', title: 'חוק לישראל', description: '7 מקורות יומיים: תורה, נביאים, כתובים, משנה, גמרא, מוסר, זוהר', emoji: '📚', iconName: 'libraryBig', route: '/tools/chok-lyisrael', category: 'learning' },
  { id: 'daily-quiz', title: 'חידון יומי', description: 'שאלה אחת בכל יום - הלכה, יהדות, ידע כללי', emoji: '🎲', iconName: 'puzzle', route: '/tools/daily-quiz', category: 'learning' },
  { id: 'tzadik', title: 'הצדיק של היום', description: 'יום הילולא של צדיק יומי + ביוגרפיה קצרה', emoji: '✨', iconName: 'star', route: '/tools/tzadik', category: 'learning' },
  { id: 'jewish-history', title: 'היום בהיסטוריה היהודית', description: 'אירועים בהיסטוריה היהודית שאירעו בתאריך עברי זה', emoji: '📜', iconName: 'history', route: '/tools/jewish-history', category: 'learning' },
  { id: 'learning-plan', title: 'תוכניות לימוד', description: 'יעדים אישיים + קצב יומי + מעקב התקדמות', emoji: '🎯', iconName: 'target', route: '/tools/learning-plan', category: 'learning' },
  { id: 'books-learned', title: 'ספרים שלמדתי', description: 'רשימה אישית של ספרים שסיימת + תאריך סיום', emoji: '📚', iconName: 'bookMarked', route: '/tools/books-learned', category: 'learning' },
  { id: 'chiddushim', title: 'פנקס חידושים', description: 'מקום פרטי לשמירת חידושים אישיים בלימוד', emoji: '✍️', iconName: 'penLine', route: '/tools/chiddushim', category: 'learning' },
  { id: 'ask-chavruta', title: 'הרב שלך בכשרות', description: 'AI על בסיס "כושרות" - שאל שאלות כשרות וקבל מקורות', emoji: '🤖', iconName: 'messagesSquare', route: '/tools/ask-chavruta', category: 'learning', tone: 'accent' },

  // ============================================================
  // מעגלי חיים
  // ============================================================
  { id: 'brit', title: 'ברית מילה', description: 'חישוב יום שמיני + נוסח מלא ספרדי/אשכנזי + הכיבודים', emoji: '👶', iconName: 'baby', route: '/tools/brit', category: 'lifecycle' },
  { id: 'pidyon', title: 'פדיון הבן', description: 'מחשבון יום ה-31 + נוסח טקס הפדיון לכהן', emoji: '🪙', iconName: 'circleDollarSign', route: '/tools/pidyon', category: 'lifecycle' },
  { id: 'chuppah', title: 'הכנות לחופה', description: 'צ׳ק-ליסט הכנות לחתן/כלה + נוסח 7 ברכות', emoji: '💒', iconName: 'heart', route: '/tools/chuppah', category: 'lifecycle' },
  { id: 'tahara', title: 'לוח טהרה', description: 'זמני פרישה + שבעה נקיים + הערכת מועד ביוץ', emoji: '🕊️', iconName: 'heartPulse', route: '/tools/tahara', category: 'lifecycle' },
  { id: 'aveilus', title: 'תאריכי אבלות', description: 'חישוב שבעה, שלושים, יב חודש מתאריך הפטירה', emoji: '🕯️', iconName: 'heartCrack', route: '/tools/aveilus', category: 'lifecycle' },
  { id: 'yahrzeit', title: 'יארצייט וקדיש', description: 'מעקב יום פטירה בלוח עברי + תזכורות + תפילת קדיש', emoji: '🕯️', iconName: 'flame', route: '/tools/yahrzeit', category: 'lifecycle' },
  { id: 'kever-visit', title: 'עלייה לקבר', description: 'תפילה ליד הקבר + תהילים לפי אותיות שם הנפטר ונשמה', emoji: '🪦', iconName: 'flower2', route: '/tools/kever-visit', category: 'lifecycle' },
  { id: 'mishnayos-neshama', title: 'משניות לעילוי נשמה', description: 'פרקי משנה לפי אותיות שם הנפטר - לזכרון נשמה', emoji: '📚', iconName: 'bookHeart', route: '/tools/mishnayos-neshama', category: 'lifecycle' },

  // ============================================================
  // מיקום וניווט
  // ============================================================
  { id: 'travel', title: 'תפילת הדרך אוטומטית', description: 'GPS מזהה התחלת נסיעה ומציע לומר תפילת הדרך', emoji: '🚗', iconName: 'car', route: '/tools/travel', category: 'location' },
  { id: 'minyan-finder', title: 'מאתר מניין', description: '120+ בתי כנסת בארץ + זמני תפילה + ניווט', emoji: '📿', iconName: 'building2', route: '/tools/minyan-finder', category: 'location' },
  { id: 'mikvah-finder', title: 'מאתר מקווה', description: '160+ מקוואות + שעות פעילות + ניווט ב-Waze', emoji: '💧', iconName: 'droplets', route: '/tools/mikvah-finder', category: 'location' },
  { id: 'kvarim', title: 'קברי צדיקים', description: 'מאגר קברי צדיקים בארץ ובחו"ל + ניווט + תפילה', emoji: '🕯️', iconName: 'mapPinned', route: '/tools/kvarim', category: 'location' },
  { id: 'kosher-restaurants', title: 'מסעדות כשרות', description: 'מאגר עסקים בכשרות (IKR ועוד) - לפי עיר ורמת כשרות', emoji: '🍽️', iconName: 'utensils', route: '/tools/kosher-restaurants', category: 'location' },
  { id: 'shul-times', title: 'זמני בה״כ שלי', description: 'צלם לוח זמנים בבית הכנסת → תקבל תזכורות אוטומטיות', emoji: '📷', iconName: 'image', route: '/tools/shul-times', category: 'location' },

  // ============================================================
  // מחשבונים והמרות
  // ============================================================
  { id: 'dates', title: 'המרת תאריכים', description: 'המרה בין תאריך עברי ולועזי לכל תאריך', emoji: '📆', iconName: 'calendar', route: '/tools/dates', category: 'calc' },
  { id: 'hebrew-birthday', title: 'יום הולדת עברי', description: 'חישוב גיל עברי מדויק + ספירה לקראת היום ההבא', emoji: '🎂', iconName: 'cake', route: '/tools/hebrew-birthday', category: 'calc' },
  { id: 'gematria', title: 'גימטריה', description: '7 שיטות חישוב: רגיל, מילוי, ראשי תיבות, ועוד', emoji: '🔢', iconName: 'hash', route: '/tools/gematria', category: 'calc' },
  { id: 'shiurim', title: 'שיעורי חז״ל', description: 'כזית, רביעית, אמה, פרסה - בערכים מודרניים', emoji: '⚖️', iconName: 'ruler', route: '/tools/shiurim', category: 'calc' },

  // ============================================================
  // מעקב אישי
  // ============================================================
  { id: 'maaser', title: 'מעשר כספים', description: 'מעקב הכנסות חודשיות וחישוב מעשר/חומש', emoji: '💰', iconName: 'piggyBank', route: '/tools/maaser', category: 'personal' },
  { id: 'lashon-hara', title: 'שמירת הלשון', description: 'מעקב יומי של "יום נקי" + טיפים יומיים', emoji: '🤫', iconName: 'messageSquareOff', route: '/tools/lashon-hara', category: 'personal' },
  { id: 'parent-call', title: 'כיבוד הורים', description: 'תזכורת אוטומטית להתקשר להורים בקצב שתבחר', emoji: '📞', iconName: 'phoneCall', route: '/tools/parent-call', category: 'personal' },
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
