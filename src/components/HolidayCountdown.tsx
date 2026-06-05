import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { HDate, HebrewCalendar, months, flags } from '@hebcal/core';
import { Card } from './Card';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

/**
 * Holiday-aware "today context" card.
 *
 * If today is the holiday → green "happening now" card.
 * If today is erev → countdown to tomorrow.
 * Otherwise → tells when the next occurrence is.
 *
 * Usage:
 *   <HolidayCountdown holiday="chanukah" />
 */

export type HolidayKey =
  | 'chanukah'
  | 'purim'
  | 'pesach'
  | 'erev-pesach'
  | 'shavuot'
  | 'rosh-hashana'
  | 'erev-rosh-hashana'
  | 'yom-kippur'
  | 'erev-yom-kippur'
  | 'sukkot'
  | 'shmini-atzeret'
  | 'tu-bishvat'
  | 'lag-baomer'
  | 'tisha-bav'
  | 'tu-bav'
  | 'rosh-chodesh';

const HEB_DESCRIPTIONS: Record<HolidayKey, string> = {
  'chanukah': 'חנוכה',
  'purim': 'פורים',
  'pesach': 'פסח',
  'erev-pesach': 'ערב פסח',
  'shavuot': 'שבועות',
  'rosh-hashana': 'ראש השנה',
  'erev-rosh-hashana': 'ערב ראש השנה',
  'yom-kippur': 'יום כיפור',
  'erev-yom-kippur': 'ערב יום כיפור',
  'sukkot': 'סוכות',
  'shmini-atzeret': 'שמיני עצרת',
  'tu-bishvat': 'ט"ו בשבט',
  'lag-baomer': 'ל"ג בעומר',
  'tisha-bav': 'תשעה באב',
  'tu-bav': 'ט"ו באב',
  'rosh-chodesh': 'ראש חודש',
};

/** Hebrew date components of the holiday. Day = first day. */
function holidayHebDates(key: HolidayKey, year: number): { startD: number; startM: number; endD?: number } {
  switch (key) {
    case 'chanukah':
      return { startD: 25, startM: months.KISLEV, endD: 2 }; // ends 2 Tevet
    case 'purim':
      return { startD: 14, startM: HDate.isLeapYear(year) ? months.ADAR_II : months.ADAR_I };
    case 'pesach':
      return { startD: 15, startM: months.NISAN, endD: 21 };
    case 'erev-pesach':
      return { startD: 14, startM: months.NISAN };
    case 'shavuot':
      return { startD: 6, startM: months.SIVAN };
    case 'rosh-hashana':
      return { startD: 1, startM: months.TISHREI, endD: 2 };
    case 'erev-rosh-hashana':
      return { startD: 29, startM: months.ELUL };
    case 'yom-kippur':
      return { startD: 10, startM: months.TISHREI };
    case 'erev-yom-kippur':
      return { startD: 9, startM: months.TISHREI };
    case 'sukkot':
      return { startD: 15, startM: months.TISHREI, endD: 21 };
    case 'shmini-atzeret':
      return { startD: 22, startM: months.TISHREI };
    case 'tu-bishvat':
      return { startD: 15, startM: months.SHVAT };
    case 'lag-baomer':
      return { startD: 18, startM: months.IYYAR };
    case 'tisha-bav':
      return { startD: 9, startM: months.AV };
    case 'tu-bav':
      return { startD: 15, startM: months.AV };
    case 'rosh-chodesh':
      return { startD: 1, startM: months.NISAN };
  }
}

function isToday(date: Date, key: HolidayKey, inIsrael: boolean): boolean {
  const hd = new HDate(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  switch (key) {
    case 'chanukah':
      return (m === months.KISLEV && d >= 25) || (m === months.TEVET && d <= 2);
    case 'purim': {
      const adar = HDate.isLeapYear(hd.getFullYear()) ? months.ADAR_II : months.ADAR_I;
      return m === adar && (d === 14 || (inIsrael && d === 15));
    }
    case 'pesach':
      return m === months.NISAN && d >= 15 && d <= 21;
    case 'erev-pesach':
      return m === months.NISAN && d === 14;
    case 'shavuot':
      return m === months.SIVAN && (d === 6 || (!inIsrael && d === 7));
    case 'rosh-hashana':
      return m === months.TISHREI && (d === 1 || d === 2);
    case 'erev-rosh-hashana':
      return m === months.ELUL && d === 29;
    case 'yom-kippur':
      return m === months.TISHREI && d === 10;
    case 'erev-yom-kippur':
      return m === months.TISHREI && d === 9;
    case 'sukkot':
      return m === months.TISHREI && d >= 15 && d <= 21;
    case 'shmini-atzeret':
      return m === months.TISHREI && (d === 22 || (!inIsrael && d === 23));
    case 'tu-bishvat':
      return m === months.SHVAT && d === 15;
    case 'lag-baomer':
      return m === months.IYYAR && d === 18;
    case 'tisha-bav':
      return m === months.AV && d === 9;
    case 'tu-bav':
      return m === months.AV && d === 15;
    case 'rosh-chodesh': {
      const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael, sedrot: false });
      return events.some((e) => e.getFlags() & flags.ROSH_CHODESH);
    }
  }
}

/** Returns the Gregorian date of next occurrence. */
function nextOccurrence(date: Date, key: HolidayKey, inIsrael: boolean): Date {
  const hd = new HDate(date);
  let year = hd.getFullYear();
  const { startD, startM } = holidayHebDates(key, year);
  // Try this year first, then next year
  for (let tryY = 0; tryY < 3; tryY++) {
    try {
      const candidate = new HDate(startD, startM, year + tryY).greg();
      if (candidate.getTime() >= date.getTime()) return candidate;
    } catch {
      continue;
    }
  }
  return date;
}

export function HolidayCountdown({ holiday, inIsrael = true }: { holiday: HolidayKey; inIsrael?: boolean }) {
  const now = new Date();
  const info = useMemo(() => {
    if (isToday(now, holiday, inIsrael)) {
      return { state: 'today' as const };
    }
    const next = nextOccurrence(now, holiday, inIsrael);
    const days = Math.ceil((next.getTime() - now.getTime()) / 86_400_000);
    return { state: 'future' as const, next, days };
  }, [now.toDateString(), holiday, inIsrael]);

  const label = HEB_DESCRIPTIONS[holiday];

  if (info.state === 'today') {
    return (
      <Card variant="primary">
        <Text style={[typography.small, { color: colors.textInverse, opacity: 0.85 }]}>הכלי הזה רלוונטי היום</Text>
        <Text style={[typography.h2, { color: colors.textInverse, marginTop: 2 }]}>
          ✓ היום {label}
        </Text>
      </Card>
    );
  }

  const niceDate = info.next.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const tone = info.days <= 7 ? 'primary' : 'accent';
  return (
    <Card variant={tone}>
      <Text
        style={[
          typography.small,
          { color: tone === 'primary' ? colors.textInverse : colors.primaryDark, opacity: 0.85 },
        ]}
      >
        ⏳ {label} בעוד
      </Text>
      <Text
        style={[
          typography.h2,
          { color: tone === 'primary' ? colors.textInverse : colors.primaryDark, marginTop: 2 },
        ]}
      >
        {info.days} {info.days === 1 ? 'יום' : 'ימים'}
      </Text>
      <Text
        style={[
          typography.small,
          { color: tone === 'primary' ? colors.textInverse : colors.primaryDark, opacity: 0.85, marginTop: spacing.xs },
        ]}
      >
        {niceDate}
      </Text>
    </Card>
  );
}
