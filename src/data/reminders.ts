import { Platform } from 'react-native';
import { getJSON, setJSON, Keys } from '../storage/storage';

/** A user-added reminder/event on a specific Gregorian date. */
export type CalendarReminder = {
  id: string;
  /** ISO date string: YYYY-MM-DD (Gregorian). */
  dateISO: string;
  /** Optional time in HH:MM. If omitted treated as all-day. */
  time?: string;
  title: string;
  notes?: string;
  /** If synced to device calendar, the native event id. */
  syncedEventId?: string;
  /** Repeat yearly by Hebrew date? (e.g. yahrtzeit) Default false (gregorian). */
  yearlyHebrew?: boolean;
};

export function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export async function loadReminders(): Promise<CalendarReminder[]> {
  return getJSON<CalendarReminder[]>(Keys.calendarReminders, []);
}

export async function saveReminders(list: CalendarReminder[]): Promise<void> {
  await setJSON(Keys.calendarReminders, list);
}

export async function addReminder(r: Omit<CalendarReminder, 'id'>): Promise<CalendarReminder> {
  const list = await loadReminders();
  const newR: CalendarReminder = { ...r, id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  const next = [...list, newR];
  await saveReminders(next);
  return newR;
}

export async function updateReminder(id: string, patch: Partial<CalendarReminder>): Promise<void> {
  const list = await loadReminders();
  const next = list.map((r) => (r.id === id ? { ...r, ...patch } : r));
  await saveReminders(next);
}

export async function deleteReminder(id: string): Promise<void> {
  const list = await loadReminders();
  await saveReminders(list.filter((r) => r.id !== id));
}

export function remindersForDate(list: CalendarReminder[], dateISO: string): CalendarReminder[] {
  return list.filter((r) => r.dateISO === dateISO);
}

export function isDeviceCalendarSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
