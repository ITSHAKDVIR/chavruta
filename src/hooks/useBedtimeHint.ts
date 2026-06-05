import { useEffect, useState } from 'react';
import { Platform, AppState } from 'react-native';
import { loadNotifSettings } from '../services/notifSettings';
import { getJSON, setJSON } from '../storage/storage';

/**
 * Detects when it's "bedtime" (late hour + phone is charging).
 * Returns true if the user should be nudged to say Kriat Shema al haMita today.
 *
 * Native: uses expo-battery's `getPowerStateAsync` + subscription.
 * Web: uses navigator.getBattery() (deprecated but still works in Chromium).
 */
export function useBedtimeHint(): { shouldShow: boolean; dismiss: () => void } {
  const [shouldShow, setShouldShow] = useState(false);

  async function check() {
    const settings = await loadNotifSettings();
    if (!settings.shemaSmartCharger) {
      setShouldShow(false);
      return;
    }
    const now = new Date();
    const hour = now.getHours();
    // Active window: 21:00 - 03:00
    const inWindow = hour >= 21 || hour < 3;
    if (!inWindow) {
      setShouldShow(false);
      return;
    }
    // Already dismissed today?
    const todayKey = now.toISOString().slice(0, 10);
    const dismissedToday = await getJSON<string | null>('@yahadut/bedtime-dismissed', null);
    if (dismissedToday === todayKey) {
      setShouldShow(false);
      return;
    }
    // Charging?
    const charging = await isCharging();
    setShouldShow(charging);
  }

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    const id = setInterval(check, 5 * 60_000); // re-check every 5 minutes

    // Subscribe to battery state changes so plugging in triggers immediately.
    let batterySub: { remove: () => void } | null = null;
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const Battery: any = await import('expo-battery');
          if (Battery?.addBatteryStateListener) {
            batterySub = Battery.addBatteryStateListener(() => check());
          }
        } catch {}
      })();
    }
    return () => {
      sub.remove();
      clearInterval(id);
      batterySub?.remove();
    };
  }, []);

  async function dismiss() {
    const todayKey = new Date().toISOString().slice(0, 10);
    await setJSON('@yahadut/bedtime-dismissed', todayKey);
    setShouldShow(false);
  }

  return { shouldShow, dismiss };
}

async function isCharging(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      const nav: any = typeof navigator !== 'undefined' ? navigator : null;
      if (!nav || typeof nav.getBattery !== 'function') return false;
      const battery = await nav.getBattery();
      return !!battery.charging;
    } catch {
      return false;
    }
  }
  // Native: expo-battery
  try {
    const Battery: any = await import('expo-battery');
    const state = await Battery.getBatteryStateAsync();
    // Battery.BatteryState enum: UNKNOWN=0, UNPLUGGED=1, CHARGING=2, FULL=3
    return state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
  } catch (e) {
    console.warn('[bedtimeHint] expo-battery failed:', e);
    return false;
  }
}
