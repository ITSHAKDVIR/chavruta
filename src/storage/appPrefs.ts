/**
 * App-wide display preferences: font-size scale for the siddur, and light/dark
 * theme. Persisted to AsyncStorage under a dedicated key so they load once at
 * app start (before the reader mounts).
 */
import { useEffect, useState, useCallback } from 'react';
import { getJSON, setJSON } from './storage';

export type ThemeMode = 'dark' | 'light';

export type AppPrefs = {
  /** Multiplier for prayer-text size in the siddur (sacred + sacredSmall). */
  fontScale: number;
  /** UI theme. Defaults to the app's original dark navy/gold palette. */
  theme: ThemeMode;
};

export const FONT_SCALE_STEPS = [0.85, 1.0, 1.15, 1.35] as const;
export const FONT_SCALE_LABELS: Record<number, string> = {
  0.85: 'קטן',
  1.0: 'רגיל',
  1.15: 'גדול',
  1.35: 'גדול מאוד',
};

export const DEFAULT_APP_PREFS: AppPrefs = {
  fontScale: 1.0,
  theme: 'dark',
};

const KEY = '@yahadut/app-prefs';

export async function loadAppPrefs(): Promise<AppPrefs> {
  const stored = await getJSON<Partial<AppPrefs>>(KEY, {});
  return { ...DEFAULT_APP_PREFS, ...stored };
}

export async function saveAppPrefs(prefs: AppPrefs): Promise<void> {
  await setJSON(KEY, prefs);
}

/** Hook — reads prefs on mount, provides an updater. */
export function useAppPrefs(): [AppPrefs, (patch: Partial<AppPrefs>) => Promise<void>, boolean] {
  const [prefs, setPrefs] = useState<AppPrefs>(DEFAULT_APP_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await loadAppPrefs();
      if (alive) {
        setPrefs(p);
        setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<AppPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveAppPrefs(next).catch(() => {});
      return next;
    });
  }, []);

  return [prefs, update, loaded];
}
