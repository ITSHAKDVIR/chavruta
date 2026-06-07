import { HDate, HebrewCalendar, months } from '@hebcal/core';
import { ensurePermissions, scheduleAt, cancelById } from './notifications';
import { getJSON, setJSON } from '../storage/storage';
import { computeZmanim, StoredLocation } from '../data/hebcal';
import { loadNotifSettings } from './notifSettings';

const KEY_PREFS = '@yahadut/notif-prefs';
const KEY_SCHEDULED = '@yahadut/notif-scheduled';

export type NotifId =
  | 'shabbat-candles'
  | 'havdalah'
  | 'rosh-chodesh'
  | 'fast-day'
  | 'omer-counting'
  | 'mincha-reminder'
  | 'maariv-reminder'
  | 'sof-zman-shma'
  | 'sof-zman-tfila'
  | 'daf-yomi-reminder'
  | 'mishna-yomi-reminder'
  | 'parent-call'
  | 'birkat-levana'
  | 'birkat-ilanot-nisan'
  | 'shema-al-mita';

export type NotifPrefs = Record<NotifId, boolean>;

export const NOTIF_DEFINITIONS: Array<{
  id: NotifId;
  title: string;
  description: string;
  emoji: string;
  group: 'shabbat' | 'tefila' | 'learning' | 'mitzvot' | 'personal';
}> = [
  { id: 'shabbat-candles', title: 'הדלקת נרות שבת', description: 'תזכורת 30 דק׳ לפני הדלקה', emoji: '🕯️', group: 'shabbat' },
  { id: 'havdalah', title: 'הבדלה - מוצאי שבת', description: '40 דק׳ לאחר שקיעה', emoji: '🌃', group: 'shabbat' },
  { id: 'rosh-chodesh', title: 'ראש חודש', description: 'ערב ראש חודש בשעה 19:00', emoji: '🌙', group: 'tefila' },
  { id: 'fast-day', title: 'צום הקרב', description: 'יום לפני - תזכורת', emoji: '🍽️', group: 'mitzvot' },
  { id: 'omer-counting', title: 'ספירת העומר', description: 'כל יום בשעה 22:00 בעת הספירה', emoji: '🌾', group: 'mitzvot' },
  { id: 'mincha-reminder', title: 'תפילת מנחה', description: 'שעה לפני שקיעה', emoji: '🌅', group: 'tefila' },
  { id: 'maariv-reminder', title: 'תפילת ערבית', description: '30 דק׳ לאחר שקיעה', emoji: '🌌', group: 'tefila' },
  { id: 'sof-zman-shma', title: 'סוף זמן ק"ש', description: 'לפני סוף זמן קריאת שמע (גר"א)', emoji: '⏰', group: 'tefila' },
  { id: 'sof-zman-tfila', title: 'סוף זמן תפילה', description: 'לפני סוף זמן תפילה (גר"א)', emoji: '⏰', group: 'tefila' },
  { id: 'daf-yomi-reminder', title: 'דף יומי', description: 'תזכורת יומית בבוקר', emoji: '📚', group: 'learning' },
  { id: 'mishna-yomi-reminder', title: 'משנה יומית', description: 'תזכורת יומית בערב', emoji: '📖', group: 'learning' },
  { id: 'parent-call', title: 'כיבוד הורים', description: 'תזכורת שבועית לשיחה להורים', emoji: '📞', group: 'personal' },
  { id: 'birkat-levana', title: 'ברכת הלבנה', description: 'מתחילת זמן הברכה', emoji: '🌙', group: 'mitzvot' },
  { id: 'birkat-ilanot-nisan', title: 'ברכת האילנות', description: 'בתחילת ניסן - לראות אילני מאכל', emoji: '🌳', group: 'mitzvot' },
  { id: 'shema-al-mita', title: 'קריאת שמע על המיטה', description: 'תזכורת בלילה 23:00', emoji: '🌃', group: 'tefila' },
];

const DEFAULT_PREFS: NotifPrefs = Object.fromEntries(
  NOTIF_DEFINITIONS.map((d) => [d.id, false]),
) as NotifPrefs;

export async function loadNotifPrefs(): Promise<NotifPrefs> {
  const v = await getJSON<Partial<NotifPrefs>>(KEY_PREFS, {});
  return { ...DEFAULT_PREFS, ...v };
}
export async function saveNotifPrefs(p: NotifPrefs): Promise<void> {
  await setJSON(KEY_PREFS, p);
}

async function loadScheduled(): Promise<string[]> {
  return getJSON<string[]>(KEY_SCHEDULED, []);
}
async function saveScheduled(ids: string[]): Promise<void> {
  await setJSON(KEY_SCHEDULED, ids);
}

export async function clearAllScheduled(): Promise<void> {
  const ids = await loadScheduled();
  for (const id of ids) try { await cancelById(id); } catch {}
  await saveScheduled([]);
}

export async function rescheduleAll(location: StoredLocation): Promise<{ scheduled: number; failed: string[] }> {
  const prefs = await loadNotifPrefs();
  const settings = await loadNotifSettings();
  const ok = await ensurePermissions();
  if (!ok) return { scheduled: 0, failed: Object.keys(prefs).filter((k) => prefs[k as NotifId]) };

  await clearAllScheduled();
  const scheduledIds: string[] = [];
  const failed: string[] = [];
  const now = new Date();
  const inIsrael = location.countryCode === 'IL';

  async function schedule(when: Date, title: string, body: string, channelId = 'default'): Promise<void> {
    if (when.getTime() <= Date.now()) return;
    const id = await scheduleAt(when, { title, body, channelId });
    if (id) scheduledIds.push(id);
  }

  // Generate events for next 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const d = new Date(now.getTime() + dayOffset * 86_400_000);
    const hd = new HDate(d);
    const z = computeZmanim(d, location);

    // Shabbat candles (Friday)
    if (prefs['shabbat-candles'] && d.getDay() === 5 && z.sunset) {
      const candleMin = inIsrael ? 22 : 18;
      const lighting = new Date(z.sunset.getTime() - candleMin * 60_000);
      const remind = new Date(lighting.getTime() - settings.shabbatCandlesLeadMin * 60_000);
      await schedule(
        remind,
        '🕯️ הדלקת נרות שבת',
        `בעוד ${settings.shabbatCandlesLeadMin} דק׳ ב-${lighting.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: location.timezone })}`,
      );
    }

    // Havdalah (Saturday)
    if (prefs['havdalah'] && d.getDay() === 6 && z.tzeit42min) {
      const havdalahTime = new Date(z.tzeit42min.getTime() + settings.havdalahOffsetMin * 60_000);
      await schedule(havdalahTime, '🌃 הבדלה', 'יציאת שבת - זמן הבדלה');
    }

    // Rosh Chodesh (eve - day before at configured time)
    if (prefs['rosh-chodesh'] && hd.getDate() === 1) {
      const eve = new Date(d);
      eve.setDate(eve.getDate() - 1);
      eve.setHours(settings.roshChodeshEveHour, settings.roshChodeshEveMinute, 0, 0);
      await schedule(eve, '🌙 ערב ראש חודש', `מחר ראש חודש ${hd.getMonthName()}`);
    }

    // Fast day eve
    if (prefs['fast-day']) {
      const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael });
      for (const ev of events) {
        const f = ev.getFlags();
        if ((f & 4) || (f & 8)) {
          const eve = new Date(d);
          eve.setDate(eve.getDate() - 1);
          eve.setHours(settings.fastEveHour, settings.fastEveMinute, 0, 0);
          await schedule(eve, '🍽️ צום מחר', ev.render('he-x-NoNikud'));
        }
      }
    }

    // Mincha
    if (prefs['mincha-reminder'] && z.sunset) {
      const remind = new Date(z.sunset.getTime() - settings.minchaLeadMin * 60_000);
      await schedule(
        remind,
        '🌅 תפילת מנחה',
        `${settings.minchaLeadMin} דק׳ לפני שקיעה`,
      );
    }

    // Maariv
    if (prefs['maariv-reminder'] && z.sunset) {
      const remind = new Date(z.sunset.getTime() + settings.maarivAfterMin * 60_000);
      await schedule(
        remind,
        '🌌 תפילת ערבית',
        `${settings.maarivAfterMin} דק׳ לאחר שקיעה`,
      );
    }

    // Sof zman krias shema (GRA) - notify X minutes before
    if (prefs['sof-zman-shma'] && z.sofZmanShmaGRA) {
      const remind = new Date(z.sofZmanShmaGRA.getTime() - settings.sofZmanShmaLeadMin * 60_000);
      const timeStr = z.sofZmanShmaGRA.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: location.timezone });
      await schedule(remind, '⏰ סוף זמן ק"ש מתקרב', `סוף זמן ק"ש לפי הגר"א ב-${timeStr}`);
    }

    // Sof zman tfila (GRA) - notify X minutes before
    if (prefs['sof-zman-tfila'] && z.sofZmanTfillaGRA) {
      const remind = new Date(z.sofZmanTfillaGRA.getTime() - settings.sofZmanTfilaLeadMin * 60_000);
      const timeStr = z.sofZmanTfillaGRA.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: location.timezone });
      await schedule(remind, '⏰ סוף זמן תפילה מתקרב', `סוף זמן תפילה לפי הגר"א ב-${timeStr}`);
    }

    // Daf Yomi morning
    if (prefs['daf-yomi-reminder']) {
      const t = new Date(d);
      t.setHours(settings.dafHour, settings.dafMinute, 0, 0);
      await schedule(t, '📚 דף יומי', 'תזכורת ללמוד דף יומי');
    }

    // Mishna Yomi evening
    if (prefs['mishna-yomi-reminder']) {
      const t = new Date(d);
      t.setHours(settings.mishnaHour, settings.mishnaMinute, 0, 0);
      await schedule(t, '📖 משנה יומית', 'תזכורת ללמוד משניות');
    }

    // Parent call (configurable weekday + time)
    if (prefs['parent-call'] && d.getDay() === settings.parentCallWeekday) {
      const t = new Date(d);
      t.setHours(settings.parentCallHour, settings.parentCallMinute, 0, 0);
      await schedule(t, '📞 שיחה להורים', 'כיבוד אב ואם - שיחה שבועית');
    }

    // Shema al haMita
    if (prefs['shema-al-mita']) {
      const t = new Date(d);
      t.setHours(settings.shemaHour, settings.shemaMinute, 0, 0);
      await schedule(t, '🌃 קריאת שמע על המיטה', 'לפני שינה');
    }

    // Omer counting (in Omer period)
    if (prefs['omer-counting']) {
      const evs = HebrewCalendar.calendar({ start: hd, end: hd, omer: true, sedrot: false, candlelighting: false });
      const isOmer = evs.some((ev) => ev.getFlags() & 0x40000);
      if (isOmer) {
        const t = new Date(d);
        t.setHours(settings.omerHour, settings.omerMinute, 0, 0);
        await schedule(t, '🌾 ספירת העומר', 'ספור את היום בעומר');
      }
    }
  }

  // Birkat Levana - first of month
  if (prefs['birkat-levana']) {
    const next3 = new Date(now);
    next3.setDate(next3.getDate() + 4);
    next3.setHours(20, 0, 0, 0);
    await schedule(next3, '🌙 ברכת הלבנה', 'החלון לקידוש לבנה החל');
  }

  // Birkat Ilanot - 1 Nisan
  if (prefs['birkat-ilanot-nisan']) {
    const nowHd = new HDate(now);
    let nisanYear = nowHd.getMonth() < months.NISAN ? nowHd.getFullYear() : nowHd.getFullYear() + 1;
    if (nowHd.getMonth() === months.NISAN) nisanYear = nowHd.getFullYear();
    const nisan1 = new HDate(1, months.NISAN, nisanYear);
    const t = new Date(nisan1.greg());
    t.setHours(9, 0, 0, 0);
    await schedule(t, '🌳 ברכת האילנות', 'חודש ניסן - הזמן לברך על אילני מאכל');
  }

  // ===== Yahrzeit reminders =====
  // For each saved yahrzeit, schedule eve (sundown of day before) + morning
  // alerts for the upcoming yahrzeit + the one after.
  try {
    const { loadYahrzeits, nextYahrzeitDate } = await import('./yahrzeit');
    const list = await loadYahrzeits();
    for (const yz of list) {
      let from = now;
      for (let i = 0; i < 2; i++) {
        const next = nextYahrzeitDate(yz, from);
        if (next.getTime() > now.getTime()) {
          if (yz.remindEve) {
            // Eve: 19:00 the night before
            const eve = new Date(next);
            eve.setDate(eve.getDate() - 1);
            eve.setHours(19, 0, 0, 0);
            await schedule(
              eve,
              `🕯️ ערב יארצייט - ${yz.name}`,
              `מחר היארצייט של ${yz.name} (${yz.relation}). זמן להדלקת נר נשמה.`,
              'alerts',
            );
          }
          if (yz.remindMorning) {
            // Morning of: 07:00
            const morn = new Date(next);
            morn.setHours(7, 0, 0, 0);
            await schedule(
              morn,
              `🕯️ יארצייט היום - ${yz.name}`,
              `יום השנה של ${yz.name} (${yz.relation}). זמן לקדיש, לימוד וצדקה.`,
              'alerts',
            );
          }
        }
        // Look at the yahrzeit after this one
        from = new Date(next.getTime() + 86400000);
      }
    }
  } catch (e) {
    console.warn('[notifHub] yahrzeit scheduling failed:', e);
  }

  await saveScheduled(scheduledIds);
  return { scheduled: scheduledIds.length, failed };
}
