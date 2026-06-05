export type Place = {
  id: string;
  type: 'synagogue' | 'mikveh' | 'eruv';
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  tags: Record<string, string>;
};

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export async function findNearbyPlaces(
  lat: number,
  lng: number,
  radiusKm = 3,
): Promise<Place[]> {
  const radiusM = Math.round(radiusKm * 1000);
  // Comprehensive query for synagogues + mikvaot
  // Mikveh tagging in OSM varies: ritual_bath, amenity=mikveh, leisure=mikveh,
  // building=mikveh, or place_of_worship with name containing "מקווה"
  const query = `
[out:json][timeout:30];
(
  // בתי כנסת
  node["amenity"="place_of_worship"]["religion"="jewish"](around:${radiusM},${lat},${lng});
  way["amenity"="place_of_worship"]["religion"="jewish"](around:${radiusM},${lat},${lng});
  node["building"="synagogue"](around:${radiusM},${lat},${lng});
  way["building"="synagogue"](around:${radiusM},${lat},${lng});

  // מקוואות - תיוגים שונים
  node["amenity"="mikveh"](around:${radiusM},${lat},${lng});
  way["amenity"="mikveh"](around:${radiusM},${lat},${lng});
  node["amenity"="ritual_bath"](around:${radiusM},${lat},${lng});
  way["amenity"="ritual_bath"](around:${radiusM},${lat},${lng});
  node["leisure"="mikveh"](around:${radiusM},${lat},${lng});
  way["leisure"="mikveh"](around:${radiusM},${lat},${lng});
  node["building"="mikveh"](around:${radiusM},${lat},${lng});
  way["building"="mikveh"](around:${radiusM},${lat},${lng});
  node["name"~"מקווה|מקוה|Mikve|Mikvah|Mikveh",i](around:${radiusM},${lat},${lng});
  way["name"~"מקווה|מקוה|Mikve|Mikvah|Mikveh",i](around:${radiusM},${lat},${lng});
);
out center tags;
  `.trim();

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    });
    if (!res.ok) return [];
    const json: any = await res.json();
    const elements: any[] = json.elements ?? [];
    return elements
      .map((el): Place | null => {
        const t = el.tags ?? {};
        const elementLat = el.lat ?? el.center?.lat;
        const elementLng = el.lon ?? el.center?.lon;
        if (!elementLat || !elementLng) return null;
        let type: Place['type'] = 'synagogue';
        const name =
          t['name:he'] ||
          t['name:iw'] ||
          t.name ||
          '';
        if (
          t.amenity === 'mikveh' ||
          t.amenity === 'ritual_bath' ||
          t.leisure === 'mikveh' ||
          t.building === 'mikveh' ||
          /מקווה|מקוה|mikve|mikvah|mikveh/i.test(name)
        ) {
          type = 'mikveh';
        } else if (t.boundary === 'eruv') {
          type = 'eruv';
        }
        const displayName = name || (type === 'mikveh' ? 'מקווה' : 'בית כנסת');
        return {
          id: String(el.id),
          type,
          name: displayName,
          latitude: elementLat,
          longitude: elementLng,
          distanceKm: haversineKm(lat, lng, elementLat, elementLng),
          tags: t,
        };
      })
      .filter((p): p is Place => p !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  } catch {
    return [];
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
