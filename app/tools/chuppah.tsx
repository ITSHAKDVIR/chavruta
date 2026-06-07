import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { CHUPPAH_PREP, SHEVA_BRACHOT_TEXT } from '../../src/data/chuppah';
import { HDate, months } from '@hebcal/core';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const HEB_MONTHS = [
  { key: months.NISAN, name: 'ניסן' },
  { key: months.IYYAR, name: 'אייר' },
  { key: months.SIVAN, name: 'סיון' },
  { key: months.TAMUZ, name: 'תמוז' },
  { key: months.AV, name: 'אב' },
  { key: months.ELUL, name: 'אלול' },
  { key: months.TISHREI, name: 'תשרי' },
  { key: months.CHESHVAN, name: 'חשון' },
  { key: months.KISLEV, name: 'כסלו' },
  { key: months.TEVET, name: 'טבת' },
  { key: months.SHVAT, name: 'שבט' },
  { key: months.ADAR_I, name: 'אדר' },
  { key: months.ADAR_II, name: 'אדר ב׳' },
];

const KEY_DATE = '@yahadut/chuppah-date';
const KEY_DONE = '@yahadut/chuppah-done';

type HebDate = { day: number; month: number; year: number };

export default function ChuppahScreen() {
  const router = useRouter();
  const todayHd = new HDate(new Date());
  const [hebDate, setHebDate] = useStoredJSON<HebDate>(KEY_DATE, {
    day: 1,
    month: months.NISAN,
    year: todayHd.getFullYear() + 1,
  });
  const [done, setDone] = useStoredJSON<Record<string, boolean>>(KEY_DONE, {});
  const [tab, setTab] = useState<'prep' | 'brachot'>('prep');

  const weddingGreg = useMemo(() => {
    try {
      return new HDate(hebDate.day, hebDate.month, hebDate.year).greg();
    } catch {
      return null;
    }
  }, [hebDate.day, hebDate.month, hebDate.year]);

  const daysToWedding = useMemo(() => {
    if (!weddingGreg) return null;
    return Math.ceil((weddingGreg.getTime() - Date.now()) / 86_400_000);
  }, [weddingGreg]);

  const yearsList = Array.from({ length: 5 }, (_, i) => todayHd.getFullYear() + i);
  const daysList = Array.from({ length: 30 }, (_, i) => i + 1);

  function toggle(id: string) {
    setDone((d) => ({ ...d, [id]: !d[id] }));
  }

  const allItems = CHUPPAH_PREP.flatMap((c) => c.items.map((i) => i.id));
  const completed = allItems.filter((id) => done[id]).length;
  const percent = allItems.length > 0 ? Math.round((completed / allItems.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="הכנות לחופה" subtitle={`${completed} / ${allItems.length} (${percent}%)`} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant={daysToWedding !== null && daysToWedding < 0 ? 'accent' : 'primary'}>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>תאריך החתונה (עברי):</Text>

            <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.85, marginTop: spacing.sm, marginBottom: 4 }]}>יום:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row-reverse', gap: 4 }}>
                {daysList.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setHebDate({ ...hebDate, day: d })}
                    style={[styles.pickChip, hebDate.day === d && styles.pickChipActive]}
                  >
                    <Text style={[typography.caption, { color: hebDate.day === d ? colors.textInverse : colors.textPrimary, fontWeight: '700' }]}>
                      {hebrewNumeral(d)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.85, marginTop: spacing.sm, marginBottom: 4 }]}>חודש:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
              {HEB_MONTHS.map((m) => (
                <Pressable
                  key={m.key}
                  onPress={() => setHebDate({ ...hebDate, month: m.key })}
                  style={[styles.pickChip, hebDate.month === m.key && styles.pickChipActive]}
                >
                  <Text style={[typography.caption, { color: hebDate.month === m.key ? colors.textInverse : colors.textPrimary, fontWeight: '700' }]}>
                    {m.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.85, marginTop: spacing.sm, marginBottom: 4 }]}>שנה:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
              {yearsList.map((y) => (
                <Pressable
                  key={y}
                  onPress={() => setHebDate({ ...hebDate, year: y })}
                  style={[styles.pickChip, hebDate.year === y && styles.pickChipActive]}
                >
                  <Text style={[typography.caption, { color: hebDate.year === y ? colors.textInverse : colors.textPrimary, fontWeight: '700' }]}>
                    {hebrewDateInfo(new HDate(1, months.TISHREI, y).greg()).yearHe}
                  </Text>
                </Pressable>
              ))}
            </View>

            {daysToWedding !== null && (
              <Text style={[typography.h2, { color: colors.primary, marginTop: spacing.md }]}>
                {daysToWedding > 0 ? `עוד ${daysToWedding} ימים 💒` : daysToWedding === 0 ? '💒 היום!' : `${-daysToWedding} ימים אחרי החתונה`}
              </Text>
            )}
            {weddingGreg && (
              <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.9, marginTop: 4 }]}>
                {weddingGreg.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
          </Card>

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
            <Pressable onPress={() => setTab('prep')} style={[styles.tab, tab === 'prep' && styles.tabActive]}>
              <Text style={[typography.bodyBold, { color: tab === 'prep' ? colors.textInverse : colors.textPrimary }]}>הכנות</Text>
            </Pressable>
            <Pressable onPress={() => setTab('brachot')} style={[styles.tab, tab === 'brachot' && styles.tabActive]}>
              <Text style={[typography.bodyBold, { color: tab === 'brachot' ? colors.textInverse : colors.textPrimary }]}>7 ברכות</Text>
            </Pressable>
          </View>

          {tab === 'prep' && CHUPPAH_PREP.map((cat) => {
            const catDone = cat.items.filter((i) => done[i.id]).length;
            return (
              <View key={cat.id}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm }}>
                  <Text style={{ fontSize: 28 }}>{cat.emoji}</Text>
                  <Text style={[typography.h3, { color: colors.textPrimary, flex: 1 }]}>{cat.title}</Text>
                  <Pill label={`${catDone}/${cat.items.length}`} tone={catDone === cat.items.length ? 'success' : 'default'} />
                  {cat.daysBefore !== undefined && cat.daysBefore > 0 && (
                    <Pill label={`-${cat.daysBefore}י׳`} tone="default" />
                  )}
                </View>
                {cat.items.map((item) => {
                  const isDone = !!done[item.id];
                  return (
                    <Pressable key={item.id} onPress={() => toggle(item.id)} style={styles.row}>
                      <View style={[styles.cb, isDone && styles.cbDone]}>
                        {isDone && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.body, { color: colors.textPrimary, textDecorationLine: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }]}>
                          {item.label}
                        </Text>
                        {item.note && (
                          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{item.note}</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}

          {tab === 'brachot' && (
            <>
              <Card padding="xl">
                <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.md, textAlign: 'center' }]}>
                  שבע ברכות
                </Text>
                <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 32 }]}>
                  {SHEVA_BRACHOT_TEXT}
                </Text>
              </Card>
              <Card variant="accent" onPress={() => router.push('/tfilot/birkat-hamazon-sheva-brachot' as any)}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ fontSize: 28 }}>💒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>ברה"מ לסעודת שבע ברכות</Text>
                    <Text style={[typography.small, { color: colors.textPrimary, marginTop: 2 }]}>
                      ברכת המזון המלאה + זימון מיוחד + שבע הברכות בסוף
                    </Text>
                  </View>
                  <Text style={{ color: colors.primaryDark, fontSize: 18 }}>‹</Text>
                </View>
              </Card>
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
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    textAlign: 'right',
  },
  pickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 36,
    alignItems: 'center',
  },
  pickChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  cb: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 2,
  },
  cbDone: { backgroundColor: colors.success, borderColor: colors.success },
});
