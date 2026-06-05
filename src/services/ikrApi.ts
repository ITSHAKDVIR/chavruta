const ENDPOINT = 'https://a.ikr.org.il/privateTestAPI.php';

export type Business = {
  barcode: string;
  restaurantName: string;
  email?: string;
  restaurant_phone?: string;
  address?: string;
  owner_name?: string;
  owner_phone?: string;
  kashrutType?: string;
  restaurantTypes?: string[] | string;
  supervisorName?: string;
  supervisorCellphone?: string;
  inspectors?: string;
  comments?: string;
  lastKosherRemarks?: string;
};

export type CouncilOption = { id: number; name: string };

// רשימת הרשויות והמועצות הדתיות הזמינות ב-IKR.
// המספרים הם מזהי המועצה במערכת IKR. אם הרשימה לא עדכנית - אפשר לקרוא ל-fetchCouncils.
export const COUNCILS: CouncilOption[] = [
  { id: 4, name: 'ירושלים' },
  { id: 2, name: 'תל אביב' },
  { id: 3, name: 'חיפה' },
  { id: 6, name: 'אשדוד' },
  { id: 7, name: 'באר שבע' },
  { id: 1, name: 'כרמיאל' },
  { id: 5, name: 'נצרת' },
  { id: 8, name: 'בני ברק' },
  { id: 9, name: 'פתח תקווה' },
  { id: 10, name: 'נתניה' },
  { id: 11, name: 'ראשון לציון' },
  { id: 12, name: 'רחובות' },
  { id: 13, name: 'רמת גן' },
  { id: 14, name: 'אשקלון' },
  { id: 15, name: 'הרצליה' },
  { id: 16, name: 'מודיעין' },
  { id: 17, name: 'רעננה' },
  { id: 18, name: 'כפר סבא' },
  { id: 19, name: 'גבעתיים' },
  { id: 20, name: 'בית שמש' },
  { id: 21, name: 'ביתר עילית' },
  { id: 22, name: 'מודיעין עילית' },
  { id: 23, name: 'אלעד' },
  { id: 24, name: 'חולון' },
  { id: 25, name: 'בת ים' },
  { id: 26, name: 'רמלה' },
  { id: 27, name: 'לוד' },
  { id: 28, name: 'אופקים' },
  { id: 29, name: 'אילת' },
  { id: 30, name: 'דימונה' },
  { id: 31, name: 'נתיבות' },
  { id: 32, name: 'שדרות' },
  { id: 33, name: 'קרית מלאכי' },
  { id: 34, name: 'יבנה' },
  { id: 35, name: 'נס ציונה' },
  { id: 36, name: 'גבעת שמואל' },
  { id: 37, name: 'הוד השרון' },
  { id: 38, name: 'רמת השרון' },
  { id: 39, name: 'אור יהודה' },
  { id: 40, name: 'יהוד' },
  { id: 41, name: 'קרית אונו' },
  { id: 42, name: 'ראש העין' },
  { id: 43, name: 'טבריה' },
  { id: 44, name: 'צפת' },
  { id: 45, name: 'עפולה' },
  { id: 46, name: 'בית שאן' },
  { id: 47, name: 'נהריה' },
  { id: 48, name: 'עכו' },
  { id: 49, name: 'קרית שמונה' },
  { id: 50, name: 'מעלות תרשיחא' },
  { id: 51, name: 'קצרין' },
  { id: 52, name: 'מועצה אזורית מטה יהודה' },
  { id: 53, name: 'מועצה אזורית מטה בנימין' },
  { id: 54, name: 'מועצה אזורית גוש עציון' },
];

/** Attempts to fetch the official council list. Falls back to the hard-coded list. */
export async function fetchCouncils(): Promise<CouncilOption[]> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'kosharotGetCouncils' }),
    });
    if (!res.ok) return COUNCILS;
    const json: any = await res.json();
    if (Array.isArray(json.councils) && json.councils.length > 0) {
      return json.councils.map((c: any) => ({ id: c.id, name: c.name }));
    }
    return COUNCILS;
  } catch {
    return COUNCILS;
  }
}

/** AbortController-backed timeout so a slow IKR response can't lock up the UI.
 *  The endpoint can take a while; we wait up to 20 seconds per request. */
async function fetchWithTimeout<T = any>(url: string, init: RequestInit, ms = 20000): Promise<Response | null> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchBusinesses(councilId: number, timeoutMs = 20000): Promise<Business[]> {
  try {
    const res = await fetchWithTimeout(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'kosharotGetBusinesses', councilId }),
    }, timeoutMs);
    if (!res || !res.ok) return [];
    const json: any = await res.json();
    return (json.businesses ?? []) as Business[];
  } catch {
    return [];
  }
}

// ============================================================
// Adapter: fetch IKR (official rabbinate DB) businesses for a city
// and shape them into the same Restaurant type that the kosharotApi
// uses, so the UI can merge both sources into a single list.
// ============================================================

import type { Restaurant, CategoryId } from './kosharotApi';

/** Normalize Hebrew for forgiving city-name matching. */
function normalize(s: string): string {
  return (s || '').replace(/['"׳״]/g, '').replace(/\s+/g, ' ').trim();
}

/** Try to map a free-text city name to one of IKR's 54 councils.
 *  Returns null if no council matches. */
export function councilIdForCity(cityName: string): number | null {
  const target = normalize(cityName);
  if (!target) return null;
  // Exact match first
  for (const c of COUNCILS) {
    if (normalize(c.name) === target) return c.id;
  }
  // Substring either way (e.g. "תל אביב-יפו" ↔ "תל אביב")
  for (const c of COUNCILS) {
    const n = normalize(c.name);
    if (n.includes(target) || target.includes(n)) return c.id;
  }
  return null;
}

/** Heuristic: map IKR's restaurantTypes (free text/array) to our CategoryId. */
function inferCategory(types: string | string[] | undefined, kashrut: string | undefined): CategoryId | null {
  const blob = [
    Array.isArray(types) ? types.join(' ') : (types || ''),
    kashrut || '',
  ].join(' ');
  if (/מלון|מלונות/.test(blob)) return 4;
  if (/אולם|קייטרינג/.test(blob)) return 2;
  if (/חנות|סופר|מאפ|אטליז|מכולת|מרכול/.test(blob)) return 3;
  if (/מהיר|פלאפל|שווארמה|פיצ|פאסט|fast/i.test(blob)) return 142;
  if (/מסעדה|בית קפה|ביסטרו|קפיטריה/.test(blob)) return 1;
  return null;
}

const CATEGORY_NAMES_LOCAL: Record<CategoryId, string> = {
  1: 'מסעדות',
  2: 'אולמות / קייטרינג',
  3: 'חנויות מזון',
  4: 'מלונות',
  142: 'מזון מהיר',
};

function shapeBusinessToRestaurant(b: Business, councilCity: string): Restaurant {
  const cat = inferCategory(b.restaurantTypes, b.kashrutType);
  return {
    source: 'ikr',
    name: (b.restaurantName || '').trim(),
    address: (b.address || '').trim(),
    city: councilCity,  // IKR doesn't return a separate city field
    categoryId: cat,
    category: cat ? CATEGORY_NAMES_LOCAL[cat] : null,
    kashrutKind: (b.kashrutType || '').trim(),
    supervisorAuthority: `רבנות ${councilCity}`,
    supervisor: (b.supervisorName || b.supervisorCellphone || b.restaurant_phone || '').trim(),
    remarks: [b.comments, b.lastKosherRemarks].filter(Boolean).join(' · ').trim(),
    lat: null,
    lng: null,
  };
}

// ============================================================
// Test/staging filter
// ------------------------------------------------------------
// IKR lists some councils that are still "בהקמה" (in setup/staging)
// and contain dummy data. There's no API field exposing that status,
// so we filter by known signals:
//   1. Explicit barcode blocklist  (extensible by user reports)
//   2. Name/owner/kashrut text patterns matching test markers
//   3. Councils whose business count is suspiciously tiny (≤2) AND
//      whose contents look like placeholders.
// ============================================================

/** Specific barcodes the user has flagged as test data.
 *  These are belt-and-suspenders coverage in case the staging-council
 *  heuristic ever misses them (e.g. if council 4 transitions to real). */
const BLOCKED_BARCODES = new Set<string>([
  '107', // המקרר של בצלאל - council 4 staging
  '108', // פיצה נווה עפרה - council 4 staging
  '109', // קייטרינג קדמה - council 4 staging
  '110', // אולם הבריאה - council 4 staging
  '111', // משחטת חיים - council 4 staging
  '281', // הבית של החיילים - council 4 staging
]);

/** Substring patterns that signal a staging/test record. */
const TEST_NAME_PATTERNS = [
  /המקרר\s*של\s*בצלאל/,   // explicit example
  /מועצ.*נסיונ/,           // "מועצה נסיונית"
  /\bנסיוני(ת|)?\b/,        // ניסיוני / ניסיונית
  /\bבדיקה\b/,
  /\bלבדיק(ה|ות)\b/,
  /\bדמו\b/,
  /\bדוגמ(ה|א)\b/,
  /^\s*test\s*/i,
  /^\s*demo\s*/i,
];

function looksLikeTestEntry(b: Business): boolean {
  const code = (b.barcode || '').trim();
  if (BLOCKED_BARCODES.has(code)) return true;
  const blob = [
    b.restaurantName,
    b.owner_name,
    b.kashrutType,
    b.supervisorName,
    b.comments,
  ].filter(Boolean).join(' ');
  return TEST_NAME_PATTERNS.some((rx) => rx.test(blob));
}

/** Extract the city name from a free-text address. IKR uses comma-separated
 *  "street, city" so the last segment is the city in most records. */
function extractCity(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2 ? normalize(parts[parts.length - 1]) : '';
}

/** Classify a council as still being in "הקמה" (staging) by data shape.
 *
 *  IKR currently returns several councils that are clearly staging/test:
 *    - Empty (0 businesses) — likely future council not yet active
 *    - Tiny (1-10 businesses) with no geographic anchor — entries scattered
 *      across many unrelated cities, none dominant. A real municipal council
 *      would have most of its businesses in its home city.
 *    - Larger (>10) but with no dominant home city — top city < 30% of total.
 *
 *  Verified examples (as of 2026-06):
 *    council 1: 7 businesses, 6 distinct cities (86% entropy) → staging
 *    council 2: 1 business in כפר ורדים (hardcoded as ת"א) → staging
 *    council 4: 33 businesses, top city 9/33 = 27% → staging  */
function looksLikeStagingCouncil(businesses: Business[]): boolean {
  if (businesses.length === 0) return true;
  // Existing rule: ≤2 entries that ALL look like placeholders
  if (businesses.length <= 2 && businesses.every(looksLikeTestEntry)) return true;

  const cities = new Map<string, number>();
  for (const b of businesses) {
    const c = extractCity(b.address || '');
    if (c) cities.set(c, (cities.get(c) || 0) + 1);
  }
  if (cities.size === 0) return false;

  const total = businesses.length;
  const dominantCount = Math.max(...cities.values());
  const dominantShare = dominantCount / total;
  const diversityRatio = cities.size / total;

  // Tiny council with scattered geo: ≤10 businesses, ≥70% unique cities
  if (total <= 10 && diversityRatio >= 0.7) return true;

  // Larger council with no clear home city: dominant share < 30%
  if (dominantShare < 0.3 && cities.size >= 5) return true;

  return false;
}

// ============================================================
// Rate-limit protection: in-memory cache + single-flight per councilId
// ------------------------------------------------------------
// IKR appears to rate-limit by IP. To keep users from getting blocked:
//   1. Cache results per councilId for 10 minutes (TTL).
//   2. Single-flight: if a fetch for councilId X is already in flight,
//      a concurrent request for X joins the same promise instead of
//      starting a second connection.
//   3. The caller (kosher-restaurants screen) must NOT re-fetch when
//      only category filters change — category filtering is client-side.
// ============================================================

const TTL_MS = 10 * 60 * 1000; // 10 minutes
type CacheEntry = { at: number; data: Restaurant[] };
const cache = new Map<number, CacheEntry>();
const inflight = new Map<number, Promise<Restaurant[]>>();

/** Fetch IKR businesses for the council that matches `cityName`, and shape
 *  them into our Restaurant type. Returns [] if no matching council exists
 *  (the 54 councils cover the major cities only) or if the API fails.
 *
 *  Caching: results memoized per councilId for 10 minutes. Concurrent
 *  callers for the same councilId share one in-flight promise so we never
 *  open a second TCP connection while one is pending.
 *
 *  Filtering applied:
 *    - test/staging entries removed (barcode + name patterns)
 *    - regional councils restricted to addresses mentioning the city
 *    - "council in setup" heuristic: if a council returns ≤2 businesses
 *      AND every one of them looks like a placeholder, treat the whole
 *      council as a staging council and return []. */
export async function fetchIkrByCity(cityName: string): Promise<Restaurant[]> {
  const councilId = councilIdForCity(cityName);
  if (councilId == null) return [];
  const council = COUNCILS.find((c) => c.id === councilId);
  const councilCity = council?.name || cityName;

  // 1. Fresh cache hit → return immediately, no network call
  const cached = cache.get(councilId);
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) {
    return regionalRestrict(cached.data, councilCity, cityName);
  }

  // 2. Already fetching this council → join the same promise
  const pending = inflight.get(councilId);
  if (pending) {
    const data = await pending;
    return regionalRestrict(data, councilCity, cityName);
  }

  // 3. Start a new fetch, expose it via inflight, store on success
  const p = (async (): Promise<Restaurant[]> => {
    const businesses = await fetchBusinesses(councilId);
    if (!Array.isArray(businesses) || businesses.length === 0) return [];

    // Council-level filter: is this whole council still "בהקמה"?
    if (looksLikeStagingCouncil(businesses)) return [];

    // Entry-level filter: drop individual test entries
    const clean = businesses.filter((b) => !looksLikeTestEntry(b));
    return clean.map((b) => shapeBusinessToRestaurant(b, councilCity));
  })();
  inflight.set(councilId, p);
  try {
    const data = await p;
    cache.set(councilId, { at: now, data });
    return regionalRestrict(data, councilCity, cityName);
  } finally {
    inflight.delete(councilId);
  }
}

/** Defensive city filter.
 *
 *  Empirically the IKR `councilId` ↔ city mapping is unstable: as of
 *  2026 a single councilId returns businesses scattered across the country
 *  (e.g. council 4 contains entries in מיתר, אבו גוש, עכו, אלון מורה...).
 *  Our hardcoded COUNCILS map is therefore not reliable. To avoid showing
 *  a user from ירושלים businesses that are actually in מיתר, we always
 *  filter IKR results to those whose address mentions the requested city.
 *
 *  Done client-side after caching, so the same cached council can be
 *  re-used for different sub-cities. */
function regionalRestrict(data: Restaurant[], _councilCity: string, requestedCity: string): Restaurant[] {
  const targetNorm = normalize(requestedCity);
  if (!targetNorm) return data;
  return data.filter((r) => {
    const addr = normalize(r.address || '');
    const city = normalize(r.city || '');
    return addr.includes(targetNorm) || city.includes(targetNorm);
  });
}

export async function fetchProductByBarcode(barcode: string): Promise<any> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'kosharotGetProducts', barcode }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
