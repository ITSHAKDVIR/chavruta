import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { SIDDUR } from '../../src/data/siddur';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function TfilonSection() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const section = SIDDUR.find((s) => s.id === String(id));
  const [activePart, setActivePart] = useState(0);

  if (!section) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="לא נמצא" />
      </SafeAreaView>
    );
  }

  const part = section.parts[activePart];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title={section.title} subtitle={`${activePart + 1} / ${section.parts.length} · ${part.name}`} />

        <View style={styles.tabs}>
          {section.parts.map((p, i) => (
            <Pressable key={i} onPress={() => setActivePart(i)} style={[styles.tab, activePart === i && styles.tabActive]}>
              <Text style={[typography.caption, { color: activePart === i ? colors.textInverse : colors.textPrimary }]}>{i + 1}</Text>
              <Text style={[typography.body, { color: activePart === i ? colors.textInverse : colors.textPrimary, marginRight: 4 }]}>{p.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md }}>
          <Card padding="xl">
            <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 36, fontSize: 21 }]}>
              {part.text}
            </Text>
          </Card>

          {part.note && (
            <Card variant="accent">
              <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85 }]}>
                💡 {part.note}
              </Text>
            </Card>
          )}

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
            {activePart > 0 && (
              <Pressable onPress={() => setActivePart(activePart - 1)} style={[styles.navBtn, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>‹ הקודם</Text>
              </Pressable>
            )}
            {activePart < section.parts.length - 1 && (
              <Pressable onPress={() => setActivePart(activePart + 1)} style={[styles.navBtn, { backgroundColor: colors.primary }]}>
                <Text style={[typography.bodyBold, { color: colors.textInverse }]}>הבא ›</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  tabs: { flexDirection: 'row-reverse', paddingHorizontal: spacing.lg, gap: spacing.sm, flexWrap: 'wrap' },
  tab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  navBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});
