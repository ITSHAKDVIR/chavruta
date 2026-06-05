import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { HDate, months } from '@hebcal/core';
import { hebrewNumeral } from '../data/hebrewNumbers';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

/**
 * Compact date picker that lets the user choose a date in EITHER Hebrew
 * or Gregorian calendars. Internally we always emit a Gregorian Date.
 *
 * Usage:
 *   <HebrewDatePicker
 *     value={birthDate}
 *     onChange={setBirthDate}
 *     defaultMode="hebrew"
 *   />
 */

export type Mode = 'hebrew' | 'gregorian';

const HEB_MONTHS_NON_LEAP = [
  { num: months.NISAN, he: 'ניסן' },
  { num: months.IYYAR, he: 'אייר' },
  { num: months.SIVAN, he: 'סיון' },
  { num: months.TAMUZ, he: 'תמוז' },
  { num: months.AV, he: 'אב' },
  { num: months.ELUL, he: 'אלול' },
  { num: months.TISHREI, he: 'תשרי' },
  { num: months.CHESHVAN, he: 'חשון' },
  { num: months.KISLEV, he: 'כסלו' },
  { num: months.TEVET, he: 'טבת' },
  { num: months.SHVAT, he: 'שבט' },
  { num: months.ADAR_I, he: 'אדר' },
];

const HEB_MONTHS_LEAP = [
  { num: months.NISAN, he: 'ניסן' },
  { num: months.IYYAR, he: 'אייר' },
  { num: months.SIVAN, he: 'סיון' },
  { num: months.TAMUZ, he: 'תמוז' },
  { num: months.AV, he: 'אב' },
  { num: months.ELUL, he: 'אלול' },
  { num: months.TISHREI, he: 'תשרי' },
  { num: months.CHESHVAN, he: 'חשון' },
  { num: months.KISLEV, he: 'כסלו' },
  { num: months.TEVET, he: 'טבת' },
  { num: months.SHVAT, he: 'שבט' },
  { num: months.ADAR_I, he: 'אדר א׳' },
  { num: months.ADAR_II, he: 'אדר ב׳' },
];

const GREG_MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

function daysInHebrewMonth(year: number, month: number): number {
  // hebcal: month numbers vary; query HDate
  try {
    return HDate.daysInMonth(month as any, year);
  } catch {
    return 30;
  }
}

function daysInGregMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clampInRange(n: number, max: number): number {
  return Math.min(Math.max(1, n), max);
}

type Props = {
  value: Date;
  onChange: (d: Date) => void;
  defaultMode?: Mode;
  /** Allow a year span around current year. Default ±100. */
  yearSpan?: number;
};

export function HebrewDatePicker({ value, onChange, defaultMode = 'hebrew', yearSpan = 100 }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode);

  // Always derive from `value` so external changes stay in sync.
  const hd = useMemo(() => new HDate(value), [value.toDateString()]);
  const hYear = hd.getFullYear();
  const hMonth = hd.getMonth();
  const hDay = hd.getDate();

  const gYear = value.getFullYear();
  const gMonth = value.getMonth();
  const gDay = value.getDate();

  const monthList = useMemo(
    () => (HDate.isLeapYear(hYear) ? HEB_MONTHS_LEAP : HEB_MONTHS_NON_LEAP),
    [hYear],
  );

  function setHebDate(y: number, m: number, d: number) {
    const maxDay = daysInHebrewMonth(y, m);
    const clamped = clampInRange(d, maxDay);
    try {
      const newHd = new HDate(clamped, m, y);
      onChange(newHd.greg());
    } catch (e) {
      console.warn('Invalid hebrew date:', y, m, d, e);
    }
  }

  function setGregDate(y: number, m: number, d: number) {
    const maxDay = daysInGregMonth(y, m);
    const clamped = clampInRange(d, maxDay);
    const newDate = new Date(y, m, clamped, 12, 0, 0, 0);
    onChange(newDate);
  }

  const currentYearGreg = new Date().getFullYear();
  const currentYearHeb = new HDate().getFullYear();

  const gregYearOptions = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYearGreg + 5; y >= currentYearGreg - yearSpan; y--) arr.push(y);
    return arr;
  }, [currentYearGreg, yearSpan]);

  const hebYearOptions = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYearHeb + 5; y >= currentYearHeb - yearSpan; y--) arr.push(y);
    return arr;
  }, [currentYearHeb, yearSpan]);

  return (
    <View style={styles.wrap}>
      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <Pressable
          onPress={() => setMode('hebrew')}
          style={[styles.modeBtn, mode === 'hebrew' && styles.modeBtnActive]}
        >
          <Text style={[typography.bodyBold, { color: mode === 'hebrew' ? colors.textInverse : colors.textPrimary }]}>
            עברי
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('gregorian')}
          style={[styles.modeBtn, mode === 'gregorian' && styles.modeBtnActive]}
        >
          <Text style={[typography.bodyBold, { color: mode === 'gregorian' ? colors.textInverse : colors.textPrimary }]}>
            לועזי
          </Text>
        </Pressable>
      </View>

      {/* Show summary in both calendars */}
      <View style={styles.summary}>
        <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center' }]}>
          {hd.renderGematriya()}{'  ·  '}
          {value.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* Three pickers: day / month / year */}
      <View style={styles.pickerRow}>
        {/* Day */}
        <View style={styles.pickerCol}>
          <Text style={[typography.caption, styles.pickerLabel]}>יום</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={true} nestedScrollEnabled={true} persistentScrollbar={true}>
            {(() => {
              const maxDay = mode === 'hebrew' ? daysInHebrewMonth(hYear, hMonth) : daysInGregMonth(gYear, gMonth);
              const days = Array.from({ length: maxDay }, (_, i) => i + 1);
              const current = mode === 'hebrew' ? hDay : gDay;
              return days.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => (mode === 'hebrew' ? setHebDate(hYear, hMonth, d) : setGregDate(gYear, gMonth, d))}
                  style={[styles.option, current === d && styles.optionActive]}
                >
                  <Text
                    style={[
                      typography.body,
                      { color: current === d ? colors.textInverse : colors.textPrimary, textAlign: 'center' },
                    ]}
                  >
                    {mode === 'hebrew' ? hebrewNumeral(d) : d}
                  </Text>
                </Pressable>
              ));
            })()}
          </ScrollView>
        </View>

        {/* Month */}
        <View style={[styles.pickerCol, { flex: 1.5 }]}>
          <Text style={[typography.caption, styles.pickerLabel]}>חודש</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={true} nestedScrollEnabled={true} persistentScrollbar={true}>
            {(mode === 'hebrew'
              ? monthList.map((m) => ({ value: m.num, label: m.he }))
              : GREG_MONTHS_HE.map((label, i) => ({ value: i, label }))
            ).map(({ value: mv, label }) => {
              const current = mode === 'hebrew' ? hMonth : gMonth;
              return (
                <Pressable
                  key={mv}
                  onPress={() => (mode === 'hebrew' ? setHebDate(hYear, mv, hDay) : setGregDate(gYear, mv, gDay))}
                  style={[styles.option, current === mv && styles.optionActive]}
                >
                  <Text
                    style={[
                      typography.body,
                      { color: current === mv ? colors.textInverse : colors.textPrimary, textAlign: 'center' },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Year */}
        <View style={styles.pickerCol}>
          <Text style={[typography.caption, styles.pickerLabel]}>שנה</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={true} nestedScrollEnabled={true} persistentScrollbar={true}>
            {(mode === 'hebrew' ? hebYearOptions : gregYearOptions).map((y) => {
              const current = mode === 'hebrew' ? hYear : gYear;
              return (
                <Pressable
                  key={y}
                  onPress={() => (mode === 'hebrew' ? setHebDate(y, hMonth, hDay) : setGregDate(y, gMonth, gDay))}
                  style={[styles.option, current === y && styles.optionActive]}
                >
                  <Text
                    style={[
                      typography.body,
                      { color: current === y ? colors.textInverse : colors.textPrimary, textAlign: 'center' },
                    ]}
                  >
                    {mode === 'hebrew' ? hebrewNumeral(y).replace(/^.{0,2}/, '') || y : y}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  modeRow: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surfaceAlt,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  summary: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerRow: {
    flexDirection: 'row-reverse',
    height: 200,
  },
  pickerCol: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  pickerLabel: {
    color: colors.textMuted,
    paddingVertical: 6,
    textAlign: 'center',
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: { flex: 1 },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
});
