import { Platform } from 'react-native';
import { getString, setString, Keys } from '../storage/storage';
import { CalendarReminder, isoToDate, loadReminders, updateReminder } from '../data/reminders';

/**
 * Device-calendar sync via expo-calendar.
 * - On iOS/Android: writes reminders into the device calendar. If the user has
 *   Google Calendar synced to the device, these also appear in Google Calendar.
 * - On web: not supported (no system calendar to write to).
 *
 * The expo-calendar import is lazy/dynamic so the web build doesn't break.
 */

export function isSyncSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function loadModule(): Promise<any | null> {
  if (!isSyncSupported()) return null;
  try {
    // dynamic require avoids bundling expo-calendar into the web build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-calendar');
  } catch {
    return null;
  }
}

export async function requestCalendarPermission(): Promise<boolean> {
  const Calendar = await loadModule();
  if (!Calendar) return false;
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/** Returns the CURRENT permission state without prompting the user. Used by
 *  UI flows that need to decide whether to show an explainer modal first. */
export async function hasCalendarPermission(): Promise<boolean> {
  const Calendar = await loadModule();
  if (!Calendar) return false;
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Returns the chosen target calendar id, prompting the user if first time. */
export async function getTargetCalendarId(): Promise<string | null> {
  const Calendar = await loadModule();
  if (!Calendar) return null;
  const saved = await getString(Keys.calendarSyncId, '');
  if (saved) return saved;
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  if (!cals || cals.length === 0) return null;
  // Prefer Google/primary calendar with write access
  const writable = cals.filter((c: any) => c.allowsModifications);
  const google = writable.find((c: any) => /google|gmail/i.test(c.source?.name || c.source?.type || ''));
  const primary = writable.find((c: any) => c.isPrimary);
  const chosen = google || primary || writable[0] || cals[0];
  if (chosen?.id) {
    await setString(Keys.calendarSyncId, chosen.id);
    return chosen.id;
  }
  return null;
}

export async function listCalendars(): Promise<Array<{ id: string; title: string; sourceName: string; isPrimary: boolean }>> {
  const Calendar = await loadModule();
  if (!Calendar) return [];
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return cals
    .filter((c: any) => c.allowsModifications)
    .map((c: any) => ({
      id: c.id,
      title: c.title || '(ללא שם)',
      sourceName: c.source?.name || c.source?.type || '',
      isPrimary: !!c.isPrimary,
    }));
}

export async function setTargetCalendarId(id: string): Promise<void> {
  await setString(Keys.calendarSyncId, id);
}

/** Push one reminder. Returns native event id. */
export async function pushReminder(rem: CalendarReminder): Promise<string | null> {
  const Calendar = await loadModule();
  if (!Calendar) return null;
  const ok = await requestCalendarPermission();
  if (!ok) return null;
  const calId = await getTargetCalendarId();
  if (!calId) return null;
  const base = isoToDate(rem.dateISO);
  let start: Date;
  let end: Date;
  if (rem.time) {
    const [h, m] = rem.time.split(':').map(Number);
    start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0);
    end = new Date(start.getTime() + 60 * 60 * 1000);
  } else {
    start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0);
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  if (rem.syncedEventId) {
    try {
      await Calendar.updateEventAsync(rem.syncedEventId, {
        title: rem.title,
        notes: rem.notes,
        startDate: start,
        endDate: end,
        allDay: !rem.time,
      });
      return rem.syncedEventId;
    } catch {
      // fall through to create
    }
  }
  const id: string = await Calendar.createEventAsync(calId, {
    title: rem.title,
    notes: rem.notes,
    startDate: start,
    endDate: end,
    allDay: !rem.time,
    timeZone: undefined,
  });
  return id;
}

/** Push all unsynced reminders + return how many were synced. */
export async function syncAll(): Promise<{ synced: number; total: number; error?: string }> {
  if (!isSyncSupported()) {
    return { synced: 0, total: 0, error: 'סנכרון יומן זמין רק במכשיר נייד' };
  }
  const ok = await requestCalendarPermission();
  if (!ok) return { synced: 0, total: 0, error: 'אין הרשאה ליומן המכשיר' };
  const calId = await getTargetCalendarId();
  if (!calId) return { synced: 0, total: 0, error: 'לא נמצא יומן יעד' };
  const list = await loadReminders();
  let synced = 0;
  for (const r of list) {
    try {
      const eventId = await pushReminder(r);
      if (eventId && eventId !== r.syncedEventId) {
        await updateReminder(r.id, { syncedEventId: eventId });
      }
      if (eventId) synced++;
    } catch {
      // skip
    }
  }
  return { synced, total: list.length };
}

export async function deleteRemoteEvent(eventId: string): Promise<boolean> {
  const Calendar = await loadModule();
  if (!Calendar) return false;
  try {
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch {
    return false;
  }
}
