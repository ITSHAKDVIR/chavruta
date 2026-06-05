import { getJSON, setJSON } from '../storage/storage';

/** Per-notification timing settings (separate from on/off toggles in notificationsHub). */
export type NotifSettings = {
  /** Shabbat candle reminder: minutes BEFORE candle lighting time. */
  shabbatCandlesLeadMin: number;
  /** Mincha reminder: minutes BEFORE sunset (i.e., reminder fires X min before). */
  minchaLeadMin: number;
  /** Maariv reminder: minutes AFTER sunset. */
  maarivAfterMin: number;
  /** Sof zman krias shema reminder: minutes BEFORE (e.g., 15 = 15 min before). */
  sofZmanShmaLeadMin: number;
  /** Sof zman tfila reminder: minutes BEFORE. */
  sofZmanTfilaLeadMin: number;
  /** Havdalah reminder offset minutes after tzeit (42 min default). 0 = at tzeit. */
  havdalahOffsetMin: number;
  /** Shema al haMita reminder time (24h). */
  shemaHour: number;
  shemaMinute: number;
  /** Whether to also check charging state on app open to prompt Shema. */
  shemaSmartCharger: boolean;
  /** Omer counting reminder time. */
  omerHour: number;
  omerMinute: number;
  /** Daf Yomi morning reminder. */
  dafHour: number;
  dafMinute: number;
  /** Mishna Yomi evening reminder. */
  mishnaHour: number;
  mishnaMinute: number;
  /** Rosh Chodesh eve reminder time. */
  roshChodeshEveHour: number;
  roshChodeshEveMinute: number;
  /** Fast day eve reminder time. */
  fastEveHour: number;
  fastEveMinute: number;
};

export const DEFAULT_SETTINGS: NotifSettings = {
  shabbatCandlesLeadMin: 30,
  minchaLeadMin: 60,
  maarivAfterMin: 30,
  sofZmanShmaLeadMin: 15,
  sofZmanTfilaLeadMin: 15,
  havdalahOffsetMin: 0,
  shemaHour: 23,
  shemaMinute: 0,
  shemaSmartCharger: false,
  omerHour: 21,
  omerMinute: 30,
  dafHour: 7,
  dafMinute: 0,
  mishnaHour: 21,
  mishnaMinute: 30,
  roshChodeshEveHour: 19,
  roshChodeshEveMinute: 0,
  fastEveHour: 18,
  fastEveMinute: 0,
};

const KEY = '@yahadut/notif-settings';

export async function loadNotifSettings(): Promise<NotifSettings> {
  const v = await getJSON<Partial<NotifSettings>>(KEY, {});
  return { ...DEFAULT_SETTINGS, ...v };
}

export async function saveNotifSettings(s: NotifSettings): Promise<void> {
  await setJSON(KEY, s);
}

export async function updateNotifSetting<K extends keyof NotifSettings>(
  key: K,
  value: NotifSettings[K],
): Promise<NotifSettings> {
  const cur = await loadNotifSettings();
  const next = { ...cur, [key]: value };
  await saveNotifSettings(next);
  return next;
}
