import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { ARBA_MINIM_GUIDE, MinSection } from '../../src/data/arbaaMinim';
import { HolidayCountdown } from '../../src/components/HolidayCountdown';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/arba-minim-checks';
type Checks = Record<string, boolean>;

export default function ArbaMinimScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const [active, setActive] = useState<string>('etrog');
  const [checks, setChecks] = useStoredJSON<Checks>(KEY, {});

  const section = ARBA_MINIM_GUIDE.find((s) => s.id === active)!;

  function toggle(key: string) {
    setChecks((c) => ({ ...c, [key]: !c[key] }));
  }

  function reset() {
    setChecks({});
  }

  const sectionChecks = section.categories.flatMap((cat) =>
    cat.checks.map((_, i) => `${section.id}-${cat.id}-${i}`),
  );
  const passedCount = sectionChecks.filter((k) => checks[k]).length;
  const totalCount = sectionChecks.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <Pressable onPress={reset} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>איפוס</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="בדיקת ארבעת המינים" subtitle="מדריך מלא - לפי מין" />

        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <HolidayCountdown holiday="sukkot" inIsrael={inIsrael} />
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <Pressable onPress={() => router.push('/tools/netilat-arba-minim' as any)} style={styles.linkBox}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>← לסדר נטילת ארבעת המינים (לשם יחוד, ברכות, ניענוע)</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {ARBA_MINIM_GUIDE.map((m) => (
            <Pressable key={m.id} onPress={() => setActive(m.id)} style={[styles.tab, active === m.id && styles.tabActive]}>
              <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
              <Text style={[typography.caption, { color: active === m.id ? colors.textInverse : colors.textPrimary, marginTop: 2 }]}>
                {m.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md }}>
          <Card variant="primary">
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
              <Text style={{ fontSize: 48 }}>{section.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h2, { color: colors.textPrimary }]}>{section.name}</Text>
                <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, marginTop: 2 }]}>
                  התקדמות: {passedCount} / {totalCount}
                </Text>
              </View>
            </View>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              {section.intro}
            </Text>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>דרישות יסוד</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              {section.basicRequirements}
            </Text>
          </Card>

          {section.categories.map((cat) => (
            <View key={cat.id}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 4, marginBottom: spacing.sm, marginTop: spacing.md }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{cat.title}</Text>
                <Pill
                  label={cat.level === 'pasul' ? 'קריטי' : cat.level === 'lechatchila' ? 'לכתחילה' : 'מהדרין'}
                  tone={cat.level === 'pasul' ? 'danger' : cat.level === 'lechatchila' ? 'warning' : 'success'}
                />
              </View>
              {cat.checks.map((check, i) => {
                const key = `${section.id}-${cat.id}-${i}`;
                const isDone = !!checks[key];
                return (
                  <Card key={key} style={{ marginBottom: spacing.sm }}>
                    <Pressable onPress={() => toggle(key)} style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.md }}>
                      <View style={[styles.cb, isDone && styles.cbDone]}>
                        {isDone && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{check.question}</Text>
                        <View style={{ marginTop: spacing.sm, gap: 4 }}>
                          <Text style={[typography.small, { color: colors.success }]}>✓ {check.passText}</Text>
                          <Text style={[typography.small, { color: colors.danger }]}>✗ {check.failText}</Text>
                        </View>
                        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' }]}>
                          💡 {check.explanation}
                        </Text>
                      </View>
                    </Pressable>
                  </Card>
                );
              })}
            </View>
          ))}

          <Card variant="accent">
            <Text style={[typography.h3, { color: colors.primaryDark }]}>טיפים</Text>
            <View style={{ marginTop: spacing.sm, gap: 6 }}>
              {section.tips.map((t, i) => (
                <View key={i} style={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'flex-start' }}>
                  <Text style={{ color: colors.primaryDark }}>•</Text>
                  <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, flex: 1 }]}>{t}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Button label="📷 שלח תמונה לרב לחוות דעת" onPress={() => router.push('/tools/photo-to-rabbi' as any)} variant="primary" fullWidth />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  tabs: { flexDirection: 'row-reverse', paddingHorizontal: spacing.lg, gap: spacing.sm, flexWrap: 'wrap' },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    flexGrow: 1,
    flexBasis: 70,
    minWidth: 70,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  cb: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 2,
  },
  cbDone: { backgroundColor: colors.success, borderColor: colors.success },
  linkBox: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
