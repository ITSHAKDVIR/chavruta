import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const CHAPTERS = [16, 32, 41, 42, 59, 77, 90, 105, 137, 150];

const INTRO = `התיקון הכללי - עשרה פרקי תהילים שגילה רבי נחמן מברסלב כתיקון לעוון פגם הברית. נאמרת בכוונה מיוחדת, ומועילה גם לרפואה, פרנסה והצלחה.`;

const TFILA_BEFORE = `יְהִי רָצוֹן מִלְּפָנֶיךָ ה׳ אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁבִּזְכוּת אֲמִירַת עֲשָׂרָה מִזְמוֹרֵי תְּהִלִּים הָאֵלּוּ, יִתְבַּטְּלוּ כָּל הַדִּינִים הַקָּשִׁים מֵעָלֵינוּ, וּתְבַטֵּל מֵעָלֵינוּ אֶת כָּל גְזֵרוֹת רָעוֹת, וְהַשְׁפַּע עָלֵינוּ שֶׁפַע טוֹב וּבְרָכָה.`;

export default function TikkunKlaliScreen() {
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
        <ScreenHeader title="תיקון הכללי" subtitle="10 פרקי תהילים של רבי נחמן" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85 }]}>{INTRO}</Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>תפילה לפני האמירה</Text>
            <View style={[styles.brachaBox]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{TFILA_BEFORE}</Text>
            </View>
          </Card>

          <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.md }]}>סדר הפרקים</Text>
          {CHAPTERS.map((n, i) => (
            <Pressable key={n} onPress={() => router.push(`/tehillim/${n}` as any)}>
              <Card>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <View style={styles.num}>
                    <Text style={[typography.h3, { color: colors.textInverse }]}>{hebrewNumeral(i + 1)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: colors.textPrimary }]}>פרק {hebrewNumeral(n)}</Text>
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>תהילים</Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
                </View>
              </Card>
            </Pressable>
          ))}

          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
            לחיצה על פרק תוביל אותך לטקסט המלא (אם זמין מקומית).
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  num: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brachaBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
