import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { presentNow } from '../services/notifications';

const PARSAH_KM = 4;
const TRIGGER_KM = 3 * PARSAH_KM;

export type TravelState =
  | { state: 'idle' }
  | { state: 'permission-denied' }
  | { state: 'stationary'; lat: number; lng: number }
  | { state: 'traveling'; distanceKm: number; startedAt: number; shouldSay: boolean };

export function useTravelDetection(enabled = true) {
  const [travelState, setTravelState] = useState<TravelState>({ state: 'idle' });
  const startPosRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastSaidAtRef = useRef<number>(0);
  const notifiedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      setTravelState({ state: 'idle' });
      return;
    }
    let mounted = true;

    async function start() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) setTravelState({ state: 'permission-denied' });
          return;
        }
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 500,
            timeInterval: 30_000,
          },
          (loc) => {
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;
            if (!startPosRef.current) {
              startPosRef.current = { lat, lng, at: Date.now() };
              setTravelState({ state: 'stationary', lat, lng });
              return;
            }
            const d = haversineKm(startPosRef.current.lat, startPosRef.current.lng, lat, lng);
            if (d >= TRIGGER_KM) {
              const shouldSay = Date.now() - lastSaidAtRef.current > 4 * 3600_000;
              setTravelState({
                state: 'traveling',
                distanceKm: d,
                startedAt: startPosRef.current.at,
                shouldSay,
              });
              // Fire a local notification on the first crossing
              if (shouldSay && !notifiedRef.current) {
                notifiedRef.current = true;
                presentNow({
                  title: '🚗 תפילת הדרך',
                  body: `התרחקת ${d.toFixed(0)} ק"מ - הגיע הזמן לומר תפילת הדרך`,
                }).catch(() => {});
              }
            } else {
              setTravelState({ state: 'stationary', lat, lng });
              notifiedRef.current = false; // reset for next trip
            }
          },
        );
      } catch {
        if (mounted) setTravelState({ state: 'idle' });
      }
    }
    start();
    return () => {
      mounted = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [enabled]);

  function markSaid() {
    lastSaidAtRef.current = Date.now();
    startPosRef.current = null;
    setTravelState({ state: 'idle' });
  }

  return { travelState, markSaid };
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
