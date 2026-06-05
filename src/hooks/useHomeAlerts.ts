import { useEffect, useState, useCallback } from 'react';
import { HDate, months } from '@hebcal/core';
import { levanaStatus, LevanaStatus } from '../data/kiddushLevana';
import { loadLevanaHistory, recordLevana, saidLevanaThisMonth, BrachaPrefs, loadBrachaPrefs } from '../storage/brachot';
import { findNextYahrtzeit, daysUntil, Yahrtzeit } from '../data/yahrtzeit';
import { getJSON, Keys } from '../storage/storage';
import { useWaterProximity, ProximityStatus } from './useWaterProximity';
import { ushpizForDate } from '../data/ushpizin';
import { isTekufaToday } from '../data/tekufot';
import { useLocation } from './useLocation';
import { computeZmanim, formatTime } from '../data/hebcal';

const KEY_ILANOT = '@yahadut/ilanot-history';
const KEY_MEATMILK = Keys.meatMilkTimer;

type IlanotRecord = { hyear: number; saidAt: number };

type MeatMilkState = { startedAt: number | null; minhag: '6h' | '3h' | '1h'; meal: 'meat' | 'dairy' };

export type HomeAlert = {
  id: string;
  emoji: string;
  title: string;
  body: string;
  route: string;
  variant: 'primary' | 'accent';
  quickAction?: { label: string; onPress: () => Promise<void> | void };
};

export function useHomeAlerts(prefs: BrachaPrefs | null) {
  const [alerts, setAlerts] = useState<HomeAlert[]>([]);
  const proximity = useWaterProximity(prefs?.geofencingEnabled ?? false);
  const { location } = useLocation();

  const compute = useCallback(async () => {
    const now = new Date();
    const hd = new HDate(now);
    const list: HomeAlert[] = [];

    // 1. Water proximity (GPS)
    if (proximity.state === 'tracking' && proximity.shouldRemind) {
      list.push({
        id: 'water-' + proximity.site.id,
        emoji: '🌊',
        title: proximity.site.brachaShortName,
        body: proximity.distanceKm < 0.5
          ? `אתה ב${proximity.site.hebrewName}`
          : `${proximity.distanceKm.toFixed(1)} ק"מ מ${proximity.site.hebrewName}`,
        route: '/brachot/yam',
        variant: 'primary',
      });
    }

    // 2. Levana (in window, not said)
    const lv = levanaStatus(now);
    if (lv && (lv.state === 'in-window-sefardi' || lv.state === 'in-window-ashkenazi')) {
      const history = await loadLevanaHistory();
      const said = saidLevanaThisMonth(history, lv.window.hyear, lv.window.hmonth);
      if (!said) {
        list.push({
          id: 'levana',
          emoji: '🌙',
          title: `קידוש לבנה לחודש ${lv.window.monthName}`,
          body: lv.state === 'in-window-sefardi'
            ? `החלון פתוח לספרדים · אשכנזים בעוד ${lv.daysUntilAshkenazi} ימים`
            : `נותרו ${lv.daysLeft} ימים`,
          route: '/brachot/levana',
          variant: 'accent',
          quickAction: {
            label: '✓ כבר אמרתי',
            onPress: async () => {
              await recordLevana(lv.window.hyear, lv.window.hmonth);
            },
          },
        });
      }
    }

    // 3. Meat/milk live timer is displayed by <MeatMilkLiveTimer />
    //    on the home page directly (ticks every second). Skipped here to
    //    avoid duplication.

    // 4. Birkat Ilanot in Nissan (not said this year)
    if (hd.getMonth() === months.NISAN) {
      const ilanotHistory = await getJSON<IlanotRecord[]>(KEY_ILANOT, []);
      const saidThisYear = ilanotHistory.some((r) => r.hyear === hd.getFullYear());
      if (!saidThisYear) {
        list.push({
          id: 'ilanot',
          emoji: '🌳',
          title: 'ברכת האילנות',
          body: 'חודש ניסן - הזמן לברך על אילני מאכל מלבלבים',
          route: '/brachot/ilanot',
          variant: 'accent',
        });
      }
    }

    // 5. Yahrtzeit today / tomorrow
    const yahrtzeits = await getJSON<Yahrtzeit[]>(Keys.yahrtzeits, []);
    for (const y of yahrtzeits) {
      const next = findNextYahrtzeit(y, now);
      const days = daysUntil(next, now);
      if (days === 0) {
        list.push({
          id: `yahrtzeit-${y.id}-today`,
          emoji: '🕯️',
          title: `יארצייט היום - ${y.hebrewName}`,
          body: 'הדלקת נר נשמה, קדיש, צדקה',
          route: '/tools/yahrtzeit',
          variant: 'primary',
        });
      } else if (days === 1) {
        list.push({
          id: `yahrtzeit-${y.id}-tomorrow`,
          emoji: '🕯️',
          title: `יארצייט מחר - ${y.hebrewName}`,
          body: 'הכנות ליארצייט',
          route: '/tools/yahrtzeit',
          variant: 'accent',
        });
      }
    }

    // 6. Ushpizin during Sukkot
    const ush = ushpizForDate(now);
    if (ush) {
      list.push({
        id: `ushpiz-${ush.day}`,
        emoji: '🌿',
        title: `אושפיז יום ${ush.day}: ${ush.name}`,
        body: `${ush.attribute} - ${ush.description}`,
        route: '/tools/hoshanot',
        variant: 'accent',
      });
    }

    // 7. Tekufah today (3-month season transitions - put metal in water)
    const tekufaToday = isTekufaToday(now);
    if (tekufaToday) {
      list.push({
        id: `tekufa-${tekufaToday.name}`,
        emoji: tekufaToday.emoji,
        title: `${tekufaToday.name} היום`,
        body: 'מעבר תקופה - מנהג לשים מתכת/ברזל במים שתויים',
        route: '/tools/tekufot',
        variant: 'accent',
      });
    }

    // 8. Erev Pesach chametz times (14 Nisan)
    if (hd.getMonth() === months.NISAN && hd.getDate() === 14) {
      try {
        const z = computeZmanim(now, location);
        const eatTime = z.sofZmanAchilatChametz ? formatTime(z.sofZmanAchilatChametz, location.timezone) : null;
        const burnTime = z.sofZmanBiurChametz ? formatTime(z.sofZmanBiurChametz, location.timezone) : null;
        if (eatTime || burnTime) {
          list.push({
            id: 'chametz-times',
            emoji: '🍞',
            title: 'זמני חמץ - ערב פסח',
            body: `סוף אכילה: ${eatTime ?? '—'} · סוף ביעור: ${burnTime ?? '—'}`,
            route: '/zmanim',
            variant: 'primary',
          });
        }
      } catch {
        // skip if zmanim fail
      }
    }

    setAlerts(list);
  }, [proximity, location]);

  useEffect(() => {
    compute();
    // Re-tick every 30 seconds so the meat/milk countdown stays current
    const interval = setInterval(() => {
      compute();
    }, 30_000);
    return () => clearInterval(interval);
  }, [compute]);

  const refresh = useCallback(() => compute(), [compute]);
  return { alerts, refresh };
}
