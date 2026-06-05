export type GeoCircle = { kind: 'circle'; lat: number; lng: number; radiusKm: number };
export type GeoSegment = { kind: 'segment'; from: [number, number]; to: [number, number]; corridorKm: number };
export type GeoArea = GeoCircle | GeoSegment;

export type WaterSite = {
  id: string;
  hebrewName: string;
  description: string;
  brachaText: string;
  brachaShortName: string;
  intervalDays: number;
  triggerKm: number;
  areas: GeoArea[];
};

export const WATER_SITES: WaterSite[] = [
  {
    id: 'mediterranean',
    hebrewName: 'הים הגדול (התיכון)',
    description: 'הים הגדול, המוזכר בתורה כגבול מערב לארץ',
    brachaText: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁעָשָׂה אֶת הַיָּם הַגָּדוֹל.',
    brachaShortName: 'ברכת הים הגדול',
    intervalDays: 30,
    // Bracha requires actually SEEING the sea. Trigger only at the coast itself
    // (within ~1.5 km). People 5+ km inland (e.g. Nitzan) do not see the sea.
    triggerKm: 0.5,
    areas: [
      { kind: 'segment', from: [33.090, 35.103], to: [32.825, 35.060], corridorKm: 1 },
      { kind: 'segment', from: [32.825, 35.060], to: [32.490, 34.910], corridorKm: 1 },
      { kind: 'segment', from: [32.490, 34.910], to: [32.085, 34.768], corridorKm: 1 },
      { kind: 'segment', from: [32.085, 34.768], to: [31.800, 34.640], corridorKm: 1 },
      { kind: 'segment', from: [31.800, 34.640], to: [31.520, 34.530], corridorKm: 1 },
      { kind: 'segment', from: [31.520, 34.530], to: [31.250, 34.300], corridorKm: 1 },
    ],
  },
  {
    id: 'kinneret',
    hebrewName: 'ים כנרת',
    description: 'אגם הכינרת בצפון ארץ ישראל',
    brachaText: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.',
    brachaShortName: 'ברכת הכינרת',
    intervalDays: 30,
    // Circle covers the lake (~7km radius around center). Trigger only when
    // user is essentially at the shore.
    triggerKm: 0.5,
    areas: [{ kind: 'circle', lat: 32.815, lng: 35.585, radiusKm: 7 }],
  },
  {
    id: 'deadsea',
    hebrewName: 'ים המלח',
    description: 'הים המלוח ביותר בעולם',
    brachaText: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.',
    brachaShortName: 'ברכת ים המלח',
    intervalDays: 30,
    triggerKm: 0.5,
    areas: [
      { kind: 'segment', from: [31.770, 35.480], to: [31.470, 35.460], corridorKm: 2 },
      { kind: 'segment', from: [31.470, 35.460], to: [31.150, 35.380], corridorKm: 2 },
      { kind: 'segment', from: [31.150, 35.380], to: [30.910, 35.380], corridorKm: 2 },
    ],
  },
  {
    id: 'redsea',
    hebrewName: 'ים סוף (אילת)',
    description: 'מפרץ אילת - ים סוף',
    brachaText: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.',
    brachaShortName: 'ברכת ים סוף',
    intervalDays: 30,
    triggerKm: 0.5,
    areas: [{ kind: 'circle', lat: 29.546, lng: 34.952, radiusKm: 4 }],
  },
];

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pointToSegmentKm(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const meanLat = toRad((ax + bx + px) / 3);
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos(meanLat);
  const PX = (px - ax) * kmPerDegLat;
  const PY = (py - ay) * kmPerDegLng;
  const BX = (bx - ax) * kmPerDegLat;
  const BY = (by - ay) * kmPerDegLng;
  const segLenSq = BX * BX + BY * BY;
  let t = segLenSq > 0 ? (PX * BX + PY * BY) / segLenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const closeX = BX * t;
  const closeY = BY * t;
  const dx = PX - closeX;
  const dy = PY - closeY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceToAreaKm(lat: number, lng: number, area: GeoArea): number {
  if (area.kind === 'circle') {
    const d = haversineKm(lat, lng, area.lat, area.lng);
    return Math.max(0, d - area.radiusKm);
  }
  const d = pointToSegmentKm(lat, lng, area.from[0], area.from[1], area.to[0], area.to[1]);
  return Math.max(0, d - area.corridorKm);
}

export function nearestSite(
  lat: number,
  lng: number,
): { site: WaterSite; distanceKm: number } | null {
  let best: { site: WaterSite; distanceKm: number } | null = null;
  for (const site of WATER_SITES) {
    let minD = Infinity;
    for (const area of site.areas) {
      const d = distanceToAreaKm(lat, lng, area);
      if (d < minD) minD = d;
    }
    if (!best || minD < best.distanceKm) best = { site, distanceKm: minD };
  }
  return best;
}

export function daysSince(timestampMs: number | null): number | null {
  if (!timestampMs) return null;
  return Math.floor((Date.now() - timestampMs) / 86_400_000);
}

export function shouldRemindFor(site: WaterSite, lastSaidAt: number | null, distanceKm: number): boolean {
  if (distanceKm > site.triggerKm) return false;
  const days = daysSince(lastSaidAt);
  if (days === null) return true;
  return days >= site.intervalDays;
}
