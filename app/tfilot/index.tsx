import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { TFILOT } from '../../src/data/tfilot';
import { colors, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function TfilotIndex() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="תפילות יומיות" subtitle="טקסטים מנוקדים לכל שעות היום" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* Hide Birkat HaMazon entries here — the canonical entry point is the
              Siddur quick links (and the Chuppah tool for sheva brachot), so we
              don't want it duplicated in this short-tfilot listing. */}
          {TFILOT.filter((t) => !t.id.startsWith('birkat-hamazon')).map((t) => (
            <Card key={t.id} onPress={() => router.push(`/tfilot/${t.id}` as any)}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                <Text style={{ fontSize: 32 }}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{t.title}</Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{t.when}</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
});
