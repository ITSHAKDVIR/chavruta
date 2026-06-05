import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const NEXT_CHAMA = new Date(2037, 3, 8);
const PREV_CHAMA = new Date(2009, 3, 8);

const BRACHA = `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם עוֹשֵׂה מַעֲשֵׂה בְרֵאשִׁית.`;

export default function ChamaScreen() {
  const router = useRouter();
  const now = new Date();
  const daysUntil = Math.floor((NEXT_CHAMA.getTime() - now.getTime()) / 86_400_000);
  const yearsUntil = (daysUntil / 365.25).toFixed(1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="ברכת החמה" subtitle="פעם בכ-28 שנים" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="primary">
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>ברכת החמה הבאה</Text>
            <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 4 }]}>
              {hebrewDateInfo(NEXT_CHAMA).gematria}
            </Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: 2 }]}>
              {NEXT_CHAMA.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, marginTop: spacing.sm }]}>
              עוד {daysUntil.toLocaleString('he-IL')} ימים ({yearsUntil} שנים)
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>נוסח הברכה</Text>
            <View style={[styles.brachaWrap]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הלכה בקיצור</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              <Text style={{ fontWeight: '700' }}>מתי</Text> - אחת ל-28 שנים, בערב יום רביעי שלפני ליל ניסן, כשהשמש חוזרת למקומה בבריאה.{'\n'}
              <Text style={{ fontWeight: '700' }}>שעה</Text> - בבוקר, מאחר נץ החמה ועד סוף שלוש שעות זמניות.{'\n'}
              <Text style={{ fontWeight: '700' }}>איפה</Text> - תחת כיפת השמים, רואים את השמש (גם אם דרך עננים קלים).{'\n'}
              <Text style={{ fontWeight: '700' }}>סדר</Text> - אומרים תהילים פרק קמ"ח, מזמור י"ט, הברכה, ואחריה "עלינו לשבח".{'\n'}
              <Text style={{ fontWeight: '700' }}>בשבת</Text> - אם חל בשבת, נדחה ליום ראשון.
            </Text>
          </Card>

          <Card variant="accent">
            <Text style={[typography.h3, { color: colors.primaryDark }]}>היסטוריה</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              הברכה האחרונה נאמרה ב-{PREV_CHAMA.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} (י"ד ניסן ה׳תשס"ט).{'\n\n'}
              הברכה לפניה: 1981, 1953, 1925, 1897, וכן הלאה.
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
  brachaWrap: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
