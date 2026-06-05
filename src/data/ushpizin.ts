import { HDate, months } from '@hebcal/core';

export type Ushpiz = {
  day: number;
  name: string;
  attribute: string;
  description: string;
};

/** Standard Ashkenazi/Sephardi order of the 7 Ushpizin (guests) of Sukkot. */
export const USHPIZIN: Ushpiz[] = [
  { day: 1, name: 'אַבְרָהָם', attribute: 'חֶסֶד', description: 'הנהגת החסד - אהבת חינם, הכנסת אורחים' },
  { day: 2, name: 'יִצְחָק', attribute: 'גְּבוּרָה', description: 'הנהגת הגבורה - מסירות נפש, יראת ה׳' },
  { day: 3, name: 'יַעֲקֹב', attribute: 'תִּפְאֶרֶת', description: 'הנהגת התפארת - איזון בין חסד וגבורה, אמת' },
  { day: 4, name: 'מֹשֶׁה', attribute: 'נֶצַח', description: 'הנהגת הנצח - מסירה לתורה, התמדה' },
  { day: 5, name: 'אַהֲרֹן', attribute: 'הוֹד', description: 'הנהגת ההוד - אהבת הבריות, רודף שלום' },
  { day: 6, name: 'יוֹסֵף', attribute: 'יְסוֹד', description: 'הנהגת היסוד - שמירת הברית, צדיק' },
  { day: 7, name: 'דָּוִד', attribute: 'מַלְכוּת', description: 'הנהגת המלכות - תפילה ושבחה לה׳' },
];

/** Returns today's Ushpiz if we're in Sukkot (15-21 Tishrei), else null. */
export function ushpizForDate(date: Date = new Date()): Ushpiz | null {
  const hd = new HDate(date);
  if (hd.getMonth() !== months.TISHREI) return null;
  const d = hd.getDate();
  if (d < 15 || d > 21) return null;
  return USHPIZIN[d - 15];
}

/** The standard invitation text for the Ushpizin (Ari'zal version). */
export const USHPIZIN_INVITATION = `עוּלוּ אֻשְׁפִּיזִין עִלָּאִין קַדִּישִׁין, עוּלוּ אֲבָהָן עִלָּאִין קַדִּישִׁין לְמֵיתַב בְּצִלָּא דִּמְהֵימְנוּתָא עִלָּאָה.`;
