/**
 * User preferences that affect what's shown in the siddur reader.
 *
 * These let the user say:
 *   - "I'm davening with a minyan today" → קדושה, מודים דרבנן, חזרת הש"ץ shown
 *   - "I'm davening alone" → those hidden as 'not in season' style
 *   - "Include Mon/Thu Torah reading" → leyning section appears after הוצאת ס"ת
 *   - "Quiet mode" → in-app banner reminding to enable system DND
 *
 * All preferences are persisted to AsyncStorage and reload across sessions.
 */
import { getJSON, setJSON, Keys } from './storage';
import { useEffect, useState } from 'react';

export type SiddurPrefs = {
  /** דאבון במניין → קדושה + מודים דרבנן + חזרת הש"ץ + קדיש */
  withMinyan: boolean;
  /** קריאת התורה בשני/חמישי תוצג בתוך הסידור (אם זה היום) */
  includeMondayThursdayLeyning: boolean;
  /** ברכת כהנים (במניין בלבד) */
  includeBirkatKohanim: boolean;
  /** תפילה לשלום המדינה */
  includeTefilaLaMedina: boolean;
  /** תפילה לשלום החיילים */
  includeTefilaLaTzva: boolean;
  /** מי שבירך לחולים (יש לזה גם מסך נפרד) */
  includeMishBeirachCholim: boolean;
  /** ברכי נפשי — תהילים ק"ד, ראש חודש */
  includeBarchiNafshi: boolean;
  /** לדוד ה' אורי וישעי — תהילים כ"ז, אלול עד הושענא רבה */
  includeLeDavidHashemOri: boolean;
  /** הלל (לא בכל יום שיש בו תוספת — תלוי בחג) */
  includeHallel: boolean;
  /** הוצאת ספר תורה (קריאת התורה — ב', ה', ר"ח, חגים, תעניות) */
  includeTorahService: boolean;
  /** אבינו מלכנו (עשי"ת + תעניות ציבור) */
  includeAvinuMalkenu: boolean;
  /** מצב שקט: באנר חכם המזכיר להפעיל DND של המכשיר */
  quietMode: boolean;
};

export const DEFAULT_SIDDUR_PREFS: SiddurPrefs = {
  withMinyan: true,
  includeMondayThursdayLeyning: true,
  includeBirkatKohanim: true,
  includeTefilaLaMedina: false,
  includeTefilaLaTzva: false,
  includeMishBeirachCholim: false,
  includeBarchiNafshi: true,    // ברירת מחדל — לראש חודש בלבד, אבל מוצג
  includeLeDavidHashemOri: true, // אלול-הושענא רבה
  includeHallel: true,           // בחגים
  includeTorahService: true,
  includeAvinuMalkenu: true,
  quietMode: false,
};

export async function loadSiddurPrefs(): Promise<SiddurPrefs> {
  const stored = await getJSON<Partial<SiddurPrefs>>(Keys.siddurPrefs, {});
  return { ...DEFAULT_SIDDUR_PREFS, ...stored };
}

export async function saveSiddurPrefs(prefs: SiddurPrefs): Promise<void> {
  await setJSON(Keys.siddurPrefs, prefs);
  notifyListeners();
}

const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/** React hook for components that need to react to pref changes. */
export function useSiddurPrefs(): [SiddurPrefs, (next: SiddurPrefs) => Promise<void>] {
  const [prefs, setPrefs] = useState<SiddurPrefs>(DEFAULT_SIDDUR_PREFS);

  useEffect(() => {
    loadSiddurPrefs().then(setPrefs);
    const refresh = () => loadSiddurPrefs().then(setPrefs);
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, []);

  const update = async (next: SiddurPrefs) => {
    setPrefs(next);
    await saveSiddurPrefs(next);
  };

  return [prefs, update];
}

/** Map a Sefaria section English/Hebrew identifier to a flag in SiddurPrefs.
 *  When the flag is false, the section is hidden from the siddur reader. */
export function shouldHideForPrefs(en: string, prefs: SiddurPrefs): boolean {
  const text = en || '';
  if (!prefs.withMinyan) {
    if (/Kedusha|Kedushah|קדושה|Modim DeRabbanan|מודים דרבנן|Repetition|Chazarat|חזרת הש|Kaddish|קדיש|Birchot Hatorah By Oleh/i.test(text)) {
      return true;
    }
  }
  if (!prefs.includeBirkatKohanim) {
    if (/Birkat Kohanim|ברכת כהנים/i.test(text)) return true;
  }
  if (!prefs.includeTefilaLaMedina) {
    if (/Tefilla.*Medina|תפילה לשלום המדינה/i.test(text)) return true;
  }
  if (!prefs.includeTefilaLaTzva) {
    if (/Tefilla.*Tzva|חיילי צה|לשלום צבא/i.test(text)) return true;
  }
  if (!prefs.includeMishBeirachCholim) {
    if (/Mi Sheberach.*Cholim|מי שבירך לחולים/i.test(text)) return true;
  }
  if (!prefs.includeBarchiNafshi) {
    if (/Barchi Nafshi|ברכי נפשי/i.test(text)) return true;
  }
  if (!prefs.includeLeDavidHashemOri) {
    if (/LeDavid Hashem Ori|לדוד.*אורי|Psalm 27|תהלים כז|תהילים כ"ז/i.test(text)) return true;
  }
  if (!prefs.includeHallel) {
    if (/\bHallel\b|הלל/i.test(text)) return true;
  }
  if (!prefs.includeTorahService) {
    if (/Torah Reading|הוצאת ספר תורה|קריאת התורה/i.test(text)) return true;
  }
  if (!prefs.includeAvinuMalkenu) {
    if (/Avinu Malkenu|אבינו מלכנו/i.test(text)) return true;
  }
  return false;
}
