import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import {
  BIUR_DATES_LAST_SHEMITA,
  KEDUSHA_RULES,
  OPTIONS_FOR_SHEMITA,
  isShemitaYear,
  nextShemita,
} from '../../src/data/shemita';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Tab = 'biur' | 'kedusha' | 'options';

export default function ShemitaScreen() {
  const router = useRouter();
  const hyear = new HDate(new Date()).getFullYear();
  const inShemita = isShemitaYear(hyear);
  const nextHyear = nextShemita(hyear);
  const yearsUntil = nextHyear - hyear;

  const [tab, setTab] = useState<Tab>('biur');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="שביעית" subtitle="מצוות התלויות בארץ" />

        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <Card variant={inShemita ? 'primary' : 'accent'}>
            {inShemita ? (
              <>
                <Text style={[typography.small, { color: colors.textInverse, opacity: 0.85 }]}>שנה נוכחית</Text>
                <Text style={[typography.h1, { color: colors.textInverse, marginTop: 2 }]}>
                  שנת שמיטה - {hebrewDateInfo(new Date()).yearHe}
                </Text>
              </>
            ) : (
              <>
                <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85 }]}>השמיטה הבאה</Text>
                <Text style={[typography.h2, { color: colors.primaryDark, marginTop: 2 }]}>
                  {hebrewDateInfo(new HDate(1, 7, nextHyear).greg()).yearHe} (עוד {yearsUntil} שנים)
                </Text>
              </>
            )}
          </Card>
        </View>

        <View style={styles.tabs}>
          <TabBtn label="לוח ביעור" active={tab === 'biur'} onPress={() => setTab('biur')} />
          <TabBtn label="קדושת שביעית" active={tab === 'kedusha'} onPress={() => setTab('kedusha')} />
          <TabBtn label="פתרונות" active={tab === 'options'} onPress={() => setTab('options')} />
        </View>

        {tab === 'biur' && (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md }}>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: 4 }]}>
              מועדי ביעור משוערים. עיין במכון התורה והארץ לעדכון מדויק לשנת השמיטה הנוכחית.
            </Text>
            {BIUR_DATES_LAST_SHEMITA.map((entry, i) => (
              <Card key={i}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{entry.category}</Text>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm }}>
                  {entry.examples.map((ex, j) => (
                    <Pill key={j} label={ex} tone="default" />
                  ))}
                </View>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing.md }}>
                  <Text style={[typography.body, { color: colors.primary }]}>{entry.approxDateHebrew}</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>{entry.approxDateGreg}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {tab === 'kedusha' && (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md }}>
            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}>
                7 כללי קדושת שביעית
              </Text>
              {KEDUSHA_RULES.map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={styles.ruleNum}>
                    <Text style={[typography.bodyBold, { color: colors.textInverse }]}>{i + 1}</Text>
                  </View>
                  <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>{rule}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {tab === 'options' && (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md }}>
            {OPTIONS_FOR_SHEMITA.map((opt, i) => (
              <Card key={i}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{opt.name}</Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                  {opt.description}
                </Text>
                <View style={{ marginTop: spacing.md, gap: 4 }}>
                  {opt.pros.map((p, j) => (
                    <View key={j} style={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'flex-start' }}>
                      <Text style={{ color: colors.success }}>+</Text>
                      <Text style={[typography.small, { color: colors.textSecondary, flex: 1 }]}>{p}</Text>
                    </View>
                  ))}
                  {opt.cons.map((c, j) => (
                    <View key={j} style={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'flex-start' }}>
                      <Text style={{ color: colors.warning }}>−</Text>
                      <Text style={[typography.small, { color: colors.textSecondary, flex: 1 }]}>{c}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[typography.bodyBold, { color: active ? colors.textInverse : colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  tabs: { flexDirection: 'row-reverse', paddingHorizontal: spacing.lg, gap: spacing.sm, flexWrap: 'wrap' },
  tabBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexGrow: 1,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  brachaWrap: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ruleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  ruleNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
