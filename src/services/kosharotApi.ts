/**
 * Direct DB-backed restaurants API for Kosharot. Hits the PHP endpoint
 * we deployed at kosharot.co.il/restaurants_api.php which queries the
 * `kosharot_rest` table without the chat-bot's 15-row truncation.
 *
 * Query shapes:
 *   - city-based:  fetchRestaurantsByCity('ירושלים')
 *   - GPS-based :  fetchRestaurantsNear(lat, lng, radiusKm)
 *   - cities meta: fetchCities('ירוש')      // autocomplete
 *
 * Optional category filter (1=מסעדות, 2=אולמות, 3=חנויות, 4=מלונות,
 * 142=מזון מהיר) applies to either search shape.
 */

const ENDPOINT = 'https://www.kosharot.co.il/restaurants_api.php';

export type CategoryId = 1 | 2 | 3 | 4 | 142;
export const CATEGORY_NAMES: Record<CategoryId, string> = {
  1: 'מסעדות',
  2: 'אולמות / קייטרינג',
  3: 'חנויות מזון',
  4: 'מלונות',
  142: 'מזון מהיר',
};

export type Restaurant = {
  source: 'kosharot' | 'ikr'; // mark per-card so UI can show a badge
  name: string;
  address: string;
  city: string;
  categoryId: CategoryId | null;
  category: string | null;
  kashrutKind: string;     // "בשרי", "חלבי", "סושי", ...
  supervisorAuthority: string;  // "רבנות ירושלים ובד״ץ ..."
  supervisor: string;      // person name OR phone number
  remarks: string;         // free text; HTML stripped here
  remarksUrl?: string;     // first URL extracted from raw remarks, if any
  lat: number | null;
  lng: number | null;
  distanceKm?: number;     // present only when called with GPS
};

export type CityWithCount = { name: string; count: number };

type RawRestaurant = {
  name?: string;
  address?: string;
  city?: string;
  categoryId?: CategoryId | null;
  category?: string | null;
  kashrutKind?: string;
  supervisorAuthority?: string;
  supervisor?: string;
  remarks?: string;
  lat?: number | null;
  lng?: number | null;
  distance_km?: number;
};

/** Strip HTML tags and decode common entities. Captures the first href
 *  (if any) so the app can render a "more info" link button. */
function cleanRemarks(html: string): { text: string; url?: string } {
  if (!html) return { text: '' };
  let url: string | undefined;
  const hrefMatch = html.match(/href\s*=\s*"([^"]+)"/);
  if (hrefMatch) url = hrefMatch[1].replace(/&amp;/g, '&');
  let t = html.replace(/<[^>]+>/g, ' ');
  t = t
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, '…');
  t = t.replace(/\s+/g, ' ').trim();
  return { text: t, url };
}

function shapeRestaurant(raw: RawRestaurant): Restaurant {
  const r = cleanRemarks(raw.remarks || '');
  return {
    source: 'kosharot',
    name: (raw.name || '').trim(),
    address: (raw.address || '').trim(),
    city: (raw.city || '').trim(),
    categoryId: raw.categoryId ?? null,
    category: raw.category ?? null,
    kashrutKind: (raw.kashrutKind || '').trim(),
    supervisorAuthority: (raw.supervisorAuthority || '').trim(),
    supervisor: (raw.supervisor || '').trim(),
    remarks: r.text,
    remarksUrl: r.url,
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
    distanceKm: raw.distance_km,
  };
}

async function fetchJson(url: string, timeoutMs = 20000): Promise<any | null> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export type FetchOpts = {
  category?: CategoryId | CategoryId[];
  limit?: number;
};

function appendCategory(params: URLSearchParams, cat: FetchOpts['category']) {
  if (!cat) return;
  const list = Array.isArray(cat) ? cat : [cat];
  if (list.length > 0) params.set('category', list.join(','));
}

export async function fetchRestaurantsByCity(city: string, opts: FetchOpts = {}): Promise<Restaurant[]> {
  if (!city || !city.trim()) return [];
  const params = new URLSearchParams({ city: city.trim() });
  appendCategory(params, opts.category);
  if (opts.limit) params.set('limit', String(opts.limit));
  const data = await fetchJson(`${ENDPOINT}?${params.toString()}`);
  if (!data?.ok || !Array.isArray(data.restaurants)) return [];
  return (data.restaurants as RawRestaurant[]).map(shapeRestaurant);
}

export async function fetchRestaurantsNear(
  lat: number,
  lng: number,
  radiusKm = 5,
  opts: FetchOpts = {},
): Promise<Restaurant[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius_km: String(radiusKm),
  });
  appendCategory(params, opts.category);
  if (opts.limit) params.set('limit', String(opts.limit));
  const data = await fetchJson(`${ENDPOINT}?${params.toString()}`);
  if (!data?.ok || !Array.isArray(data.restaurants)) return [];
  return (data.restaurants as RawRestaurant[]).map(shapeRestaurant);
}

/**
 * Fetch the list of distinct cities. With no `query`, returns the top 200
 * cities by restaurant count. With a query, filters client-side.
 *
 * The full list is fetched ONCE per session (~1.5KB, ~80ms) and cached in
 * memory; subsequent calls — including every keystroke in autocomplete —
 * are synchronous client-side filters. This keeps the picker responsive
 * even on slow connections.
 */
let citiesCache: CityWithCount[] | null = null;
let citiesInFlight: Promise<CityWithCount[]> | null = null;

async function loadAllCities(): Promise<CityWithCount[]> {
  if (citiesCache) return citiesCache;
  if (citiesInFlight) return citiesInFlight;
  citiesInFlight = (async () => {
    const data = await fetchJson(`${ENDPOINT}?cities=1`, 10000);
    const list = data?.ok && Array.isArray(data.cities) ? (data.cities as CityWithCount[]) : [];
    citiesCache = list;
    citiesInFlight = null;
    return list;
  })();
  return citiesInFlight;
}

export async function fetchCities(query = ''): Promise<CityWithCount[]> {
  const all = await loadAllCities();
  const q = query.trim();
  if (!q) return all;
  return all.filter((c) => c.name.includes(q));
}
