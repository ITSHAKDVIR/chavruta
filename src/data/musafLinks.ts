/**
 * Per-nusach navigation paths to the Musaf Amidah for Rosh Chodesh and the
 * three Regalim (Pesach/Sukkot incl. Chol HaMoed + Shavuot + Shmini Atzeret).
 *
 * The Sefaria siddur tree places Musaf under different parents per nusach:
 *   - Ashkenazi: Festivals > Rosh Chodesh > Musaf Amidah for Rosh Chodesh
 *   - Sephardi:  Rosh Chodesh > Mussaf
 *   - Edot HaMizrach: Rosh Hodesh > Mussaf
 *   - Chabad:    Rosh Chodesh (single leaf containing the Musaf)
 *
 * This module exposes a single function `getActiveMusafLink(date, inIsrael,
 * nusach)` returning the navigation path (slugified) and a Hebrew label for
 * a banner — or null when no Musaf applies (regular weekday).
 *
 * Today's logic (Israel):
 *   - Shabbat: Musaf is part of the Shabbat Shacharit flow (not surfaced here)
 *   - Rosh Chodesh weekday: link to RC Musaf
 *   - Chol HaMoed Pesach/Sukkot (weekday): link to Festivals Musaf
 *   - Yom Tov: link to Festivals Musaf
 *   - Shmini Atzeret / Simchat Torah: link to Festivals Musaf
 *   - Regular weekday: no Musaf, return null
 */
import { HDate, HebrewCalendar, flags } from '@hebcal/core';

export type Nusach = 'ashkenazi' | 'sephardi' | 'edot-mizrach' | 'chabad' | 'baladi';

export type MusafLink = {
  /** Hebrew label for the banner ("מוסף לראש חודש" / "מוסף לחול המועד" etc.) */
  label: string;
  /** URL path passed to /tfilon/read?nusach=...&path=... — already slugified.
   *  Use the same slug format read.tsx expects (lowercase, dash-separated). */
  path: string;
  /** Short tag for analytics / which kind of Musaf (rc / chag / chol-hamoed). */
  kind: 'rc' | 'chag' | 'chol-hamoed' | 'shmini-atzeret';
};

const RC_PATHS: Record<Nusach, string> = {
  ashkenazi: 'festivals/rosh-chodesh/musaf-amidah-for-rosh-chodesh',
  sephardi: 'rosh-chodesh/mussaf',
  'edot-mizrach': 'rosh-hodesh/mussaf',
  chabad: 'rosh-chodesh',
  // Baladi uses the Edot Mizrach tree until a dedicated Baladi index exists.
  baladi: 'rosh-hodesh/mussaf',
};

const REGALIM_PATHS: Record<Nusach, string> = {
  ashkenazi: 'festivals/shalosh-regalim/mussaf',
  sephardi: 'holidays/yom-tov-musaf-amidah',
  'edot-mizrach': 'prayers-for-three-festivals/mussaf',
  chabad: 'musaf-for-festivals',
  baladi: 'prayers-for-three-festivals/mussaf',
};

/**
 * Decide which Musaf, if any, applies today.
 * Returns null on Shabbat (Shabbat Shacharit has its own Musaf flow) and on
 * regular weekdays.
 */
export function getActiveMusafLink(
  date: Date = new Date(),
  inIsrael = true,
  nusach: Nusach = 'ashkenazi',
): MusafLink | null {
  // Shabbat — handled by Shabbat siddur flow
  if (date.getDay() === 6) return null;

  const hd = new HDate(date);
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });

  // Chag (Pesach, Shavuot, Sukkot, Shmini Atzeret, Simchat Torah, RH, YK).
  // RH and YK don't have Musaf navigation here — they have their own siddurim.
  const chag = events.find((e) => e.getFlags() & flags.CHAG);
  // Chol HaMoed (Pesach / Sukkot)
  const cholHamoed = events.find((e) => e.getFlags() & flags.CHOL_HAMOED);
  // Rosh Chodesh
  const rc = events.find((e) => e.getFlags() & flags.ROSH_CHODESH);

  if (chag) {
    const desc = chag.getDesc();
    // Rosh Hashana / Yom Kippur → handled separately (not surfacing here)
    if (/Rosh Hashana|Yom Kippur/i.test(desc)) return null;
    return {
      label: 'מוסף לחג',
      path: REGALIM_PATHS[nusach],
      kind: 'chag',
    };
  }
  if (cholHamoed) {
    const desc = cholHamoed.getDesc();
    const which = /Pesach/i.test(desc) ? 'פסח' : /Sukkot/i.test(desc) ? 'סוכות' : '';
    return {
      label: which ? `מוסף לחול המועד ${which}` : 'מוסף לחול המועד',
      path: REGALIM_PATHS[nusach],
      kind: 'chol-hamoed',
    };
  }
  if (rc) {
    return {
      label: 'מוסף לראש חודש',
      path: RC_PATHS[nusach],
      kind: 'rc',
    };
  }
  return null;
}
