import { HDate, months } from '@hebcal/core';

// Purim is kept on 14 Adar everywhere except walled cities (Jerusalem), which keep
// Shushan Purim on 15 Adar. Al HaNisim, Vayavo Amalek and Purim Maariv follow the
// user's own day — the "אני בירושלים" setting, not the region (Beit Shemesh,
// Efrat and Beitar sit in the Jerusalem region but keep Purim on the 14th).
// Pure module (no React / storage) so the parser and the audit can import it;
// the persisted setting lives in src/hooks/useJerusalemPurim.ts.
let jerusalem = false;

export function isJerusalemPurim(): boolean {
  return jerusalem;
}

export function setJerusalemPurim(v: boolean): void {
  jerusalem = v;
}

/** The day this user celebrates Purim: 14 Adar, or 15 Adar (Shushan Purim) in
 *  Jerusalem. Adar II in a leap year (Adar I 14/15 is Purim Katan). */
export function isPurimForUser(date: Date | HDate, inIsrael: boolean): boolean {
  const hd = date instanceof HDate ? date : new HDate(date);
  const adar = HDate.isLeapYear(hd.getFullYear()) ? months.ADAR_II : months.ADAR_I;
  if (hd.getMonth() !== adar) return false;
  return hd.getDate() === (inIsrael && jerusalem ? 15 : 14);
}
