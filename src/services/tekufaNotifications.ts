/**
 * Tekufa notifications — schedule a reminder X hours before each of the
 * 4 seasonal turning points (Nisan / Tammuz / Tishrei / Tevet).
 *
 * The hours-before setting is stored per user. Default: 24 hours.
 * Scheduled at app boot + whenever the setting changes.
 */
import { Platform } from 'react-native';
import { HDate, months } from '@hebcal/core';

const SETTING_KEY = '@chavruta/tekufa-hours-before';
const NOTIF_TAG = 'tekufa';

/** Approximate Tekufa dates per Shmuel calculation. Returns Dates for the
    next 4 tekufas after the given start date. */
function nextTekufas(from: Date): { name: string; when: Date }[] {
  // Tekufa Shmuel: each tekufa is exactly 91 days 7.5 hours after the previous.
  // Reference: Tekufat Tishrei 5784 = Oct 7, 2023 23:00 (approximate)
  const REF = new Date(2023, 9, 7, 23, 0, 0); // Tekufat Tishrei 5784
  const NAMES = ['תשרי', 'טבת', 'ניסן', 'תמוז'];
  const PERIOD_MS = (91 * 24 + 7.5) * 60 * 60 * 1000;
  const result: { name: string; when: Date }[] = [];
  // Find the next one after `from`
  let idx = 0;
  let t = REF.getTime();
  while (t < from.getTime()) {
    t += PERIOD_MS;
    idx = (idx + 1) % 4;
  }
  for (let i = 0; i < 4; i++) {
    result.push({ name: NAMES[(idx + i) % 4], when: new Date(t) });
    t += PERIOD_MS;
  }
  return result;
}

export async function getTekufaHoursBefore(): Promise<number> {
  try {
    const AS: any = (await import('@react-native-async-storage/async-storage')).default;
    const v = await AS.getItem(SETTING_KEY);
    return v ? parseInt(v, 10) : 24;
  } catch {
    return 24;
  }
}

export async function setTekufaHoursBefore(hours: number): Promise<void> {
  try {
    const AS: any = (await import('@react-native-async-storage/async-storage')).default;
    await AS.setItem(SETTING_KEY, String(hours));
  } catch {}
  await scheduleTekufaNotifications();
}

export async function scheduleTekufaNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications: any = await import('expo-notifications');
    // Cancel previously scheduled tekufa notifications
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (n.content?.data?.tag === NOTIF_TAG) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
    const hoursBefore = await getTekufaHoursBefore();
    const tekufas = nextTekufas(new Date());
    for (const t of tekufas) {
      const fireAt = new Date(t.when.getTime() - hoursBefore * 60 * 60 * 1000);
      if (fireAt.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `תקופת ${t.name}`,
          body: `מתחילה בעוד ${hoursBefore} שעות. זמן להיזהר מ"מים מגולים".`,
          data: { tag: NOTIF_TAG },
        },
        trigger: { type: 'date', date: fireAt },
      });
    }
  } catch (e) {
    console.warn('[tekufa] schedule failed', e);
  }
}
