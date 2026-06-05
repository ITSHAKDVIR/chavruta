import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { Alert } from 'react-native';
import { DEFAULT_LOCATIONS, StoredLocation } from '../data/hebcal';
import { getJSON, Keys, setJSON } from '../storage/storage';

const DEFAULT: StoredLocation = DEFAULT_LOCATIONS[0];

/**
 * Module-level location store. Implemented as a tiny external store that React
 * components can subscribe to via useSyncExternalStore — the official React 18+
 * API for sharing mutable state across components, guaranteed to re-render all
 * subscribers when the value changes.
 */
let _location: StoredLocation = DEFAULT;
let _loaded = false;
let _loading: Promise<void> | null = null;
const _listeners = new Set<() => void>();

function _subscribe(callback: () => void): () => void {
  _listeners.add(callback);
  return () => {
    _listeners.delete(callback);
  };
}

function _getSnapshot(): StoredLocation {
  return _location;
}

function _emitChange() {
  for (const listener of _listeners) {
    try {
      listener();
    } catch (e) {
      console.warn('[useLocation] listener error:', e);
    }
  }
}

async function _ensureLoaded(): Promise<void> {
  if (_loaded) return;
  if (_loading) return _loading;
  _loading = (async () => {
    try {
      const saved = await getJSON<StoredLocation | null>(Keys.location, null);
      if (saved && saved.name) {
        _location = saved;
        _emitChange();
      }
    } catch (e) {
      console.warn('[useLocation] failed to load saved location:', e);
    } finally {
      _loaded = true;
      _loading = null;
    }
  })();
  return _loading;
}

async function _save(loc: StoredLocation): Promise<void> {
  _location = loc;
  _emitChange();
  // Persist after notification so UI updates immediately, storage catches up.
  try {
    await setJSON(Keys.location, loc);
  } catch (e) {
    console.warn('[useLocation] failed to persist location:', e);
  }
}

export function useLocation() {
  // The official React way to subscribe to an external mutable store.
  // All component instances are notified synchronously when _location changes.
  const location = useSyncExternalStore(_subscribe, _getSnapshot, _getSnapshot);

  const [loaded, setLoaded] = useState(_loaded);

  // Kick off the initial load from AsyncStorage. Safe to call repeatedly.
  useEffect(() => {
    let mounted = true;
    _ensureLoaded().then(() => {
      if (mounted) setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setLocation = useCallback(async (loc: StoredLocation) => {
    await _save(loc);
  }, []);

  return { location, setLocation, loaded };
}

/**
 * Detect current GPS location and find the closest preset city.
 * Falls back to using raw coords if no preset is within 30km.
 */
export async function detectCurrentLocation(): Promise<StoredLocation | null> {
  try {
    const Location: any = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאת מיקום נדחתה', 'אנא אפשר גישה למיקום בהגדרות.');
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;

    let bestDist = Infinity;
    let bestPreset: StoredLocation | null = null;
    for (const preset of DEFAULT_LOCATIONS) {
      const dist = haversineKm(latitude, longitude, preset.latitude, preset.longitude);
      if (dist < bestDist) {
        bestDist = dist;
        bestPreset = preset;
      }
    }

    if (bestPreset && bestDist < 30) {
      return bestPreset;
    }

    let name = 'המיקום הנוכחי';
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = places[0];
      if (place) {
        name = place.city || place.subregion || place.region || name;
      }
    } catch {}

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem';
    return {
      name,
      latitude,
      longitude,
      timezone: tz,
      countryCode: bestPreset?.countryCode || 'IL',
    };
  } catch (e: any) {
    Alert.alert('שגיאה במציאת מיקום', String(e?.message ?? e));
    return null;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
