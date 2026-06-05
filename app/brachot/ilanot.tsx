import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, months } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { getJSON, setJSON } from '../../src/storage/storage';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY_ILANOT = '@yahadut/ilanot-history';

const BRACHA = `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁלֹּא חִסַּר בְּעוֹלָמוֹ דָּבָר, וּבָרָא בוֹ בְּרִיּוֹת טוֹבוֹת וְאִילָנוֹת טוֹבוֹת, לֵיהָנוֹת בָּהֶם בְּנֵי אָדָם.`;

type IlanotRecord = { hyear: number; saidAt: number };

function nissanWindowFor(hyear: number): { start: HDate; end: HDate } {
  return { start: new HDate(1, months.NISAN, hyear), end: new HDate(30, months.NISAN, hyear) };
}

export default function IlanotScreen() {
  const router = useRouter();
  const now = new Date();
  const hd = new HDate(now);
  const inNissan = hd.getMonth() === months.NISAN;
  const window = nissanWindowFor(hd.getMonth() >= months.NISAN ? hd.getFullYear() : hd.getFullYear() - 1 || hd.getFullYear());

  const [history, setHistory] = useState<IlanotRecord[]>([]);
  useEffect(() => {
    (async () => setHistory(await getJSON<IlanotRecord[]>(KEY_ILANOT, [])))();
  }, []);

  const saidThisYear = history.some((r) => r.hyear === hd.getFullYear());

  async function mark() {
    const next = [...history.filter((r) => r.hyear !== hd.getFullYear()), { hyear: hd.getFullYear(), saidAt: Date.now() }];
    setHistory(next);
    await setJSON(KEY_ILANOT, next);
  }

  const daysUntilNissan = useMemo(() => {
    if (inNissan) return 0;
    const target = new HDate(1, months.NISAN, hd.getMonth() < months.NISAN ? hd.getFullYear() : hd.getFullYear() + 1);
    return target.abs() - hd.abs();
  }, [hd.abs(), inNissan]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="ברכת האילנות" subtitle="פעם בשנה בחודש ניסן" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant={inNissan && !saidThisYear ? 'primary' : 'accent'}>
            {inNissan ? (
              saidThisYear ? (
                <View>
                  <Text style={{ fontSize: 48, textAlign: 'center' }}>✓</Text>
                  <Text style={[typography.h2, { color: colors.primaryDark, textAlign: 'center', marginTop: spacing.sm }]}>
                    בירכת השנה
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={[typography.small, { color: colors.textInverse, opacity: 0.85 }]}>
                    חודש ניסן {hd.getFullYear()}
                  </Text>
                  <Text style={[typography.h1, { color: colors.textInverse, marginTop: 2 }]}>
                    החודש - זמן לברך
                  </Text>
                  <Text style={[typography.body, { color: colors.textInverse, opacity: 0.9, marginTop: spacing.sm }]}>
                    יש לצאת לראות שני אילני מאכל מלבלבים (נצים) ולברך
                  </Text>
                </View>
              )
            ) : (
              <View>
                <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85 }]}>החודש הבא</Text>
                <Text style={[typography.h2, { color: colors.primaryDark, marginTop: 2 }]}>
                  עוד {daysUntilNissan} ימים לחודש ניסן
                </Text>
              </View>
            )}
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
              <Text style={{ fontWeight: '700' }}>מתי</Text> - בחודש ניסן בלבד, פעם אחת בשנה.{'\n'}
              <Text style={{ fontWeight: '700' }}>מה רואים</Text> - שני אילני מאכל (לפחות), עם פרחים (נצים) שעתידים להניב פירות.{'\n'}
              <Text style={{ fontWeight: '700' }}>מי</Text> - גם נשים יכולות לברך.{'\n'}
              <Text style={{ fontWeight: '700' }}>בשבת</Text> - יש מקילים, ויש מחמירים בעיקר מחשש לבצירה.{'\n'}
              <Text style={{ fontWeight: '700' }}>אילנות נוי</Text> - לא מברכים על שאינם עץ מאכל.
            </Text>
          </Card>

          {inNissan && !saidThisYear && (
            <Button label="✓ בירכתי השנה" onPress={mark} fullWidth />
          )}
          {saidThisYear && (
            <Pill label={`בירכת ב-${new Date(history.find((r) => r.hyear === hd.getFullYear())!.saidAt).toLocaleDateString('he-IL')}`} tone="success" />
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
  brachaWrap: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
