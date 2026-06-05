import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chapterListing, tehillimForDay } from '../../src/data/tehillim';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function TehillimIndex() {
  const router = useRouter();
  const chapters = chapterListing();
  const today = new Date();
  const dayOfMonth = today.getDate();
  const todays = tehillimForDay(dayOfMonth);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/tehillim/groups' as any)} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>👥 קבוצה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader
          title="ספר תהילים"
          subtitle={`היום: ${todays.length ? 'פרקים ' + todays.map((n) => hebrewNumeral(n)).join('-') : 'כפי המנהג'}`}
        />

        <View style={{ paddingHorizontal: spacing.lg }}>
          <Card variant="accent">
            <Text style={[typography.small, { color: colors.primaryDark }]}>תהילים לפי יום בחודש</Text>
            <Text style={[typography.h2, { color: colors.primaryDark, marginTop: 2 }]}>
              יום {hebrewNumeral(dayOfMonth)} - פרקים {todays.length > 0 ? `${hebrewNumeral(todays[0])} - ${hebrewNumeral(todays[todays.length - 1])}` : 'הלל הגדול'}
            </Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm }}>
              {todays.slice(0, 8).map((n) => (
                <Pressable key={n} onPress={() => router.push(`/tehillim/${n}` as any)}>
                  <Pill label={hebrewNumeral(n)} tone="primary" />
                </Pressable>
              ))}
              {todays.length > 8 ? <Pill label={`+${hebrewNumeral(todays.length - 8)}`} tone="default" /> : null}
            </View>
          </Card>
        </View>

        <Text style={[typography.h2, styles.heading]}>כל הפרקים</Text>
        <View style={styles.grid}>
          {chapters.map((c) => (
            <Pressable
              key={c.num}
              onPress={() => c.available && router.push(`/tehillim/${c.num}` as any)}
              style={[styles.chapterCell, !c.available && { opacity: 0.4 }]}
            >
              <Text style={[typography.h3, { color: colors.textPrimary }]}>{c.hebrew}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[typography.small, styles.note]}>
          *בגרסה זו זמינים פרקים נבחרים. הפרקים החסרים יושלמו בעדכון הבא.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  heading: {
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  chapterCell: {
    width: '15%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
