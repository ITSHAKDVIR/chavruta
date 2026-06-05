import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { useLocation } from '../../src/hooks/useLocation';
import { getInsertsForDate } from '../../src/data/tefilaInserts';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function TefilaTodayScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const now = new Date();
  const inserts = useMemo(() => getInsertsForDate(now, inIsrael), [now.toDateString(), inIsrael]);
  const hebrew = hebrewDateInfo(now);

  // Link to the in-app Siddur (not Sefaria webview). Drops the user at the
  // siddur landing where they can pick שחרית/מנחה/ערבית per their nusach.
  function openSiddur() {
    router.push('/tfilon' as any);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="תוספות לתפילה היום" subtitle={hebrew.gematria} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
              מחושב לפי התאריך העברי היום + המיקום ({inIsrael ? 'ארץ ישראל' : 'חו"ל'}).{'\n'}
              להלן תוספות שיש להוסיף בעמידה או בברכת המזון.
            </Text>
          </Card>

          {inserts.length === 0 ? (
            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center' }]}>
                ✓ אין תוספות מיוחדות היום
              </Text>
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
                התפילה הרגילה ללא תוספות תאריך. הזכרת טל/גשם פעילה לפי העונה.
              </Text>
            </Card>
          ) : (
            inserts.map((ins) => (
              <Card key={ins.id}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{ins.title}</Text>
                  <Pill label={ins.when} tone="primary" />
                </View>
                <Text style={[typography.small, { color: colors.primary, marginTop: 4 }]}>📍 {ins.location}</Text>
                <View style={styles.sacredBox}>
                  <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 30 }]}>{ins.text}</Text>
                </View>
              </Card>
            ))
          )}

          <Card variant="primary" onPress={openSiddur}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
              <Text style={{ fontSize: 32 }}>📖</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>סידור התפילה המלא</Text>
                <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.9, marginTop: 2 }]}>
                  פתח את הסידור באפליקציה לתפילה מלאה
                </Text>
              </View>
              <Text style={[typography.small, { color: colors.textPrimary }]}>‹</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              💡 התוספות לעיל הן הנפוצות. ההלכה המלאה תלויה במנהג. אם הסתפקת אם אמרת תוספת - השתמש בכלי "חזקה לטל וגשם" לחישוב חזקה (90 פעם).
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
  sacredBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
