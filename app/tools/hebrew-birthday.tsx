import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { HebrewDatePicker } from '../../src/components/HebrewDatePicker';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function HebrewBirthdayScreen() {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState<Date>(new Date(1990, 0, 1));

  const parsed = useMemo(() => {
    try {
      const d = birthDate;
      if (isNaN(d.getTime())) return null;
      const birthHd = new HDate(d);
      const today = new Date();
      const todayHd = new HDate(today);

      const ageInDays = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
      const ageHebrew = todayHd.getFullYear() - birthHd.getFullYear() - (todayHd.getMonth() < birthHd.getMonth() || (todayHd.getMonth() === birthHd.getMonth() && todayHd.getDate() < birthHd.getDate()) ? 1 : 0);
      const ageGreg = today.getFullYear() - d.getFullYear() - (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate()) ? 1 : 0);

      const thisYearHbDay = new HDate(birthHd.getDate(), birthHd.getMonth(), todayHd.getFullYear());
      const nextYearHbDay = thisYearHbDay.abs() >= todayHd.abs() ? thisYearHbDay : new HDate(birthHd.getDate(), birthHd.getMonth(), todayHd.getFullYear() + 1);
      const daysUntilNext = nextYearHbDay.abs() - todayHd.abs();

      return {
        birthHebrew: birthHd.renderGematriya(),
        birthHebrewSimple: hebrewDateInfo(d),
        ageInDays,
        ageHebrew,
        ageGreg,
        nextBirthday: nextYearHbDay.greg(),
        nextBirthdayHebrew: nextYearHbDay.renderGematriya(),
        daysUntilNext,
        isBarMitzvah: ageHebrew >= 13,
        isBatMitzvah: ageHebrew >= 12,
      };
    } catch {
      return null;
    }
  }, [birthDate.toDateString()]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="יום הולדת עברי" subtitle="גיל עברי + ספירה לקראת הולדת" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              תאריך לידה:
            </Text>
            <HebrewDatePicker value={birthDate} onChange={setBirthDate} defaultMode="hebrew" yearSpan={120} />
          </Card>

          {parsed && (
            <>
              <Card variant="primary">
                <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>תאריך לידה עברי</Text>
                <Text style={[typography.display, { color: colors.textPrimary, marginTop: 4 }]}>
                  {parsed.birthHebrew}
                </Text>
              </Card>

              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
                <View style={[styles.stat, { backgroundColor: colors.surface }]}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>גיל עברי</Text>
                  <Text style={[typography.h1, { color: colors.primary }]}>{parsed.ageHebrew}</Text>
                </View>
                <View style={[styles.stat, { backgroundColor: colors.surface }]}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>גיל לועזי</Text>
                  <Text style={[typography.h1, { color: colors.primary }]}>{parsed.ageGreg}</Text>
                </View>
                <View style={[styles.stat, { backgroundColor: colors.surface }]}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>ימים סה"כ</Text>
                  <Text style={[typography.h2, { color: colors.primary }]}>{parsed.ageInDays.toLocaleString('he-IL')}</Text>
                </View>
              </View>

              <Card variant="accent">
                <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85 }]}>יום הולדת עברי הבא</Text>
                <Text style={[typography.h2, { color: colors.primaryDark, marginTop: 2 }]}>
                  {parsed.nextBirthdayHebrew}
                </Text>
                <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
                  {parsed.daysUntilNext === 0
                    ? '🎉 מזל טוב! היום!'
                    : `עוד ${parsed.daysUntilNext} ימים (${parsed.nextBirthday.toLocaleDateString('he-IL')})`}
                </Text>
              </Card>

              {parsed.isBarMitzvah && (
                <Card>
                  <Text style={[typography.bodyBold, { color: colors.success }]}>✓ בר/בת מצווה</Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                    גיל 13 (בר מצווה) / 12 (בת מצווה) הושלם
                  </Text>
                </Card>
              )}
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
    backgroundColor: colors.bg,
  },
  stat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
});
