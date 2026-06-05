import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { Icon } from '../../src/components/Icon';
import { WATER_SITES } from '../../src/data/brachot';
import { levanaStatus, LevanaStatus } from '../../src/data/kiddushLevana';
import { loadBrachaHistory, loadLevanaHistory, saidLevanaThisMonth, BrachaHistory, LevanaRecord } from '../../src/storage/brachot';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { HDate } from '@hebcal/core';

export default function BrachotIndex() {
  const router = useRouter();
  const [history, setHistory] = useState<BrachaHistory>({});
  const [levanaHistory, setLevanaHistory] = useState<LevanaRecord[]>([]);
  const [status, setStatus] = useState<LevanaStatus | null>(null);

  useEffect(() => {
    (async () => {
      setHistory(await loadBrachaHistory());
      setLevanaHistory(await loadLevanaHistory());
      setStatus(levanaStatus(new Date()));
    })();
  }, []);

  const hd = new HDate(new Date());
  const saidLevana = status ? saidLevanaThisMonth(levanaHistory, status.window.hyear, status.window.hmonth) : false;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="ברכות מיוחדות" subtitle="עם מעקב מיקום ותזכורות" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* Quick-jump chips — same UX pattern as the siddur's "קפיצה מהירה". */}
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              📑 קפיצה מהירה
            </Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
              {[
                { id: 'levana', label: 'קידוש לבנה' },
                { id: 'yam', label: 'ברכות הים' },
                { id: 'ilanot', label: 'ברכת האילנות' },
                { id: 'chama', label: 'ברכת החמה' },
              ].map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/brachot/${c.id}` as any)}
                  style={styles.tocChip}
                >
                  <Text style={[typography.caption, { color: colors.primaryDark }]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card onPress={() => router.push('/brachot/levana' as any)} variant={status && !saidLevana && status.state.startsWith('in-window') ? 'primary' : 'default'}>
            <View style={styles.row}>
              <Icon name="moon" size={32} color={colors.primary} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    typography.h3,
                    { color: status && !saidLevana && status.state.startsWith('in-window') ? colors.textInverse : colors.textPrimary },
                  ]}
                >
                  קידוש לבנה
                </Text>
                <Text
                  style={[
                    typography.small,
                    {
                      color: status && !saidLevana && status.state.startsWith('in-window') ? colors.textInverse : colors.textMuted,
                      opacity: status && !saidLevana && status.state.startsWith('in-window') ? 0.9 : 1,
                      marginTop: 2,
                    },
                  ]}
                >
                  {!status
                    ? 'אין חלון פעיל החודש'
                    : status.state === 'before-window'
                    ? `החלון יפתח בעוד ${status.daysUntil} ימים`
                    : status.state === 'after-window'
                    ? `החלון נסגר לפני ${status.daysSince} ימים`
                    : saidLevana
                    ? '✓ ברכת הלבנה החודש'
                    : status.state === 'in-window-sefardi'
                    ? `מותר לפי הספרדים (יתחיל לאשכנזים בעוד ${status.daysUntilAshkenazi} ימים)`
                    : `נותרו ${status.daysLeft} ימים לחלון`}
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
            </View>
          </Card>

          <Card onPress={() => router.push('/brachot/yam' as any)}>
            <View style={styles.row}>
              <Icon name="water" size={32} color={colors.primary} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>ברכות הים</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                  ים הגדול, כינרת, ים המלח, ים סוף - מעקב מיקום
                </Text>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm }}>
                  {WATER_SITES.map((s) => {
                    const last = history[s.id];
                    const days = last ? Math.floor((Date.now() - last) / 86_400_000) : null;
                    const eligible = days === null || days >= s.intervalDays;
                    return (
                      <Pill
                        key={s.id}
                        label={
                          days === null
                            ? `${s.hebrewName} · טרם`
                            : eligible
                            ? `${s.hebrewName} · מותר`
                            : `${s.hebrewName} · עוד ${s.intervalDays - days}י׳`
                        }
                        tone={eligible ? 'success' : 'default'}
                      />
                    );
                  })}
                </View>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
            </View>
          </Card>

          <Card onPress={() => router.push('/brachot/ilanot' as any)}>
            <View style={styles.row}>
              <Icon name="fruit" size={32} color={colors.primary} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>ברכת האילנות</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                  פעם בשנה בחודש ניסן, על אילנות מלבלבים
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
            </View>
          </Card>

          <Card onPress={() => router.push('/brachot/chama' as any)}>
            <View style={styles.row}>
              <Icon name="sun" size={32} color={colors.primary} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>ברכת החמה</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                  אחת ל-28 שנים. הבאה: ה׳תשצ"ז (2037)
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
            </View>
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
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  tocChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
