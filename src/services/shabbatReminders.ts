import { HDate, HebrewCalendar } from '@hebcal/core';
import { computeZmanim, StoredLocation, toLocation } from '../data/hebcal';
import { ensurePermissions, scheduleAt, cancelById } from './notifications';
import { getJSON, setJSON } from '../storage/storage';

const KEY_SCHEDULED = '@yahadut/shabbat-scheduled-ids';
const KEY_PREFS = '@yahadut/shabbat-reminder-prefs';

export type ShabbatReminderPrefs = {
  enabled: boolean;
  minutesBefore: number;
  candleLightingMinutes: number;
};

export const DEFAULT_PREFS: ShabbatReminderPrefs = {
  enabled: false,
  minutesBefore: 30,
  candleLightingMinutes: 18,
};

export async function loadShabbatPrefs(): Promise<ShabbatReminderPrefs> {
  const v = await getJSON<Partial<ShabbatReminderPrefs>>(KEY_PREFS, {});
  return { ...DEFAULT_PREFS, ...v };
}

export async function saveShabbatPrefs(p: ShabbatReminderPrefs): Promise<void> {
  await setJSON(KEY_PREFS, p);
}

export async function rescheduleShabbatReminders(location: StoredLocation): Promise<number> {
  const prefs = await loadShabbatPrefs();
  if (!prefs.enabled) {
    await cancelAllShabbatReminders();
    return 0;
  }
  const ok = await ensurePermissions();
  if (!ok) return 0;

  await cancelAllShabbatReminders();

  const now = new Date();
  const ids: string[] = [];
  let count = 0;
  for (let i = 0; i < 4; i++) {
    const friday = nextFriday(new Date(now.getTime() + i * 7 * 86_400_000));
    if (!friday) continue;
    const zmanim = computeZmanim(friday, location);
    if (!zmanim.sunset) continue;
    const candleTime = new Date(zmanim.sunset.getTime() - prefs.candleLightingMinutes * 60_000);
    const reminderTime = new Date(candleTime.getTime() - prefs.minutesBefore * 60_000);
    if (reminderTime.getTime() <= Date.now()) continue;

    const formatted = candleTime.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: location.timezone,
    });
    const id = await scheduleAt(reminderTime, {
      title: 'תזכורת: כניסת שבת',
      body: `הדלקת נרות בעוד ${prefs.minutesBefore} דקות (בשעה ${formatted})`,
      channelId: 'default',
    });
    if (id) {
      ids.push(id);
      count++;
    }
  }
  await setJSON(KEY_SCHEDULED, ids);
  return count;
}

async function cancelAllShabbatReminders(): Promise<void> {
  const ids = await getJSON<string[]>(KEY_SCHEDULED, []);
  for (const id of ids) {
    try {
      await cancelById(id);
    } catch {}
  }
  await setJSON(KEY_SCHEDULED, []);
}

function nextFriday(from: Date): Date | null {
  const d = new Date(from);
  const day = d.getDay();
  const delta = day === 5 ? 0 : (5 - day + 7) % 7;
  d.setDate(d.getDate() + delta);
  d.setHours(12, 0, 0, 0);
  return d;
}
