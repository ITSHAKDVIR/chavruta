import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { useTick } from '../../src/hooks/useTick';
import { Keys } from '../../src/storage/storage';
import { scheduleAt, cancelById } from '../../src/services/notifications';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Minhag = '6h' | '5h+' | '5.5h' | '3h' | '1h';

type State = {
  startedAt: number | null;
  minhag: Minhag;
  meal: 'meat' | 'dairy';
  /** Local notification scheduled to fire when the wait ends. */
  notifId?: string;
  /** Set when the user explicitly dismisses the "done" card. */
  dismissedAt?: number;
};

const HOURS_BY_MINHAG: Record<Minhag, number> = {
  '6h': 6,
  '5h+': 5.01,   // "טיפה יותר מ-5 שעות" — לפי הוראת הרב
  '5.5h': 5.5,   // מנהג חב"ד וחלק מהאשכנזים
  '3h': 3,
  '1h': 1,
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function MeatMilkScreen() {
  useTick(1000);
  const router = useRouter();
  const [state, setState] = useStoredJSON<State>(Keys.meatMilkTimer, {
    startedAt: null,
    minhag: '6h',
    meal: 'meat',
  });

  const hours = HOURS_BY_MINHAG[state.minhag];
  const endsAt = state.startedAt ? state.startedAt + hours * 3600_000 : null;
  const remaining = endsAt ? endsAt - Date.now() : 0;
  const isActive = endsAt !== null && remaining > 0;
  const isDone = endsAt !== null && remaining <= 0;

  const start = async (meal: 'meat' | 'dairy') => {
    const startedAt = Date.now();
    const endsAt = startedAt + HOURS_BY_MINHAG[state.minhag] * 3600_000;

    // Cancel any previously scheduled notification
    if (state.notifId) {
      try {
        await cancelById(state.notifId);
      } catch {}
    }

    // Schedule a notification for when the wait is over
    let notifId: string | undefined;
    try {
      const id = await scheduleAt(new Date(endsAt), {
        title: meal === 'meat' ? '🧀 ניתן לאכול חלב' : '🥩 ניתן לאכול בשר',
        body: `הסתיים זמן ההמתנה (${HOURS_BY_MINHAG[state.minhag]} שעות)`,
      });
      notifId = id ?? undefined;
    } catch (e) {
      console.warn('[meatmilk] failed to schedule notification:', e);
    }

    setState((s) => ({ ...s, startedAt, meal, notifId, dismissedAt: undefined }));
  };

  const reset = async () => {
    // Cancel notification if pending
    if (state.notifId) {
      try {
        await cancelById(state.notifId);
      } catch {}
    }
    setState((s) => ({ ...s, startedAt: null, notifId: undefined, dismissedAt: undefined }));
  };
  const confirmStop = () => {
    // On web Alert.alert callbacks don't always fire reliably — fall back to window.confirm
    if (typeof window !== 'undefined' && typeof (window as any).confirm === 'function') {
      const ok = (window as any).confirm('האם להפסיק את המונה? תאבד את הזמן שכבר עבר.');
      if (ok) reset();
      return;
    }
    Alert.alert(
      'עצירת המונה',
      'האם להפסיק את המונה? תאבד את הזמן שכבר עבר.',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'עצור', style: 'destructive', onPress: reset },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="מונה בשר-חלב" subtitle="התראה כשמותר לשנות" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>המנהג שלי:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
              {(['6h', '5h+', '5.5h', '3h', '1h'] as Minhag[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setState((s) => ({ ...s, minhag: m }))}
                  style={[styles.minhagBtn, state.minhag === m && styles.minhagBtnActive]}
                >
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: state.minhag === m ? colors.textInverse : colors.textPrimary },
                    ]}
                  >
                    {m === '6h' ? '6 שעות'
                      : m === '5h+' ? '5+ שעות'
                      : m === '5.5h' ? '5½ שעות'
                      : m === '3h' ? '3 שעות'
                      : 'שעה'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {!state.startedAt ? (
            <Card>
              <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
                סמן באיזו ארוחה אכלת:
              </Text>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
                <Button label="🥩 בשר" onPress={() => start('meat')} fullWidth style={{ flex: 1 }} />
                <Button
                  label="🧀 חלב"
                  onPress={() => start('dairy')}
                  variant="secondary"
                  fullWidth
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          ) : (
            <Card variant={isActive ? 'primary' : 'accent'}>
              <Text style={[typography.small, { color: isActive ? colors.textInverse : colors.primaryDark, opacity: 0.85 }]}>
                {state.meal === 'meat' ? 'אכלת בשר' : 'אכלת חלב'} - {hours} שעות
              </Text>
              {isDone ? (
                <Text style={[typography.h1, { color: colors.primaryDark, marginTop: spacing.sm }]}>
                  ✓ ניתן לאכול {state.meal === 'meat' ? 'מאכלי חלב' : 'מאכלי בשר'}
                </Text>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 56,
                      color: colors.textInverse,
                      fontWeight: '700',
                      letterSpacing: 2,
                      marginTop: 4,
                    }}
                  >
                    {formatRemaining(remaining)}
                  </Text>
                  <Text style={[typography.body, { color: colors.textInverse, opacity: 0.9, marginTop: spacing.xs }]}>
                    זמן שנותר עד {state.meal === 'meat' ? 'חלב' : 'בשר'}
                  </Text>
                </>
              )}
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' }}>
                {!isDone && (
                  <Button label="⏸ עצור מונה" onPress={confirmStop} variant="secondary" style={{ flexGrow: 1, minWidth: 140 }} />
                )}
                <Button label={isDone ? 'התחל מחדש' : 'איפוס'} onPress={reset} variant="ghost" style={{ flexGrow: 1, minWidth: 140 }} />
              </View>
            </Card>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>מנהגים</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              <Text style={{ fontWeight: '700' }}>6 שעות</Text> - מנהג רוב הספרדים וחסידי אשכנז (הרמ"א).{'\n'}
              <Text style={{ fontWeight: '700' }}>5+ שעות (טיפה יותר מ-5)</Text> - מנהג יוצאי גרמניה לאלו שלא נוהגים 6 שעות (דעת ה"שלחן ערוך הרב").{'\n'}
              <Text style={{ fontWeight: '700' }}>5½ שעות</Text> - מנהג חב"ד וחלק מהאשכנזים.{'\n'}
              <Text style={{ fontWeight: '700' }}>3 שעות</Text> - מנהג יוצאי גרמניה וההולנדים.{'\n'}
              <Text style={{ fontWeight: '700' }}>שעה אחת</Text> - מנהג הולנדים (חוץ מ"בשר ברורה").
            </Text>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  minhagBtn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  minhagBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
