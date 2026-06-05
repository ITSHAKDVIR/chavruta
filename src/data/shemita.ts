export type BiurEntry = {
  category: string;
  examples: string[];
  approxDateHebrew: string;
  approxDateGreg: string;
  notes?: string;
};

export const BIUR_DATES_LAST_SHEMITA: BiurEntry[] = [
  { category: 'מלפפונים', examples: ['מלפפון', 'קישוא'], approxDateHebrew: 'ראש חודש כסלו', approxDateGreg: 'תחילת דצמבר' },
  { category: 'עגבניות מהדורה ראשונה', examples: ['עגבניה'], approxDateHebrew: 'ט"ו כסלו', approxDateGreg: 'מצי דצמבר' },
  { category: 'גזר', examples: ['גזר'], approxDateHebrew: 'י"ז שבט', approxDateGreg: 'תחילת פברואר' },
  { category: 'תות שדה', examples: ['תות'], approxDateHebrew: 'כ"ה אדר', approxDateGreg: 'מצי מרץ' },
  { category: 'עלים ירוקים', examples: ['חסה', 'פטרוזיליה', 'כוסברה', 'בצל ירוק'], approxDateHebrew: 'ערב פסח', approxDateGreg: 'אפריל' },
  { category: 'תפוחי אדמה (מהדורה שניה)', examples: ['תפו"א'], approxDateHebrew: 'ט"ו אייר', approxDateGreg: 'מצי מאי' },
  { category: 'בצל יבש', examples: ['בצל'], approxDateHebrew: 'כ"ה אייר', approxDateGreg: 'סוף מאי' },
  { category: 'אבטיח', examples: ['אבטיח'], approxDateHebrew: 'ט"ו אב', approxDateGreg: 'אוגוסט' },
  { category: 'תפוז ולימון', examples: ['תפוז', 'לימון', 'אשכולית'], approxDateHebrew: 'כ"ז כסלו (השנה הבאה)', approxDateGreg: 'דצמבר' },
  { category: 'ענבים', examples: ['ענבים', 'יין'], approxDateHebrew: 'פסח (השנה הבאה)', approxDateGreg: 'אפריל' },
  { category: 'זיתים', examples: ['זית', 'שמן זית'], approxDateHebrew: 'חנוכה (השנה הבאה)', approxDateGreg: 'דצמבר' },
  { category: 'תמרים', examples: ['תמר'], approxDateHebrew: 'ט"ו בשבט (השנה הבאה)', approxDateGreg: 'ינואר-פברואר' },
];

export const KEDUSHA_RULES = [
  'אסור לאבד או להשליך פירות שביעית - יש להניחם עד שיירקבו מאליהם',
  'מותר לאכול לתועלת האדם (לאכילה, לרחיצה, להדלקה)',
  'אסור להוציא לחו"ל פירות שביעית',
  'אסור לעשות סחורה כרגיל - רק מכירה בשיעורי "מזון שלוש סעודות"',
  'יש להתנהג בכבוד כלפי קדושת פירות שביעית',
];

export const OPTIONS_FOR_SHEMITA = [
  {
    name: 'אוצר בית דין',
    description: 'בית דין נוטל אחריות על השדות, פועלים נשכרים בשכר, והפירות מחולקים בעלות מינימלית. הפירות נחשבים כפירות הפקר, יש להם קדושת שביעית.',
    pros: ['השמיטה נשמרת בהידור', 'הפירות עם קדושת שביעית'],
    cons: ['מחיר יקר יותר', 'יש להקפיד על דיני הביעור'],
  },
  {
    name: 'היתר מכירה',
    description: 'מוכרים את הקרקע לגוי לתקופת השמיטה, ובכך הפקעת קדושת הקרקע. דעת רוב הרבנים הראשיים לאורך הדורות שזה היתר נצרך בדורנו.',
    pros: ['ניתן להמשיך בעיבוד רגיל', 'אין בעיית ביעור', 'תמיכה בחקלאות יהודית'],
    cons: ['יש מחלוקת בפוסקים', 'חרדים מהדרים לא נוהגים על פיו'],
  },
  {
    name: 'יבול נוכרי',
    description: 'קונים פירות מחקלאים גויים בארץ. אין בהם קדושת שביעית.',
    pros: ['ללא בעיות הלכתיות לגבי שביעית', 'מחיר נמוך יחסית'],
    cons: ['פגיעה בחקלאות יהודית', 'יש פוסקים שאסרו (חזון איש)'],
  },
];

// יבול חו"ל option and the prozbol nusach were removed per Rabbi Dvir's review.

export function isShemitaYear(hyear: number): boolean {
  return hyear % 7 === 0;
}

export function nextShemita(currentHyear: number): number {
  if (isShemitaYear(currentHyear)) return currentHyear;
  return currentHyear + (7 - (currentHyear % 7));
}
