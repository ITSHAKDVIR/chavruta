import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/lashon-hara';

type Record = { date: string; clean: boolean; lapses: number; notes?: string };

const TIPS = [
  'לפני שאתה מדבר על מישהו - שאל את עצמך: 1) האם זה אמת? 2) האם זה מועיל? 3) האם הוא היה מסכים שיאמרו זאת עליו?',
  'גם הקשבה ללשון הרע אסורה. הסתלק מהשיחה.',
  '"חַי אֲנִי, נְאֻם ה׳... אִם לֹא נוֹסְפוּ עָוֹנוֹתָיו, וְעַל הַרְבֵּה גְזֵרוֹת הוּא מַעֲלֶה" - על הקשבה ללשון הרע.',
  '"הַחַיִּים וְהַמָּוֶת בְּיַד לָשׁוֹן" (משלי יח, כא).',
  'מי שמספר לשון הרע - "כאילו הרג שלושה: האומרו, המקבלו, והנאמר עליו".',
  'תועלת ההפסקה - מהפיך לבעלי לשון הרע יכולים לדבר רק על עצמם, וזה מקרב לאהבת השם.',
];

export default function LashonHaRaScreen() {
  const router = useRouter();
  const [records, setRecords] = useStoredJSON<Record[]>(KEY, []);
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = records.find((r) => r.date === todayStr);

  function markClean() {
    setRecords((arr) => {
      const filtered = arr.filter((r) => r.date !== todayStr);
      return [...filtered, { date: todayStr, clean: true, lapses: 0 }];
    });
  }

  function markLapse() {
    setRecords((arr) => {
      const existing = arr.find((r) => r.date === todayStr);
      const filtered = arr.filter((r) => r.date !== todayStr);
      return [...filtered, { date: todayStr, clean: false, lapses: (existing?.lapses ?? 0) + 1 }];
    });
  }

  function resetToday() {
    setRecords((arr) => arr.filter((r) => r.date !== todayStr));
  }

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const cleanDays = sorted.filter((r) => r.clean).length;
  const totalLapses = sorted.reduce((sum, r) => sum + r.lapses, 0);
  let streak = 0;
  for (const r of sorted) {
    if (r.clean) streak++;
    else break;
  }
  const tipOfDay = TIPS[new Date().getDay() % TIPS.length];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="שמירת הלשון" subtitle="מעקב יומי + תזכורת" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="primary">
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>סטטיסטיקה</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.md, marginTop: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 36, fontWeight: '700', color: colors.textPrimary }}>{streak}</Text>
                <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.85 }]}>רצף ימים</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 36, fontWeight: '700', color: colors.textPrimary }}>{cleanDays}</Text>
                <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.85 }]}>סה"כ ימים נקיים</Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              היום ({hebrewDateInfo(new Date()).gematria}):
            </Text>
            {today ? (
              <View>
                {today.clean ? (
                  <Pill label="✓ יום נקי" tone="success" />
                ) : (
                  <Pill label={`${today.lapses} מעידות היום`} tone="warning" />
                )}
                <View style={{ marginTop: spacing.sm }}>
                  <Pressable onPress={resetToday}>
                    <Text style={[typography.caption, { color: colors.danger }]}>איפוס</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
                <Button label="✓ נשמרתי היום" onPress={markClean} variant="primary" style={{ flex: 1 }} fullWidth />
                <Button label="😔 מעדתי" onPress={markLapse} variant="secondary" style={{ flex: 1 }} fullWidth />
              </View>
            )}
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>💡 טיפ היום</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              {tipOfDay}
            </Text>
          </Card>

          {sorted.length > 1 && (
            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                7 ימים אחרונים
              </Text>
              {sorted.slice(0, 7).map((r) => (
                <View key={r.date} style={styles.row}>
                  <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                    {hebrewDateInfo(new Date(r.date)).gematria}
                  </Text>
                  {r.clean ? <Pill label="נקי" tone="success" /> : <Pill label={`${r.lapses} מעידות`} tone="warning" />}
                </View>
              ))}
            </Card>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
