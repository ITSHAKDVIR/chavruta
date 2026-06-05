import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let configured = false;

export async function configureNotifications(): Promise<void> {
  if (configured) return;
  // SDK 56 / expo-notifications v0.30+: `shouldShowAlert` is deprecated.
  // Use shouldShowBanner + shouldShowList instead. Mixing both shapes causes
  // the handler to return an inconsistent type that the native layer ignores.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }) as any,
  });
  if (Platform.OS === 'android') {
    // Bump default channel to HIGH so the notification heads-up (peeks at top)
    // and reliably lands in the tray. DEFAULT importance can be suppressed by
    // the system when the screen is on.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'התראות',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.setNotificationChannelAsync('brachot', {
      name: 'ברכות מיוחדות',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 200, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    // Dedicated channel for "right now" alerts triggered by location/geofence
    // (Tefilat HaDerech, Birkat HaYam, etc.) - MAX importance so user notices.
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'התראות מיידיות',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  configured = true;
}

export async function ensurePermissions(): Promise<boolean> {
  await configureNotifications();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleAt(when: Date, opts: { title: string; body: string; channelId?: string }): Promise<string | null> {
  if (when.getTime() <= Date.now()) return null;
  const ok = await ensurePermissions();
  if (!ok) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
      ...(Platform.OS === 'android' ? { channelId: opts.channelId ?? 'default' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: opts.channelId,
    } as any,
  });
  return id;
}

/**
 * Schedules a weekly recurring notification.
 * weekday: 0=Sunday ... 6=Saturday (matches JS Date.getDay()).
 * On native uses WEEKLY trigger; on web schedules a single notification at the next occurrence.
 */
export async function scheduleWeekly(
  weekday: number,
  hour: number,
  minute: number,
  opts: { title: string; body: string; channelId?: string }
): Promise<string | null> {
  const ok = await ensurePermissions();
  if (!ok) return null;
  // Compute next occurrence
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  const dayDiff = (weekday - now.getDay() + 7) % 7;
  next.setDate(now.getDate() + dayDiff);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 7);

  if (Platform.OS === 'web') {
    // Web: just a single shot at the next occurrence
    return scheduleAt(next, opts);
  }
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        ...(Platform.OS === 'android' ? { channelId: opts.channelId ?? 'default' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: weekday + 1, // expo uses 1-7 (1=Sunday)
        hour,
        minute,
        channelId: opts.channelId,
      } as any,
    });
    return id;
  } catch {
    return scheduleAt(next, opts);
  }
}

export async function cancelById(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function presentNow(opts: { title: string; body: string; channelId?: string }): Promise<void> {
  const ok = await ensurePermissions();
  if (!ok) {
    console.warn('[notifications] presentNow: permission denied');
    return;
  }
  // Default immediate-alert notifications to the high-priority 'alerts' channel.
  const channelId = opts.channelId ?? 'alerts';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === 'android' ? { channelId } : {}),
    },
    trigger: null,
  });
}
