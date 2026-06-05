import AsyncStorage from '@react-native-async-storage/async-storage';

export const Keys = {
  location: '@yahadut/location',
  nusach: '@yahadut/nusach',
  dailyLearning: '@yahadut/daily-learning',
  learnedHistory: '@yahadut/learned-history',
  tehillimGroups: '@yahadut/tehillim-groups',
  tehillimProgress: '@yahadut/tehillim-progress',
  maaserKesafim: '@yahadut/maaser-kesafim',
  brachotCounter: '@yahadut/brachot-counter',
  yahrtzeits: '@yahadut/yahrtzeits',
  reminders: '@yahadut/reminders',
  meatMilkTimer: '@yahadut/meatmilk-timer',
  cholimList: '@yahadut/cholim',
  settings: '@yahadut/settings',
  shortcutFavorites: '@yahadut/shortcut-favorites',
  shortcutRecents: '@yahadut/shortcut-recents',
  shortcutDismissedDefaults: '@yahadut/shortcut-dismissed-defaults',
  calendarReminders: '@yahadut/calendar-reminders',
  calendarSyncId: '@yahadut/calendar-sync-id',
  chazakaTefillot: '@yahadut/chazaka-tefillot',
  siddurPrefs: '@yahadut/siddur-prefs',
} as const;

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getString(key: string, fallback = ''): Promise<string> {
  const v = await AsyncStorage.getItem(key);
  return v ?? fallback;
}

export async function setString(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
