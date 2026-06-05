import { HDate, HebrewCalendar, Location, Locale, Sedra, Zmanim, flags } from '@hebcal/core';

export type StoredLocation = {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  countryCode: string;
  elevation?: number;
};

export type LocationRegion = 'israel-center' | 'israel-jerusalem' | 'israel-north' | 'israel-south' | 'israel-judea' | 'us-east' | 'us-other' | 'europe' | 'americas' | 'africa' | 'asia-oceania';

export const REGION_LABELS: Record<LocationRegion, string> = {
  'israel-jerusalem': 'ירושלים והסביבה',
  'israel-center': 'מרכז הארץ',
  'israel-north': 'צפון',
  'israel-south': 'דרום',
  'israel-judea': 'יהודה ושומרון',
  'us-east': 'ארה"ב - מזרח',
  'us-other': 'ארה"ב - שאר',
  'europe': 'אירופה',
  'americas': 'אמריקה הלטינית וקנדה',
  'africa': 'אפריקה',
  'asia-oceania': 'אסיה ואוקיאניה',
};

type LocWithRegion = StoredLocation & { region: LocationRegion };

/**
 * Default candle-lighting minutes before sunset per city minhag.
 * Source: standard published luach times (Bar-Ilan / Mitcafia / Yeshiva.org.il).
 * Match is by substring of the city name (Hebrew or English).
 */
const CANDLE_LIGHTING_BY_CITY: Array<{ match: RegExp; minutes: number; minhag: string }> = [
  { match: /(ירושלים|jerusalem)/i, minutes: 40, minhag: 'ירושלים' },
  { match: /(חיפה|haifa)/i, minutes: 30, minhag: 'חיפה' },
  { match: /(צפת|safed|tzfat|tsfat)/i, minutes: 30, minhag: 'צפת' },
  { match: /(טבריה|tiberias)/i, minutes: 30, minhag: 'טבריה (מנהג ירושלים)' },
  { match: /(פתח[ -]?תקווה|petah tikva|petah tikvah)/i, minutes: 20, minhag: 'פתח תקווה' },
  { match: /(בני[ -]?ברק|bnei brak|bene brak)/i, minutes: 20, minhag: 'בני ברק' },
  { match: /(בית[ -]?שמש|beit shemesh|bet shemesh)/i, minutes: 20, minhag: 'בית שמש' },
  { match: /(מודיעין|modiin)/i, minutes: 20, minhag: 'מודיעין' },
  { match: /(תל[ -]?אביב|tel aviv|tel-aviv)/i, minutes: 18, minhag: 'תל אביב' },
  { match: /(רמת[ -]?גן|ramat gan)/i, minutes: 18, minhag: 'רמת גן' },
];

/**
 * Returns the proper candle-lighting offset (minutes before sunset) for a location.
 * Israeli cities follow their published minhag; outside Israel defaults to 18.
 */
export function getCandleLightingMinutes(location: StoredLocation): number {
  const name = location.name || '';
  const match = CANDLE_LIGHTING_BY_CITY.find((row) => row.match.test(name));
  if (match) return match.minutes;
  // Default: 22 min for Israel (common minhag for unlisted cities), 18 outside.
  return location.countryCode === 'IL' ? 22 : 18;
}

/** Returns a human-readable minhag label for the current location's candle time. */
export function getCandleLightingMinhag(location: StoredLocation): string {
  const name = location.name || '';
  const match = CANDLE_LIGHTING_BY_CITY.find((row) => row.match.test(name));
  if (match) return `${match.minhag} - ${match.minutes} דק׳ לפני שקיעה`;
  return location.countryCode === 'IL'
    ? '22 דק׳ לפני שקיעה (ברירת מחדל לא"י)'
    : '18 דק׳ לפני שקיעה (ברירת מחדל לחו"ל)';
}


export const DEFAULT_LOCATIONS_BY_REGION: LocWithRegion[] = [
  // ===== ירושלים והסביבה =====
  { name: 'ירושלים', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-jerusalem' },
  { name: 'בית שמש', latitude: 31.7456, longitude: 34.9886, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-jerusalem' },
  { name: 'מעלה אדומים', latitude: 31.7766, longitude: 35.2980, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-jerusalem' },
  { name: 'מבשרת ציון', latitude: 31.8014, longitude: 35.1490, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-jerusalem' },
  { name: 'גבעת זאב', latitude: 31.8581, longitude: 35.1681, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-jerusalem' },
  { name: 'אפרת', latitude: 31.6536, longitude: 35.1497, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-jerusalem' },
  { name: 'ביתר עילית', latitude: 31.6961, longitude: 35.1167, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-jerusalem' },

  // ===== מרכז הארץ =====
  { name: 'תל אביב', latitude: 32.0853, longitude: 34.7818, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'בני ברק', latitude: 32.0809, longitude: 34.8338, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'פתח תקווה', latitude: 32.0917, longitude: 34.8854, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'רמת גן', latitude: 32.0681, longitude: 34.8246, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'גבעתיים', latitude: 32.0700, longitude: 34.8083, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'הרצליה', latitude: 32.1664, longitude: 34.8438, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'רעננה', latitude: 32.1836, longitude: 34.8704, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'כפר סבא', latitude: 32.1750, longitude: 34.9070, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'נתניה', latitude: 32.3215, longitude: 34.8532, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'חולון', latitude: 32.0167, longitude: 34.7794, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'בת ים', latitude: 32.0167, longitude: 34.7500, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'ראשון לציון', latitude: 31.9730, longitude: 34.7925, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'רחובות', latitude: 31.8928, longitude: 34.8113, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'נס ציונה', latitude: 31.9293, longitude: 34.7986, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'מודיעין', latitude: 31.8969, longitude: 35.0103, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'מודיעין עילית', latitude: 31.9333, longitude: 35.0500, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'לוד', latitude: 31.9514, longitude: 34.8950, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'רמלה', latitude: 31.9293, longitude: 34.8657, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },
  { name: 'אלעד', latitude: 32.0500, longitude: 34.9500, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-center' },

  // ===== צפון =====
  { name: 'חיפה', latitude: 32.794, longitude: 34.9896, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'קריית אתא', latitude: 32.8093, longitude: 35.1118, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'קריית מוצקין', latitude: 32.8369, longitude: 35.0750, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'נשר', latitude: 32.7706, longitude: 35.0426, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'צפת', latitude: 32.965, longitude: 35.4951, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'טבריה', latitude: 32.7922, longitude: 35.5311, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'נצרת עילית (נוף הגליל)', latitude: 32.7028, longitude: 35.3175, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'עפולה', latitude: 32.6078, longitude: 35.2897, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'בית שאן', latitude: 32.4969, longitude: 35.4961, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'עכו', latitude: 32.9281, longitude: 35.0820, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'נהריה', latitude: 33.0058, longitude: 35.0978, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'מירון', latitude: 32.9810, longitude: 35.4400, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },
  { name: 'חדרה', latitude: 32.4339, longitude: 34.9197, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-north' },

  // ===== דרום =====
  { name: 'באר שבע', latitude: 31.2518, longitude: 34.7913, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-south' },
  { name: 'אשדוד', latitude: 31.8014, longitude: 34.6435, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-south' },
  { name: 'אשקלון', latitude: 31.6688, longitude: 34.5743, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-south' },
  { name: 'נתיבות', latitude: 31.4214, longitude: 34.5894, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-south' },
  { name: 'שדרות', latitude: 31.5267, longitude: 34.5950, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-south' },
  { name: 'אופקים', latitude: 31.3128, longitude: 34.6203, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-south' },
  { name: 'דימונה', latitude: 31.0700, longitude: 35.0322, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-south' },
  { name: 'אילת', latitude: 29.5577, longitude: 34.9519, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-south' },
  { name: 'ערד', latitude: 31.2592, longitude: 35.2117, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-south' },

  // ===== יהודה ושומרון =====
  { name: 'חברון', latitude: 31.5326, longitude: 35.0998, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'קריית ארבע', latitude: 31.5333, longitude: 35.1167, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'אריאל', latitude: 32.1056, longitude: 35.1719, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  // שומרון
  { name: 'אלון מורה', latitude: 32.2303, longitude: 35.3593, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'איתמר', latitude: 32.1803, longitude: 35.3392, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'יצהר', latitude: 32.1872, longitude: 35.2467, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'הר ברכה', latitude: 32.1828, longitude: 35.2747, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'קדומים', latitude: 32.2128, longitude: 35.0942, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'קרני שומרון', latitude: 32.1786, longitude: 35.0925, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'יקיר', latitude: 32.1431, longitude: 35.0828, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'עמנואל', latitude: 32.1581, longitude: 35.1308, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'כפר תפוח', latitude: 32.1078, longitude: 35.2814, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'שבי שומרון', latitude: 32.2719, longitude: 35.2069, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'אבני חפץ', latitude: 32.2864, longitude: 35.0567, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'ברוכין', latitude: 32.0939, longitude: 35.0869, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'בית אריה', latitude: 32.0269, longitude: 35.0453, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  // בנימין
  { name: 'בית אל', latitude: 31.9450, longitude: 35.2308, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'עפרה', latitude: 31.9572, longitude: 35.2433, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'פסגות', latitude: 31.9300, longitude: 35.2858, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'כוכב יעקב', latitude: 31.8903, longitude: 35.2469, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'עלי', latitude: 31.9733, longitude: 35.2825, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'שילה', latitude: 31.9931, longitude: 35.2900, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'מעלה לבונה', latitude: 32.0244, longitude: 35.2425, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'דולב', latitude: 31.9322, longitude: 35.1308, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'טלמון', latitude: 31.9367, longitude: 35.1175, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'הר אדר', latitude: 31.8306, longitude: 35.1389, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'מצפה יריחו', latitude: 31.8108, longitude: 35.3711, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'קדר', latitude: 31.7497, longitude: 35.3417, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'ענתות / ענתות', latitude: 31.8228, longitude: 35.2806, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  // גוש עציון
  { name: 'אלון שבות', latitude: 31.6600, longitude: 35.1308, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'תקוע', latitude: 31.6378, longitude: 35.2261, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'כפר עציון', latitude: 31.6539, longitude: 35.1175, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'כרמי צור', latitude: 31.6100, longitude: 35.1222, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'מעלה עמוס', latitude: 31.5853, longitude: 35.2211, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'נוקדים', latitude: 31.6553, longitude: 35.2317, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  // הר חברון
  { name: 'בית חגי', latitude: 31.4731, longitude: 35.1067, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'כרמל', latitude: 31.4444, longitude: 35.1369, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'מעון', latitude: 31.4347, longitude: 35.1192, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'עתניאל', latitude: 31.4125, longitude: 35.0450, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },
  { name: 'סוסיא', latitude: 31.3956, longitude: 35.1106, timezone: 'Asia/Jerusalem', countryCode: 'IL', region: 'israel-judea' },

  // ===== ארה"ב - מזרח =====
  { name: 'ניו יורק (מנהטן)', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'ברוקלין', latitude: 40.6782, longitude: -73.9442, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'קווינס', latitude: 40.7282, longitude: -73.7949, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'לייקווד (NJ)', latitude: 40.0978, longitude: -74.2176, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'מונסי (NY)', latitude: 41.1117, longitude: -74.0680, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'פאר רוקאוויי', latitude: 40.6045, longitude: -73.7548, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'קיו גרדנס היל', latitude: 40.7321, longitude: -73.8228, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'בורו פארק', latitude: 40.6334, longitude: -73.9961, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'וויליאמסבורג', latitude: 40.7081, longitude: -73.9571, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'קראון הייטס', latitude: 40.6694, longitude: -73.9442, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'באלטימור (MD)', latitude: 39.2904, longitude: -76.6122, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'סילבר ספרינג (MD)', latitude: 38.9907, longitude: -77.0261, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'פילדלפיה', latitude: 39.9526, longitude: -75.1652, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'בוסטון', latitude: 42.3601, longitude: -71.0589, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'מיאמי', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'בוקה ראטון', latitude: 26.3683, longitude: -80.1289, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'הולנדייל (FL)', latitude: 25.9812, longitude: -80.1453, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'אטלנטה', latitude: 33.7490, longitude: -84.3880, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },
  { name: 'וושינגטון די.סי.', latitude: 38.9072, longitude: -77.0369, timezone: 'America/New_York', countryCode: 'US', region: 'us-east' },

  // ===== ארה"ב - שאר =====
  { name: 'שיקגו', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago', countryCode: 'US', region: 'us-other' },
  { name: 'דטרויט', latitude: 42.3314, longitude: -83.0458, timezone: 'America/Detroit', countryCode: 'US', region: 'us-other' },
  { name: 'קליבלנד', latitude: 41.4993, longitude: -81.6944, timezone: 'America/New_York', countryCode: 'US', region: 'us-other' },
  { name: 'סינסינטי', latitude: 39.1031, longitude: -84.5120, timezone: 'America/New_York', countryCode: 'US', region: 'us-other' },
  { name: 'דנבר', latitude: 39.7392, longitude: -104.9903, timezone: 'America/Denver', countryCode: 'US', region: 'us-other' },
  { name: 'דאלאס', latitude: 32.7767, longitude: -96.7970, timezone: 'America/Chicago', countryCode: 'US', region: 'us-other' },
  { name: 'יוסטון', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago', countryCode: 'US', region: 'us-other' },
  { name: 'סנט לואיס', latitude: 38.6270, longitude: -90.1994, timezone: 'America/Chicago', countryCode: 'US', region: 'us-other' },
  { name: 'ממפיס', latitude: 35.1495, longitude: -90.0490, timezone: 'America/Chicago', countryCode: 'US', region: 'us-other' },
  { name: 'לוס אנג׳לס', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles', countryCode: 'US', region: 'us-other' },
  { name: 'הוליווד (CA)', latitude: 34.0928, longitude: -118.3287, timezone: 'America/Los_Angeles', countryCode: 'US', region: 'us-other' },
  { name: 'סן פרנסיסקו', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles', countryCode: 'US', region: 'us-other' },
  { name: 'סיאטל', latitude: 47.6062, longitude: -122.3321, timezone: 'America/Los_Angeles', countryCode: 'US', region: 'us-other' },
  { name: 'פיניקס', latitude: 33.4484, longitude: -112.0740, timezone: 'America/Phoenix', countryCode: 'US', region: 'us-other' },
  { name: 'לאס וגאס', latitude: 36.1699, longitude: -115.1398, timezone: 'America/Los_Angeles', countryCode: 'US', region: 'us-other' },

  // ===== אירופה =====
  { name: 'לונדון', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London', countryCode: 'GB', region: 'europe' },
  { name: 'גולדרס גרין (לונדון)', latitude: 51.5722, longitude: -0.1942, timezone: 'Europe/London', countryCode: 'GB', region: 'europe' },
  { name: 'סטמפורד היל (לונדון)', latitude: 51.5660, longitude: -0.0759, timezone: 'Europe/London', countryCode: 'GB', region: 'europe' },
  { name: 'מנצ׳סטר', latitude: 53.4808, longitude: -2.2426, timezone: 'Europe/London', countryCode: 'GB', region: 'europe' },
  { name: 'גייטסהד', latitude: 54.9526, longitude: -1.6014, timezone: 'Europe/London', countryCode: 'GB', region: 'europe' },
  { name: 'פריז', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', countryCode: 'FR', region: 'europe' },
  { name: 'מארסיי', latitude: 43.2965, longitude: 5.3698, timezone: 'Europe/Paris', countryCode: 'FR', region: 'europe' },
  { name: 'שטרסבורג', latitude: 48.5734, longitude: 7.7521, timezone: 'Europe/Paris', countryCode: 'FR', region: 'europe' },
  { name: 'ליון', latitude: 45.7640, longitude: 4.8357, timezone: 'Europe/Paris', countryCode: 'FR', region: 'europe' },
  { name: 'אנטוורפן', latitude: 51.2194, longitude: 4.4025, timezone: 'Europe/Brussels', countryCode: 'BE', region: 'europe' },
  { name: 'בריסל', latitude: 50.8503, longitude: 4.3517, timezone: 'Europe/Brussels', countryCode: 'BE', region: 'europe' },
  { name: 'אמסטרדם', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam', countryCode: 'NL', region: 'europe' },
  { name: 'ברלין', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin', countryCode: 'DE', region: 'europe' },
  { name: 'פרנקפורט', latitude: 50.1109, longitude: 8.6821, timezone: 'Europe/Berlin', countryCode: 'DE', region: 'europe' },
  { name: 'מינכן', latitude: 48.1351, longitude: 11.5820, timezone: 'Europe/Berlin', countryCode: 'DE', region: 'europe' },
  { name: 'ציריך', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich', countryCode: 'CH', region: 'europe' },
  { name: 'בזל', latitude: 47.5596, longitude: 7.5886, timezone: 'Europe/Zurich', countryCode: 'CH', region: 'europe' },
  { name: 'וינה', latitude: 48.2082, longitude: 16.3738, timezone: 'Europe/Vienna', countryCode: 'AT', region: 'europe' },
  { name: 'רומא', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome', countryCode: 'IT', region: 'europe' },
  { name: 'מילאנו', latitude: 45.4642, longitude: 9.1900, timezone: 'Europe/Rome', countryCode: 'IT', region: 'europe' },
  { name: 'גיברלטר', latitude: 36.1408, longitude: -5.3536, timezone: 'Europe/Gibraltar', countryCode: 'GI', region: 'europe' },
  { name: 'מדריד', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid', countryCode: 'ES', region: 'europe' },
  { name: 'ברצלונה', latitude: 41.3851, longitude: 2.1734, timezone: 'Europe/Madrid', countryCode: 'ES', region: 'europe' },
  { name: 'קייב', latitude: 50.4501, longitude: 30.5234, timezone: 'Europe/Kiev', countryCode: 'UA', region: 'europe' },
  { name: 'מוסקבה', latitude: 55.7558, longitude: 37.6173, timezone: 'Europe/Moscow', countryCode: 'RU', region: 'europe' },
  { name: 'בודפשט', latitude: 47.4979, longitude: 19.0402, timezone: 'Europe/Budapest', countryCode: 'HU', region: 'europe' },
  { name: 'פראג', latitude: 50.0755, longitude: 14.4378, timezone: 'Europe/Prague', countryCode: 'CZ', region: 'europe' },
  { name: 'ורשה', latitude: 52.2297, longitude: 21.0122, timezone: 'Europe/Warsaw', countryCode: 'PL', region: 'europe' },

  // ===== אמריקה הלטינית וקנדה =====
  { name: 'טורונטו', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto', countryCode: 'CA', region: 'americas' },
  { name: 'מונטריאול', latitude: 45.5017, longitude: -73.5673, timezone: 'America/Toronto', countryCode: 'CA', region: 'americas' },
  { name: 'ונקובר', latitude: 49.2827, longitude: -123.1207, timezone: 'America/Vancouver', countryCode: 'CA', region: 'americas' },
  { name: 'מקסיקו סיטי', latitude: 19.4326, longitude: -99.1332, timezone: 'America/Mexico_City', countryCode: 'MX', region: 'americas' },
  { name: 'בואנוס איירס', latitude: -34.6037, longitude: -58.3816, timezone: 'America/Argentina/Buenos_Aires', countryCode: 'AR', region: 'americas' },
  { name: 'סאו פאולו', latitude: -23.5505, longitude: -46.6333, timezone: 'America/Sao_Paulo', countryCode: 'BR', region: 'americas' },
  { name: 'ריו דה ז׳נרו', latitude: -22.9068, longitude: -43.1729, timezone: 'America/Sao_Paulo', countryCode: 'BR', region: 'americas' },
  { name: 'קאראקס', latitude: 10.4806, longitude: -66.9036, timezone: 'America/Caracas', countryCode: 'VE', region: 'americas' },
  { name: 'פנמה סיטי', latitude: 8.9824, longitude: -79.5199, timezone: 'America/Panama', countryCode: 'PA', region: 'americas' },

  // ===== אפריקה =====
  { name: 'יוהנסבורג', latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg', countryCode: 'ZA', region: 'africa' },
  { name: 'קייפטאון', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg', countryCode: 'ZA', region: 'africa' },
  { name: 'קזבלנקה', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca', countryCode: 'MA', region: 'africa' },

  // ===== אסיה ואוקיאניה =====
  { name: 'סידני', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney', countryCode: 'AU', region: 'asia-oceania' },
  { name: 'מלבורן', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne', countryCode: 'AU', region: 'asia-oceania' },
  { name: 'הונג קונג', latitude: 22.3193, longitude: 114.1694, timezone: 'Asia/Hong_Kong', countryCode: 'HK', region: 'asia-oceania' },
  { name: 'טוקיו', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo', countryCode: 'JP', region: 'asia-oceania' },
  { name: 'מומבאי', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata', countryCode: 'IN', region: 'asia-oceania' },
];

export const DEFAULT_LOCATIONS: StoredLocation[] = DEFAULT_LOCATIONS_BY_REGION;

export function toLocation(stored: StoredLocation): Location {
  return new Location(
    stored.latitude,
    stored.longitude,
    stored.countryCode === 'IL',
    stored.timezone,
    stored.name,
    stored.countryCode,
  );
}

export type DayHebrewInfo = {
  hebrew: string;
  gematria: string;
  /** Hebrew month name (e.g. "אייר"). For English use monthNameEn. */
  monthName: string;
  monthNameEn: string;
  dayOfMonth: number;
  year: number;
  /** Hebrew gematria string of the year (e.g. "תשפ״ו"). */
  yearHe: string;
  weekdayName: string;
};

const HEBREW_WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const HEB_MONTH_HE: Record<string, string> = {
  Nisan: 'ניסן',
  Iyyar: 'אייר',
  Sivan: 'סיון',
  Tamuz: 'תמוז',
  Av: 'אב',
  "Av ": 'אב',
  Elul: 'אלול',
  Tishrei: 'תשרי',
  Cheshvan: 'חשון',
  Kislev: 'כסלו',
  Tevet: 'טבת',
  "Sh'vat": 'שבט',
  Shvat: 'שבט',
  'Adar I': 'אדר א׳',
  'Adar II': 'אדר ב׳',
  Adar: 'אדר',
};

function yearToHebrewGematria(year: number): string {
  // Use HDate render to extract the gematria year string
  try {
    const hd = new HDate(1, 7, year); // Tishrei
    const full = hd.renderGematriya();
    const parts = full.split(' ');
    return parts.slice(2).join(' ');
  } catch {
    return String(year);
  }
}

/** Strip Hebrew nikud (vowel/cantillation marks) so month names like
    "סִיוָן" render as "סיון" — the user prefers unvocalized display. */
function stripNikud(s: string): string {
  return s.replace(/[֑-ׇ]/g, '');
}

export function hebrewDateInfo(date: Date = new Date()): DayHebrewInfo {
  const hd = new HDate(date);
  const gematria = stripNikud(hd.renderGematriya());
  const hebrew = hd.render('he-x-NoNikud');
  const monthNameEn = hd.getMonthName();
  const monthName = HEB_MONTH_HE[monthNameEn] || monthNameEn;
  const year = hd.getFullYear();
  return {
    hebrew,
    gematria,
    monthName,
    monthNameEn,
    dayOfMonth: hd.getDate(),
    year,
    yearHe: yearToHebrewGematria(year),
    weekdayName: HEBREW_WEEKDAYS[date.getDay()],
  };
}

const PARSHA_HE: Record<string, string> = {
  'Bereshit': 'בראשית', 'Noach': 'נח', 'Lech-Lecha': 'לך לך', 'Vayera': 'וירא',
  'Chayei Sara': 'חיי שרה', 'Toldot': 'תולדות', 'Vayetzei': 'ויצא', 'Vayishlach': 'וישלח',
  'Vayeshev': 'וישב', 'Miketz': 'מקץ', 'Vayigash': 'ויגש', 'Vayechi': 'ויחי',
  'Shemot': 'שמות', 'Vaera': 'וארא', 'Bo': 'בא', 'Beshalach': 'בשלח',
  'Yitro': 'יתרו', 'Mishpatim': 'משפטים', 'Terumah': 'תרומה', 'Tetzaveh': 'תצוה',
  'Ki Tisa': 'כי תשא', 'Vayakhel': 'ויקהל', 'Pekudei': 'פקודי',
  'Vayikra': 'ויקרא', 'Tzav': 'צו', 'Shmini': 'שמיני', 'Tazria': 'תזריע',
  'Metzora': 'מצורע', 'Achrei Mot': 'אחרי מות', 'Kedoshim': 'קדושים', 'Emor': 'אמור',
  'Behar': 'בהר', 'Bechukotai': 'בחקתי',
  'Bamidbar': 'במדבר', 'Nasso': 'נשא', "Beha'alotcha": 'בהעלתך', "Sh'lach": 'שלח',
  'Korach': 'קרח', 'Chukat': 'חקת', 'Balak': 'בלק', 'Pinchas': 'פינחס',
  'Matot': 'מטות', 'Masei': 'מסעי',
  'Devarim': 'דברים', "Va'etchanan": 'ואתחנן', 'Eikev': 'עקב', "Re'eh": 'ראה',
  'Shoftim': 'שופטים', 'Ki Teitzei': 'כי תצא', 'Ki Tavo': 'כי תבוא',
  'Nitzavim': 'נצבים', 'Vayeilech': 'וילך', "Ha'azinu": 'האזינו',
  'Vezot Haberakhah': 'וזאת הברכה',
};

function translateParsha(parshaArr: string[]): string {
  return parshaArr.map((p) => PARSHA_HE[p] || p).join(' - ');
}

export function parshahForDate(date: Date = new Date(), inIsrael = true): string | null {
  try {
    const hd = new HDate(date);
    const sedra = new Sedra(hd.getFullYear(), inIsrael);
    const result = sedra.lookup(hd);
    if (!result || !result.parsha || result.parsha.length === 0) return null;
    return translateParsha(result.parsha);
  } catch {
    return null;
  }
}

export function findNextShabbatParshah(from: Date, inIsrael = true): { parshah: string; saturday: Date } | null {
  const d = new Date(from);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  const hd = new HDate(d);
  const sedra = new Sedra(hd.getFullYear(), inIsrael);
  const result = sedra.lookup(hd);
  if (!result || !result.parsha || result.parsha.length === 0) return null;
  return {
    parshah: translateParsha(result.parsha),
    saturday: d,
  };
}

/** English (Sefaria-format) parsha name for the next Shabbat, e.g. "Bereshit".
 *  When two parshiyot are combined (e.g. "Vayakhel-Pekudei"), the FIRST one is
 *  returned, which is the convention for Monday/Thursday Torah reading — they
 *  always read from the first half of the combined parsha. */
export function findNextShabbatParshahEn(from: Date, inIsrael = true): string | null {
  const d = new Date(from);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  const hd = new HDate(d);
  const sedra = new Sedra(hd.getFullYear(), inIsrael);
  const result = sedra.lookup(hd);
  if (!result || !result.parsha || result.parsha.length === 0) return null;
  return result.parsha[0];
}

export type TodaysEvent = {
  description: string;
  emoji?: string;
  category: 'holiday' | 'roshChodesh' | 'fast' | 'omer' | 'minor' | 'parsha' | 'other';
};

function categorize(f: number): TodaysEvent['category'] {
  if (f & flags.ROSH_CHODESH) return 'roshChodesh';
  if (f & flags.MAJOR_FAST || f & flags.MINOR_FAST) return 'fast';
  if (f & flags.OMER_COUNT) return 'omer';
  if (f & flags.CHAG || f & flags.LIGHT_CANDLES || f & flags.LIGHT_CANDLES_TZEIS || f & flags.YOM_TOV_ENDS) return 'holiday';
  if (f & flags.MINOR_HOLIDAY) return 'minor';
  if (f & flags.PARSHA_HASHAVUA) return 'parsha';
  return 'other';
}

export function holidaysForDate(date: Date = new Date(), inIsrael = true): TodaysEvent[] {
  const hd = new HDate(date);
  const events = HebrewCalendar.calendar({
    start: hd,
    end: hd,
    il: inIsrael,
    sedrot: false,
    candlelighting: false,
    omer: true,
  });
  return events.map((ev) => {
    const desc = ev.render('he-x-NoNikud') || ev.renderBrief('he-x-NoNikud') || ev.render('he') || ev.getDesc();
    return {
      description: desc,
      category: categorize(ev.getFlags()),
    };
  });
}

export type ZmanimResult = {
  alotHaShachar: Date | null;
  misheyakir: Date | null;
  sunrise: Date | null;
  sofZmanShmaMA: Date | null;
  sofZmanShmaGRA: Date | null;
  sofZmanTfillaMA: Date | null;
  sofZmanTfillaGRA: Date | null;
  sofZmanAchilatChametz: Date | null;
  sofZmanBiurChametz: Date | null;
  chatzot: Date | null;
  minchaGedola: Date | null;
  minchaKetana: Date | null;
  plagHaMincha: Date | null;
  candleLighting: Date | null;
  sunset: Date | null;
  /** Daily tzeit: fixed 18 min after sunset (Geonim - daily mitzvot). */
  tzeit18min: Date | null;
  /** Standard end-of-Shabbat tzeit: 3 small stars, 8.5° below horizon.
   *  Varies by location and season. Used by Israeli Chief Rabbinate. */
  tzeitShabbat: Date | null;
  /** Stringent end-of-Shabbat (Chazon Ish / 13.5° below) - typically ~10 min later. */
  tzeitShabbatStrict: Date | null;
  /** Rabbeinu Tam: fixed 72 min after sunset (Chassidic / strict Ashkenazi). */
  tzeit72min: Date | null;
  /** @deprecated kept for compatibility - use tzeitShabbat */
  tzeit42min: Date | null;
  havdalah: Date | null;
  chatzotNight: Date | null;
};

export type SpecialDay = {
  isShabbat: boolean;
  isYomTov: boolean;
  isFast: boolean;
  isErevShabbat: boolean;
  isMotzeiShabbat: boolean;
  isErevPesach: boolean;
  fastName?: string;
};

export function getSpecialDay(date: Date, inIsrael = true): SpecialDay {
  const hd = new HDate(date);
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false, candlelighting: false });
  let isYomTov = false, isFast = false, fastName: string | undefined, isErevPesach = false;
  for (const ev of events) {
    const f = ev.getFlags();
    if (f & flags.CHAG) isYomTov = true;
    if ((f & flags.MAJOR_FAST) || (f & flags.MINOR_FAST)) {
      isFast = true;
      fastName = ev.render('he-x-NoNikud') || ev.getDesc();
    }
  }
  if (hd.getMonth() === 1 && hd.getDate() === 14) isErevPesach = true;
  const day = date.getDay();
  return {
    isShabbat: day === 6,
    isYomTov,
    isFast,
    isErevShabbat: day === 5,
    isMotzeiShabbat: day === 6,
    isErevPesach,
    fastName,
  };
}

export function computeZmanim(date: Date, location: StoredLocation): ZmanimResult {
  const z = new Zmanim(toLocation(location), date, false);
  const safe = (fn: () => Date) => {
    try {
      const v = fn();
      return v instanceof Date && !isNaN(v.getTime()) ? v : null;
    } catch {
      return null;
    }
  };
  const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60 * 1000);
  const candleMin = getCandleLightingMinutes(location);
  const dayOfWeek = date.getDay();

  return {
    alotHaShachar: safe(() => z.alotHaShachar()),
    misheyakir: safe(() => z.misheyakir()),
    sunrise: safe(() => z.sunrise()),
    sofZmanShmaMA: safe(() => z.sofZmanShmaMGA()),
    sofZmanShmaGRA: safe(() => z.sofZmanShma()),
    sofZmanTfillaMA: safe(() => z.sofZmanTfillaMGA()),
    sofZmanTfillaGRA: safe(() => z.sofZmanTfilla()),
    sofZmanAchilatChametz: safe(() => z.sofZmanTfillaMGA()),
    sofZmanBiurChametz: safe(() => z.sofZmanBiurChametzGRA()),
    chatzot: safe(() => z.chatzot()),
    minchaGedola: safe(() => z.minchaGedola()),
    minchaKetana: safe(() => z.minchaKetana()),
    plagHaMincha: safe(() => z.plagHaMincha()),
    candleLighting: dayOfWeek === 5 ? safe(() => addMin(z.sunset(), -candleMin)) : null,
    sunset: safe(() => z.sunset()),
    tzeit18min: safe(() => addMin(z.sunset(), 18)),
    // Location/season-aware: solar zenith 8.5° below horizon
    tzeitShabbat: safe(() => z.tzeit(8.5)),
    // Stringent (Chazon Ish): 13.5° below horizon - approx 10 min later
    tzeitShabbatStrict: safe(() => z.tzeit(13.5)),
    tzeit72min: safe(() => addMin(z.sunset(), 72)),
    // Keep tzeit42min name for legacy callers - now points to the location-aware tzeit
    tzeit42min: safe(() => z.tzeit(8.5)),
    havdalah: dayOfWeek === 6 ? safe(() => z.tzeit(8.5)) : null,
    chatzotNight: safe(() => z.chatzotNight()),
  };
}

export function formatTime(date: Date | null, timezone?: string): string {
  if (!date) return '—';
  return date.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
}

export function isShemita(year: number): boolean {
  return year % 7 === 0;
}

export function omerDay(date: Date = new Date()): number | null {
  const hd = new HDate(date);
  const events = HebrewCalendar.calendar({ start: hd, end: hd, omer: true, sedrot: false, candlelighting: false });
  for (const ev of events) {
    if (ev.getFlags() & flags.OMER_COUNT) {
      const desc = ev.getDesc();
      const m = desc.match(/(\d+)/);
      if (m) return parseInt(m[1], 10);
    }
  }
  return null;
}

export function candleLightingFriday(date: Date, location: StoredLocation, minutes = 18): Date | null {
  const d = new Date(date);
  while (d.getDay() !== 5) d.setDate(d.getDate() + (5 - d.getDay() + 7) % 7 || 7);
  try {
    const z = new Zmanim(toLocation(location), d, false);
    const sunset = z.sunset();
    return new Date(sunset.getTime() - minutes * 60 * 1000);
  } catch {
    return null;
  }
}
