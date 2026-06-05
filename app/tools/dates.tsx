import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, months } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function DatesScreen() {
  const router = useRouter();
  const [gregInput, setGregInput] = useState(new Date().toISOString().slice(0, 10));

  const result = useMemo(() => {
    try {
      const d = new Date(gregInput);
      if (isNaN(d.getTime())) return null;
      return hebrewDateInfo(d);
    } catch {
      return null;
    }
  }, [gregInput]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="המרת תאריכים" subtitle="לועזי ↔ עברי" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>תאריך לועזי (YYYY-MM-DD):</Text>
            <TextInput
              value={gregInput}
              onChangeText={setGregInput}
              placeholder="2026-05-26"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </Card>

          {result && (
            <Card variant="primary">
              <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>תאריך עברי</Text>
              <Text style={[typography.display, { color: colors.textPrimary, marginTop: 4 }]}>
                {result.gematria}
              </Text>
              <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
                {result.weekdayName}, {result.monthName} {result.year}
              </Text>
            </Card>
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
});
