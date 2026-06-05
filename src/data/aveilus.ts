import { HDate } from '@hebcal/core';

export type AveilusPhase = {
  id: string;
  hebrewName: string;
  description: string;
  daysFromDeath: { start: number; end: number };
  rules: string[];
};

export const PHASES: AveilusPhase[] = [
  {
    id: 'aninut',
    hebrewName: 'אנינות',
    description: 'מרגע הפטירה ועד הקבורה',
    daysFromDeath: { start: 0, end: 0 },
    rules: [
      'אסור בבשר ויין',
      'עוסקים בהכנת הקבורה',
      'בשבת/חג - יוצא מאנינות בלילה',
    ],
  },
  {
    id: 'shiva',
    hebrewName: 'שבעת ימי אבלות',
    description: 'מהקבורה עד 7 ימים אחריה',
    daysFromDeath: { start: 0, end: 7 },
    rules: [
      'יושבים על מושב נמוך (לא על כסא רגיל)',
      'לא לובשים נעלי עור',
      'אסור ברחיצה (חוץ מהכרחי)',
      'אסור בתספורת וגילוח',
      'אסור בעבודה',
      'אסור בלימוד תורה (חוץ מספרי איוב, ירמיה, ופרקי הלכות אבלות)',
      'בשמיים על המראה / מבסים',
      'קריעה - קורעים  את הבגד מעל הלב להורים, מצד ימין לקרובים אחרים',
      'מנחמים יושבים סביב, ולא מדברים תחילה',
    ],
  },
  {
    id: 'sheloshim',
    hebrewName: 'שלושים',
    description: 'מהקבורה עד 30 ימים',
    daysFromDeath: { start: 7, end: 30 },
    rules: [
      'אסור בתספורת ובגילוח',
      'אסור ללבוש בגדים חדשים מגוהצים',
      'אסור להשתתף בחתונות ושמחות',
      'אסור באירועים מוסיקליים',
      'מותר בלימוד תורה רגיל',
      'מותר בעבודה (אחרי השבעה)',
    ],
  },
  {
    id: 'shana',
    hebrewName: 'שנים עשר חודש (להורים בלבד)',
    description: 'יב חודש מהפטירה - אבלות על אב ואם בלבד',
    daysFromDeath: { start: 30, end: 365 },
    rules: [
      'אסור להשתתף בסעודת מרעים',
      'אסור באירועים מוסיקליים',
      'נמנעים מבשורות שמחות',
      'אומרים קדיש 11 חודשים (לא 12 - "שלא יראה את אביו רשע")',
      'יורד לפני התיבה בערבית של מוצאי שבת ויו"ט',
    ],
  },
];

export function calculatePhases(deathDate: Date, burialDate?: Date): {
  daysSinceDeath: number;
  daysSinceBurial: number;
  currentPhase: AveilusPhase;
  shivaEnd: Date;
  sheloshimEnd: Date;
  yearEnd: Date;
  kaddishEnd: Date;
  yahrtzeit: Date;
} {
  const death = new HDate(deathDate);
  const burial = new HDate(burialDate ?? deathDate);
  const today = new HDate(new Date());

  const daysSinceDeath = today.abs() - death.abs();
  const daysSinceBurial = today.abs() - burial.abs();

  const shivaEnd = new HDate(burial.abs() + 6).greg();
  const sheloshimEnd = new HDate(burial.abs() + 29).greg();

  const yearEnd = new HDate(death.getDate(), death.getMonth(), death.getFullYear() + 1).greg();
  const kaddishEnd = new HDate(death.abs() + Math.floor(365 * (11 / 12))).greg();
  const yahrtzeit = yearEnd;

  let currentPhase: AveilusPhase;
  if (daysSinceBurial < 0) currentPhase = PHASES[0];
  else if (daysSinceBurial <= 7) currentPhase = PHASES[1];
  else if (daysSinceBurial <= 30) currentPhase = PHASES[2];
  else if (daysSinceDeath <= 365) currentPhase = PHASES[3];
  else currentPhase = PHASES[3];

  return { daysSinceDeath, daysSinceBurial, currentPhase, shivaEnd, sheloshimEnd, yearEnd, kaddishEnd, yahrtzeit };
}

export const KADDISH = `יִתְגַּדַּל וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. בְּעָלְמָא דִּי בְרָא כִרְעוּתֵהּ, וְיַמְלִיךְ מַלְכוּתֵהּ, בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן, וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן.

יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא.

יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא בְּרִיךְ הוּא, לְעֵלָּא מִן כָּל בִּרְכָתָא וְשִׁירָתָא תֻּשְׁבְּחָתָא וְנֶחָמָתָא דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן.

יְהֵא שְׁלָמָא רַבָּא מִן שְׁמַיָּא וְחַיִּים עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל, וְאִמְרוּ אָמֵן.

עוֹשֶׂה שָׁלוֹם בִּמְרוֹמָיו הוּא יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל, וְאִמְרוּ אָמֵן.`;
