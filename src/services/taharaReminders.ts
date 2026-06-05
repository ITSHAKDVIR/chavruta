import { calculate } from '../data/tahara';
import { ensurePermissions, scheduleAt, cancelById } from './notifications';
import { getJSON, setJSON, Keys } from '../storage/storage';
import { computeZmanim, DEFAULT_LOCATIONS, StoredLocation } from '../data/hebcal';

async function loadCurrentLocation(): Promise<StoredLocation> {
  return (await getJSON<StoredLocation | null>(Keys.location, null)) ?? DEFAULT_LOCATIONS[0];
}

const KEY_SCHEDULED = '@yahadut/tahara-scheduled-ids';
const KEY_PREFS = '@yahadut/tahara-pref';

export type TaharaReminderPrefs = {
  /** Master switch for all reminders */
  enabled: boolean;
  /** Send morning bedika reminder (10 min before time) */
  morningEnabled: boolean;
  /** Send evening bedika reminder (10 min before sunset) */
  eveningEnabled: boolean;
  morningHour: number;
  morningMinute: number;
  /** If true, use location-based sunset for evening time instead of fixed hour/minute */
  eveningUsesSunset: boolean;
  eveningHour: number;
  eveningMinute: number;
  /** Notify N minutes before the scheduled time */
  leadMinutes: number;
};

const DEFAULT_PREFS: TaharaReminderPrefs = {
  enabled: true,
  morningEnabled: true,
  eveningEnabled: true,
  morningHour: 8,
  morningMinute: 0,
  eveningUsesSunset: true,
  eveningHour: 18,
  eveningMinute: 30,
  leadMinutes: 10,
};

export async function loadTaharaPrefs(): Promise<TaharaReminderPrefs> {
  const v = await getJSON<Partial<TaharaReminderPrefs>>(KEY_PREFS, {});
  return { ...DEFAULT_PREFS, ...v };
}

export async function saveTaharaPrefs(p: TaharaReminderPrefs): Promise<void> {
  await setJSON(KEY_PREFS, p);
}

export type TaharaSchedule = {
  hefsekTahara: Date;
  bedikot: { day: number; morning: Date; evening: Date }[];
  mikvehNight: Date;
};

/** Returns sunset time for the given day at the given location, or null if it can't be computed. */
function sunsetFor(date: Date, location: StoredLocation): Date | null {
  try {
    const z = computeZmanim(date, location);
    return z.sunset;
  } catch {
    return null;
  }
}

export function buildSchedule(
  currentStart: Date,
  prefs: TaharaReminderPrefs,
  location?: StoredLocation
): TaharaSchedule {
  const calc = calculate(currentStart);
  const loc = location ?? DEFAULT_LOCATIONS[0];

  function eveningTimeFor(day: Date): Date {
    if (prefs.eveningUsesSunset) {
      const sunset = sunsetFor(day, loc);
      if (sunset) {
        // 5 minutes before sunset is the safe latest time
        return new Date(sunset.getTime() - 5 * 60 * 1000);
      }
    }
    const d = new Date(day);
    d.setHours(prefs.eveningHour, prefs.eveningMinute, 0, 0);
    return d;
  }

  // הפסק טהרה - יום 5 לפני שקיעה (לפי מנהג ספרדים)
  const hefsekDate = eveningTimeFor(calc.hefsekTaharaSephardi);

  const bedikot: { day: number; morning: Date; evening: Date }[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(calc.hefsekTaharaSephardi.getTime() + (i + 1) * 86_400_000);
    const morning = new Date(dayDate);
    morning.setHours(prefs.morningHour, prefs.morningMinute, 0, 0);
    const evening = eveningTimeFor(dayDate);
    bedikot.push({ day: i + 1, morning, evening });
  }

  const mikvehNight = new Date(calc.mikvehNight);
  mikvehNight.setHours(20, 0, 0, 0);

  return { hefsekTahara: hefsekDate, bedikot, mikvehNight };
}

async function cancelAll(): Promise<void> {
  const ids = await getJSON<string[]>(KEY_SCHEDULED, []);
  for (const id of ids) {
    try { await cancelById(id); } catch {}
  }
  await setJSON(KEY_SCHEDULED, []);
}

function withLead(date: Date, leadMinutes: number): Date {
  return new Date(date.getTime() - leadMinutes * 60 * 1000);
}

export async function scheduleAllReminders(currentStart: Date): Promise<{ scheduled: number; failed: boolean }> {
  const ok = await ensurePermissions();
  if (!ok) return { scheduled: 0, failed: true };

  await cancelAll();
  const prefs = await loadTaharaPrefs();
  if (!prefs.enabled) return { scheduled: 0, failed: false };

  const location = await loadCurrentLocation();
  const schedule = buildSchedule(currentStart, prefs, location);
  const lead = Math.max(0, prefs.leadMinutes ?? 10);
  const ids: string[] = [];

  // Hefsek tahara — only if evening reminders are on
  if (prefs.eveningEnabled) {
    const hefsekId = await scheduleAt(withLead(schedule.hefsekTahara, lead), {
      title: '🕊️ הפסק טהרה - תוך כ-10 דקות',
      body: 'בדיקת הפסק טהרה בסוף יום 5, לפני שקיעה',
      channelId: 'default',
    });
    if (hefsekId) ids.push(hefsekId);
  }

  for (const b of schedule.bedikot) {
    if (prefs.morningEnabled) {
      const morningId = await scheduleAt(withLead(b.morning, lead), {
        title: `🕊️ בדיקת בוקר - יום ${b.day} מ-7 נקיים`,
        body: `${lead} דקות לפני זמן הבדיקה הקבוע`,
        channelId: 'default',
      });
      if (morningId) ids.push(morningId);
    }
    if (prefs.eveningEnabled) {
      const eveningId = await scheduleAt(withLead(b.evening, lead), {
        title: `🕊️ בדיקת ערב - יום ${b.day} מ-7 נקיים`,
        body: `${lead} דקות לפני ${prefs.eveningUsesSunset ? 'השקיעה' : 'זמן הבדיקה'}`,
        channelId: 'default',
      });
      if (eveningId) ids.push(eveningId);
    }
  }

  const mikvehId = await scheduleAt(schedule.mikvehNight, {
    title: '🌊 ליל טבילה',
    body: 'הלילה - טבילה במקווה',
    channelId: 'default',
  });
  if (mikvehId) ids.push(mikvehId);

  await setJSON(KEY_SCHEDULED, ids);
  return { scheduled: ids.length, failed: false };
}

export async function cancelTaharaReminders(): Promise<void> {
  await cancelAll();
}
