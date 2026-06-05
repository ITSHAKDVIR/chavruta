export type ShiurOpinion = {
  authority: string;
  value: number;
  unit: string;
  note?: string;
};

export type ShiurEntry = {
  id: string;
  name: string;
  category: 'volume' | 'weight' | 'length' | 'area' | 'time' | 'money';
  description: string;
  application: string;
  opinions: ShiurOpinion[];
};

export const SHIURIM: ShiurEntry[] = [
  {
    id: 'kezayit',
    name: 'כזית',
    category: 'volume',
    description: 'מידת כזית - יסוד שיעור באכילה',
    application: 'מצה בליל הסדר, מרור, כורך, אכילה בסוכה, ברכה אחרונה',
    opinions: [
      { authority: 'חזון איש', value: 50, unit: 'גרם', note: 'מחמיר ביותר - לפסח' },
      { authority: 'הגר"ח נאה', value: 27, unit: 'גרם', note: 'הנפוץ אצל ספרדים' },
      { authority: 'הרב פיינשטיין', value: 31, unit: 'גרם' },
      { authority: 'מנחת חינוך', value: 14, unit: 'גרם', note: 'מקל ביותר' },
      { authority: 'לתפילה / ברכה אחרונה (קל)', value: 17, unit: 'גרם' },
    ],
  },
  {
    id: 'kebeitzah',
    name: 'כביצה',
    category: 'volume',
    description: 'נפח של ביצה ממוצעת',
    application: 'נטילת ידיים, פת הבאה בכיסנין, שעורי איסור',
    opinions: [
      { authority: 'חזון איש', value: 100, unit: 'גרם' },
      { authority: 'הגר"ח נאה', value: 57.6, unit: 'גרם', note: 'הנפוץ' },
      { authority: 'הרב פיינשטיין', value: 60, unit: 'גרם' },
    ],
  },
  {
    id: 'reviit',
    name: 'רביעית',
    category: 'volume',
    description: 'רביעית הלוג - שיעור משקה',
    application: 'יין לקידוש וברכת המזון, נטילת ידיים, ארבע כוסות',
    opinions: [
      { authority: 'חזון איש', value: 150, unit: 'מ"ל' },
      { authority: 'הגר"ח נאה', value: 86, unit: 'מ"ל', note: 'הנפוץ אצל ספרדים' },
      { authority: 'הרב פיינשטיין', value: 88, unit: 'מ"ל' },
      { authority: 'לכוס יין (מחמיר)', value: 150, unit: 'מ"ל' },
    ],
  },
  {
    id: 'kotevet',
    name: 'ככותבת',
    category: 'volume',
    description: 'גודל תמר גדול - שיעור באכילה ביום כיפור',
    application: 'אכילת חולה ביום כיפור - "פחות מכותבת"',
    opinions: [
      { authority: 'חזון איש', value: 50, unit: 'גרם', note: 'גדול מכזית' },
      { authority: 'הגר"ח נאה', value: 28, unit: 'גרם' },
    ],
  },
  {
    id: 'amah',
    name: 'אמה',
    category: 'length',
    description: 'אמה מקובלת - כ-6 טפחים',
    application: 'גובה סוכה (לפחות 10 טפחים, מקסימום 20 אמה), שיעורי מקדש',
    opinions: [
      { authority: 'חזון איש', value: 58, unit: 'ס"מ' },
      { authority: 'הגר"ח נאה', value: 48, unit: 'ס"מ', note: 'הנפוץ' },
      { authority: 'הרב פיינשטיין', value: 54, unit: 'ס"מ' },
    ],
  },
  {
    id: 'tefach',
    name: 'טפח',
    category: 'length',
    description: 'רוחב 4 אצבעות יד',
    application: 'הרחקות כלאיים, סוכה (10 טפחים מינימום), הלכות שונות',
    opinions: [
      { authority: 'חזון איש', value: 9.6, unit: 'ס"מ' },
      { authority: 'הגר"ח נאה', value: 8, unit: 'ס"מ' },
      { authority: 'הרב פיינשטיין', value: 9, unit: 'ס"מ' },
    ],
  },
  {
    id: 'parsa',
    name: 'פרסה',
    category: 'length',
    description: 'פרסה - 4 מיל = 8000 אמה',
    application: 'תפילת הדרך - 3 פרסה (כ-12 ק"מ), תחום שבת',
    opinions: [
      { authority: 'חזון איש', value: 4.6, unit: 'ק"מ' },
      { authority: 'הגר"ח נאה', value: 3.84, unit: 'ק"מ' },
      { authority: 'הרב פיינשטיין', value: 4.3, unit: 'ק"מ' },
    ],
  },
  {
    id: 'mil',
    name: 'מיל',
    category: 'length',
    description: 'מיל - 2000 אמה. רבע פרסה.',
    application: 'תחום שבת (2000 אמה = מיל), זמן הליכת מיל',
    opinions: [
      { authority: 'חזון איש', value: 1.16, unit: 'ק"מ' },
      { authority: 'הגר"ח נאה', value: 0.96, unit: 'ק"מ' },
    ],
  },
  {
    id: 'pruta',
    name: 'פרוטה',
    category: 'money',
    description: 'שיעור הקטן בכסף בהלכה - שווה משקל שעורת כסף',
    application: 'קידושין בכסף, פדיון מעשר שני',
    opinions: [
      {
        authority: 'מכון התורה והארץ (מעודכן)',
        value: 7,
        unit: 'אגורות',
        note: 'נכון לשנת תשפ"ו. השער מתעדכן לפי מחיר הכסף בשוק.',
      },
      {
        authority: 'הרב נסים קרליץ זצ"ל',
        value: 5,
        unit: 'אגורות',
        note: 'שיטה נפוצה',
      },
      {
        authority: 'משקל גרעין שעורת כסף (תאורטי)',
        value: 0.025,
        unit: 'גרם כסף טהור',
        note: 'מחושב לפי מחיר הכסף הנוכחי',
      },
    ],
  },
  {
    id: 'shaveh-pruta',
    name: 'שוה פרוטה',
    category: 'money',
    description: 'הסכום המינימלי שיש לו ערך הלכתי',
    application: 'גזילה, גניבה, נזיקין מינימליים',
    opinions: [
      {
        authority: 'הרבנות (מעודכן)',
        value: 0.07,
        unit: 'ש"ח',
        note: 'כפרוטה לפי שער הכסף בשוק',
      },
    ],
  },
  {
    id: 'achilas-prass',
    name: 'אכילת פרס',
    category: 'time',
    description: 'זמן אכילת כזית פת בנחת',
    application: 'אם אכל כזית בתוך אכילת פרס - מצטרף לכזית',
    opinions: [
      { authority: 'הרב פיינשטיין', value: 9, unit: 'דקות' },
      { authority: 'מקל', value: 4, unit: 'דקות' },
      { authority: 'הגר"ח נאה', value: 7, unit: 'דקות' },
    ],
  },
];

export type ChazalCalc = {
  id: string;
  label: string;
  fromShiur: string;
  multiplier: number;
};

export const CHAZAL_CALCULATIONS: ChazalCalc[] = [
  { id: 'matzah-seder', label: 'כזית מצה לליל הסדר', fromShiur: 'kezayit', multiplier: 1 },
  { id: 'matzah-2', label: 'אכילת מצה (מוציא ומצה)', fromShiur: 'kezayit', multiplier: 2 },
  { id: 'maror', label: 'מרור', fromShiur: 'kezayit', multiplier: 1 },
  { id: 'koreich', label: 'כורך', fromShiur: 'kezayit', multiplier: 1 },
  { id: 'afikoman', label: 'אפיקומן', fromShiur: 'kezayit', multiplier: 1 },
  { id: 'kos-yayin', label: 'כוס יין (4 כוסות / קידוש)', fromShiur: 'reviit', multiplier: 1 },
  { id: 'sukkah-eat', label: 'אכילה בסוכה (לחייב)', fromShiur: 'kebeitzah', multiplier: 1 },
];
