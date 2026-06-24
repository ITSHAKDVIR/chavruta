/**
 * Song of the Day (שיר של יום) — keep only TODAY's psalm out of the 7-day list
 * Sefaria returns. Extracted from read.tsx so it can be unit-tested and reused
 * by the audit renderer.
 *
 * Four Sefaria formats, all handled:
 *   Ashkenaz / Sefard / Chabad : "בראשון בשבת:" + "היום יום ראשון בשבת…"
 *   Edot HaMizrach             : "מזמור ליום ראשון היום יום אחד בשבת…"
 *
 * Beyond the 7-day rotation, the leaf may carry a COMMON TAIL after the last
 * day's psalm that belongs to EVERY day, not just Friday:
 *   • Edot HaMizrach — special-day additions (gated later by the parser) plus
 *     the shared closing kaddish.
 *   • Sefard — the FULL "הושיענו" text is written out only under the last day
 *     (other days carry just an abbreviated "(הושיענו וכו')" note).
 * We detect and carry that tail so it shows on Sun–Thu too. Chabad repeats the
 * full הושיענו + kaddish in EVERY day block, so we must NOT treat that as a
 * shared tail (it would duplicate) — hence the "appears exactly once" guard.
 */
import { markerToTags } from './siddurParser';

const NIKUD_RX = /[֑-ׇ]/g;

// Match ONLY the divider line that opens each day's block — "בראשון בשבת",
// "שיר של יום ראשון", or (Edot HaMizrach) "מזמור ליום ראשון". Do NOT add the
// "היום יום ראשון…" intro form: in Ashkenaz/Sefard it sits on its OWN line right
// after the divider, so matching it too would register a second marker for the
// same day and truncate the section to just the header.
const DAY_OF_WEEK_MARKERS = [
  /^(ב?ראשון\s+ב?שבת|שיר של יום ראשון|מזמור ליום ראשון)/,                    // Sunday
  /^(ב?שני\s+ב?שבת|שיר של יום שני|מזמור ליום שני)/,                          // Monday
  /^(ב?שלישי\s+ב?שבת|שיר של יום שלישי|מזמור ליום שלישי)/,                    // Tuesday
  /^(ב?רביעי\s+ב?שבת|שיר של יום רביעי|מזמור ליום רביעי)/,                    // Wednesday
  /^(ב?חמישי\s+ב?שבת|שיר של יום חמישי|מזמור ליום חמישי)/,                    // Thursday
  /^(ב?שי?שי\s+ב?שבת|שיר של יום שי?שי|מזמור ליום שי?שי)/,                    // Friday (שישי/ששי)
  /^(ב?שבת|יום\s+השבת|שיר של יום (שבת|שביעי)|מזמור ליום (השבת|שביעי))/,      // Shabbat
];

const bareOf = (l: string): string => l.replace(/<[^>]+>/g, '').replace(NIKUD_RX, '').trim();

export function filterDailyPsalmForToday(lines: string[], dow: number): string[] {
  const markerIdxs: { dow: number; idx: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const bare = bareOf(lines[i]);
    for (let d = 0; d < DAY_OF_WEEK_MARKERS.length; d++) {
      if (DAY_OF_WEEK_MARKERS[d].test(bare)) { markerIdxs.push({ dow: d, idx: i }); break; }
    }
  }
  if (markerIdxs.length === 0) return lines;
  const myMarker = markerIdxs.find((m) => m.dow === dow);
  if (!myMarker) return lines; // unknown day; show everything
  const myIdxInList = markerIdxs.indexOf(myMarker);
  const nextMarker = markerIdxs[myIdxInList + 1];
  const introEnd = markerIdxs[0].idx;
  const todayEnd = nextMarker ? nextMarker.idx : lines.length;
  const lastDay = markerIdxs[markerIdxs.length - 1];

  // Locate the COMMON TAIL: first line after the last day-marker that is either
  // a special-day rubric (maps to date tags) or the shared closing הושיענו that
  // appears exactly once in the leaf (Sefard). Everything from there to the end
  // is shared by all days.
  const fullHoshienuCount = lines.filter((l) => /^הושיענו אלהי ישענו/.test(bareOf(l))).length;
  let tailStart = lines.length;
  for (let i = lastDay.idx + 1; i < lines.length; i++) {
    const bare = bareOf(lines[i]);
    // A special-day rubric is a short directive that ENDS with "אומרים" (e.g.
    // "בחנוכה אומרים", "בראש חדש … אומרים", "בצום גדליה … אומרים") and maps to a
    // date tag. The end-anchor excludes a day-psalm intro like "…הלוים אומרים
    // בבית המקדש" (which also contains בשבת → a shabbat tag) from being mistaken
    // for the tail boundary.
    const isSpecialRubric = /אומרים\s*:?\s*$/.test(bare) && markerToTags(bare).length > 0;
    const isSharedHoshienu = fullHoshienuCount === 1 && /^הושיענו אלהי ישענו/.test(bare);
    if (isSpecialRubric || isSharedHoshienu) { tailStart = i; break; }
  }

  const head = [...lines.slice(0, introEnd), ...lines.slice(myMarker.idx, todayEnd)];
  // Append the shared tail unless TODAY is the last day (whose own section already
  // contains it).
  if (tailStart < lines.length && myMarker.idx !== lastDay.idx) {
    return [...head, ...lines.slice(tailStart)];
  }
  return head;
}
