import { HDate, months } from '@hebcal/core';

export type SeasonalCard = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  action?: { label: string; route: string };
  priority: number;
};

export function getSeasonalCards(now: Date = new Date()): SeasonalCard[] {
  const hd = new HDate(now);
  const month = hd.getMonth();
  const day = hd.getDate();
  const cards: SeasonalCard[] = [];

  if (month === months.NISAN) {
    cards.push({
      id: 'ilanot',
      title: 'ברכת האילנות',
      emoji: '🌳',
      description: 'חודש ניסן - הזמן לברך על אילני המאכל המלבלבים. פעם בשנה בלבד.',
      action: { label: 'מעבר לברכה', route: '/brachot/ilanot' },
      priority: 10,
    });
    if (day < 14) {
      cards.push({
        id: 'chametz',
        title: 'בדיקת חמץ',
        emoji: '🍞',
        description: 'ערב פסח קרוב. צ׳ק-ליסט לבדיקת חמץ + סדר ההגדה.',
        priority: 9,
      });
    }
    if (day >= 16) {
      cards.push({
        id: 'omer',
        title: 'ספירת העומר',
        emoji: '🌾',
        description: 'ספרת היום בעומר?',
        action: { label: 'ספור', route: '/tools/omer' },
        priority: 10,
      });
    }
  }

  if (month === months.IYYAR || month === months.SIVAN) {
    if (!(month === months.SIVAN && day >= 7)) {
      cards.push({
        id: 'omer',
        title: 'ספירת העומר',
        emoji: '🌾',
        description: 'אנו בימי הספירה. סופרים בכל לילה בברכה.',
        action: { label: 'ספור היום', route: '/tools/omer' },
        priority: 10,
      });
    }
  }

  if (month === months.AV) {
    if (day < 10) {
      cards.push({
        id: 'av',
        title: 'תשעת הימים',
        emoji: '🕯️',
        description: 'מראש חודש אב עד תשעה באב - מצמצמים בשמחה, נמנעים מבשר ויין.',
        priority: 8,
      });
    }
  }

  if (month === months.ELUL) {
    cards.push({
      id: 'elul',
      title: 'חודש אלול',
      emoji: '🍂',
      description: 'אני לדודי ודודי לי. ימי תשובה ורחמים, סליחות (אשכנז מתחילים שבוע לפני ראש השנה, ספרדים מראש חודש).',
      priority: 9,
    });
  }

  if (month === months.TISHREI) {
    if (day < 10) {
      cards.push({
        id: 'tishrei',
        title: 'עשרת ימי תשובה',
        emoji: '🍯',
        description: 'בין ראש השנה ליום כיפור. ימי החזרה בתשובה והתפילה.',
        priority: 10,
      });
    }
    if (day >= 10 && day < 15) {
      cards.push({
        id: 'sukkah',
        title: 'הכנות לסוכות',
        emoji: '🌿',
        description: 'בדיקת ארבעת המינים, בניית סוכה.',
        priority: 9,
      });
    }
    if (day >= 15 && day <= 21) {
      cards.push({
        id: 'sukkos',
        title: 'חג הסוכות',
        emoji: '🌿',
        description: 'אושפיזין, ארבעת המינים, ושמחת בית השואבה.',
        priority: 10,
      });
    }
    if (day === 22) {
      cards.push({
        id: 'shemini',
        title: 'שמיני עצרת ושמחת תורה',
        emoji: '📜',
        description: 'תפילת גשם, הקפות עם הספרים, סיום וחזרה לבראשית.',
        priority: 10,
      });
    }
  }

  if ((month === months.KISLEV && day >= 24) || (month === months.TEVET && day <= 2)) {
    {
      cards.push({
        id: 'chanukah',
        title: 'חנוכה',
        emoji: '🕎',
        description: 'הדלקת נרות, על הניסים, הלל שלם.',
        priority: 10,
      });
    }
  }

  if (month === months.SHVAT) {
    if (day === 15) {
      cards.push({
        id: 'tubishvat',
        title: 'ט"ו בשבט',
        emoji: '🌳',
        description: 'ראש השנה לאילן. סדר ט"ו בשבט עם פירות שבעת המינים.',
        priority: 10,
      });
    } else if (day < 15) {
      cards.push({
        id: 'tubishvat-soon',
        title: 'ט"ו בשבט מתקרב',
        emoji: '🌳',
        description: `עוד ${15 - day} ימים. ראש השנה לאילן.`,
        priority: 6,
      });
    }
  }

  if (month === months.ADAR_I || month === months.ADAR_II) {
    if (day === 14 || day === 15) {
      cards.push({
        id: 'purim',
        title: 'פורים',
        emoji: '🎭',
        description: 'מקרא מגילה, משלוח מנות, מתנות לאביונים, סעודת פורים.',
        priority: 10,
      });
    } else if (day < 14) {
      cards.push({
        id: 'purim-soon',
        title: 'מתקרבים לפורים',
        emoji: '🎭',
        description: `עוד ${14 - day} ימים. מתחילים להכין משלוחי מנות.`,
        priority: 6,
      });
    }
  }

  if (day === 30 || day === 1) {
    cards.push({
      id: 'roshchodesh',
      title: 'ראש חודש',
      emoji: '🌙',
      description: 'תפילת מוסף, יעלה ויבוא, הלל בדילוג. ראש חודש - יום סגולה.',
      priority: 7,
    });
  }

  return cards.sort((a, b) => b.priority - a.priority);
}
