import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, Molad, months } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const HEB_MONTHS: Record<number, string> = {
  [months.TISHREI]: 'תשרי',
  [months.CHESHVAN]: 'חשוון',
  [months.KISLEV]: 'כסלו',
  [months.TEVET]: 'טבת',
  [months.SHVAT]: 'שבט',
  [months.ADAR_I]: 'אדר א׳',
  [months.ADAR_II]: 'אדר ב׳',
  [months.NISAN]: 'ניסן',
  [months.IYYAR]: 'אייר',
  [months.SIVAN]: 'סיוון',
  [months.TAMUZ]: 'תמוז',
  [months.AV]: 'אב',
  [months.ELUL]: 'אלול',
};

type MoladInfo = {
  monthName: string;
  greg: Date;
  hour: number;
  minutes: number;
  chalakim: number;
  kiddushFrom: Date;
  kiddushTo: Date;
};

/**
 * The molad whose kiddush levana window is currently RELEVANT — either:
 *  - active (in window),
 *  - upcoming (window hasn't started),
 *  - or just-expired (window ended in the past N days, so we can show "עבר").
 *
 * We pick the molad whose kiddushTo is closest to "now" but not far in the past,
 * so the user sees the right context.
 */
function relevantMolad(now: Date = new Date()): MoladInfo | null {
  const hd = new HDate(now);
  let year = hd.getFullYear();
  let month = hd.getMonth();
  // Sweep from one month back to one year forward, pick the one whose window
  // most recently ended (if expired) or hasn't ended yet.
  let best: MoladInfo | null = null;
  for (let offset = -1; offset < 14; offset++) {
    try {
      const rawMonth = month - 1 + offset;
      const targetMonth = ((rawMonth % 13) + 13) % 13 + 1;
      const targetYear = year + Math.floor(rawMonth / 13);
      const m = new Molad(targetYear, targetMonth);
      const greg = new Date(m.getInstant().epochMilliseconds);
      const kiddushFrom = new Date(m.getTchilasZmanKidushLevana3Days().epochMilliseconds);
      const kiddushTo = new Date(m.getSofZmanKidushLevana15Days().epochMilliseconds);
      const info: MoladInfo = {
        monthName: HEB_MONTHS[targetMonth] ?? '?',
        greg, hour: m.getHour(), minutes: m.getMinutes(), chalakim: m.getChalakim(),
        kiddushFrom, kiddushTo,
      };
      // Prefer the molad whose window is active now, or otherwise the
      // next future one.
      const inWindow = now.getTime() >= kiddushFrom.getTime() && now.getTime() <= kiddushTo.getTime();
      if (inWindow) return info;  // perfect match
      if (kiddushFrom.getTime() > now.getTime() && !best) best = info;
    } catch {}
  }
  return best;
}

/** Convert a JS Date to a Hebrew date string like "י"ח סיון תשפ"ו". */
function gregToHebrewDate(d: Date): string {
  try {
    const hd = new HDate(d);
    return hd.renderGematriya(true);  // includes year
  } catch {
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  }
}

// (Full nusach + selector live in /brachot/levana — this screen just shows
//  the molad time + window. A "לנוסח המלא" link below navigates there.)

export default function MoladScreen() {
  const router = useRouter();
  const next = useMemo(() => relevantMolad(), []);
  const now = new Date();
  const inWindow = next
    ? now.getTime() >= next.kiddushFrom.getTime() && now.getTime() <= next.kiddushTo.getTime()
    : false;
  const expired = next ? now.getTime() > next.kiddushTo.getTime() : false;
  const upcoming = next ? now.getTime() < next.kiddushFrom.getTime() : false;

  function formatDateTime(d: Date): string {
    // Hebrew date + time of day (time stays digital — gematria for time is unusual)
    const hebrewDate = gregToHebrewDate(d);
    const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    return `${hebrewDate}, ${time}`;
  }
  function formatDate(d: Date): string {
    return gregToHebrewDate(d);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="מולד וברכת הלבנה" subtitle={next ? `מולד ${next.monthName}` : ''} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {next && (
            <Card variant="primary">
              <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center' }]}>
                מולד {next.monthName}
              </Text>
              <Text
                style={[
                  typography.h2,
                  { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm },
                ]}
              >
                {formatDateTime(next.greg)}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textPrimary, opacity: 0.85, textAlign: 'center', marginTop: 4 },
                ]}
              >
                {next.hour} שעות, {next.minutes} דקות, {next.chalakim} חלקים
              </Text>
            </Card>
          )}

          {next && (
            <Card variant={inWindow ? 'accent' : 'default'}>
              <Text style={[typography.h3, { color: inWindow ? colors.primaryDark : colors.textPrimary }]}>
                🌙 חלון ברכת הלבנה
              </Text>
              {inWindow && (
                <View style={{ marginTop: 4 }}>
                  <Pill label="✓ אפשר לברך עכשיו" tone="success" />
                </View>
              )}
              {expired && (
                <View style={{ marginTop: 4 }}>
                  <Pill label="✗ עבר זמן ברכת הלבנה לחודש זה" tone="danger" />
                </View>
              )}
              {upcoming && (
                <View style={{ marginTop: 4 }}>
                  <Pill label="⏳ הזמן לא התחיל עדיין" tone="warning" />
                </View>
              )}
              <View style={[styles.row, { marginTop: spacing.sm }]}>
                <Text style={[typography.body, { color: colors.textPrimary }]}>תחילת זמן (3 ימים)</Text>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  {formatDate(next.kiddushFrom)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[typography.body, { color: colors.textPrimary }]}>סוף זמן (15 ימים)</Text>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  {formatDate(next.kiddushTo)}
                </Text>
              </View>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
                ]}
              >
                ספרדים: מ-3 ימים אחר המולד עד מילוי הלבנה. אשכנזים: מ-7 ימים אחר המולד.
              </Text>
            </Card>
          )}

          <Card variant="accent" onPress={() => router.push('/brachot/levana' as any)}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
              <Text style={{ fontSize: 28 }}>🌙</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>לנוסח המלא של קידוש לבנה</Text>
                <Text style={[typography.small, { color: colors.textPrimary, marginTop: 2 }]}>
                  נוסחי אשכנז וספרד · קביעת תזכורת · סימון "בירכתי החודש"
                </Text>
              </View>
              <Text style={{ color: colors.primaryDark, fontSize: 18 }}>‹</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sacredBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
