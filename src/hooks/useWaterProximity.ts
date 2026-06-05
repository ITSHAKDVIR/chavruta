import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { nearestSite, shouldRemindFor, WaterSite } from '../data/brachot';
import { loadBrachaHistory, loadBrachaPrefs } from '../storage/brachot';

export type ProximityStatus =
  | { state: 'idle' }
  | { state: 'permission-denied' }
  | { state: 'permission-pending' }
  | { state: 'tracking'; lastFixAt: number; site: WaterSite; distanceKm: number; shouldRemind: boolean; lastSaidAt: number | null }
  | { state: 'error'; message: string };

export function useWaterProximity(enabled = true) {
  const [status, setStatus] = useState<ProximityStatus>({ state: 'idle' });
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    async function evaluate(coords: { latitude: number; longitude: number }) {
      const near = nearestSite(coords.latitude, coords.longitude);
      if (!near) return;
      const prefs = await loadBrachaPrefs();
      const history = await loadBrachaHistory();
      const lastSaidAt = history[near.site.id] ?? null;
      const shouldRemind =
        prefs.geofencingEnabled &&
        (!prefs.silenceUntil || prefs.silenceUntil < Date.now()) &&
        shouldRemindFor(near.site, lastSaidAt, near.distanceKm);
      if (!mounted) return;
      setStatus({
        state: 'tracking',
        lastFixAt: Date.now(),
        site: near.site,
        distanceKm: near.distanceKm,
        shouldRemind,
        lastSaidAt,
      });
    }

    async function start() {
      if (!enabled) {
        setStatus({ state: 'idle' });
        return;
      }
      setStatus({ state: 'permission-pending' });
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== 'granted') {
          if (mounted) setStatus({ state: 'permission-denied' });
          return;
        }
        const last = await Location.getLastKnownPositionAsync();
        if (last) await evaluate(last.coords);
        else {
          const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          await evaluate(cur.coords);
        }
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 250,
            timeInterval: 60_000,
          },
          (loc) => evaluate(loc.coords),
        );
      } catch (e: any) {
        if (mounted) setStatus({ state: 'error', message: String(e?.message ?? e) });
      }
    }

    start();
    return () => {
      mounted = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [enabled]);

  return status;
}
