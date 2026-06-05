import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { getTekufaHoursBefore, setTekufaHoursBefore } from '../../src/services/tekufaNotifications';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { computeTekufot } from '../../src/data/tekufot';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

function bothDates(d: Date): string {
  const heb = hebrewDateInfo(d);
  const greg = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${heb.gematria} · ${greg}`;
}

export default function TekufotScreen() {
  const router = useRouter();
  const now = new Date();
  const [hoursBefore, setHB] = useState<number>(24);

  useEffect(() => { getTekufaHoursBefore().then(setHB); }, []);

  function pickHours() {
    const options = [
      { label: '6 שעות לפני', value: 6 },
      { label: '12 שעות לפני', value: 12 },
      { label: '24 שעות לפני', value: 24 },
      { label: '48 שעות לפני', value: 48 },
      { label: 'בטל התראות', value: 0 },
    ];
    Alert.alert(
      'התראה לפני תקופה',
      'מתי לקבל התראה לפני כל תקופה?',
      [
        ...options.map((o) => ({
          text: o.label,
          onPress: async () => {
            await setTekufaHoursBefore(o.value);
            setHB(o.value);
          },
        })),
        { text: 'בטל', style: 'cancel' as const },
      ],
    );
  }

  const tekufot = useMemo(() => {
    const thisYear = computeTekufot(now.getFullYear());
    const nextYear = computeTekufot(now.getFullYear() + 1);
    return [...thisYear, ...nextYear].filter((t) => t.start.getTime() >= now.getTime() - 365 * 86_400_000);
  }, [now.getFullYear()]);

  const current = [...tekufot].reverse().find((t) => t.start.getTime() <= now.getTime()) ?? tekufot[0];
  const next = tekufot.find((t) => t.start.getTime() > now.getTime());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="תקופות השנה" subtitle="4 תקופות + השפעה הלכתית" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* Notification reminder setting — onPress on Card itself so the
              entire glass tile is the hit target. The Pressable wrapper used
              to swallow the touch on web/Android. */}
          <Card onPress={pickHours}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>🔔 התראה לפני תקופה</Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  {hoursBefore > 0 ? `מקבל התראה ${hoursBefore} שעות לפני` : 'התראות כבויות'}
                </Text>
              </View>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>שנה ›</Text>
            </View>
          </Card>

          {/* "Current period" tile — was solid gold with dark text. Now glass
              with white/gold text so it's readable on the dark background. */}
          <Card variant="primary">
            <Text style={[typography.small, { color: colors.primary, opacity: 0.95 }]}>תקופה נוכחית</Text>
            <Text style={{ fontSize: 56 }}>{current.emoji}</Text>
            <Text style={[typography.display, { color: colors.textPrimary }]}>{current.name}</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>{current.meaning}</Text>
          </Card>

          {next && (
            <Card variant="accent">
              <Text style={[typography.small, { color: colors.primary, opacity: 0.95 }]}>תקופה הבאה</Text>
              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 2 }]}>{next.emoji} {next.name}</Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
                {bothDates(next.start)}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                עוד {Math.ceil((next.start.getTime() - now.getTime()) / 86_400_000)} ימים
              </Text>
            </Card>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>השפעה על תפילה</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>תקופת תשרי (סתיו)</Text>: ממוסף שמיני עצרת - מתחילים "משיב הרוח ומוריד הגשם".{'\n\n'}
              <Text style={{ fontWeight: '700' }}>בארץ ישראל</Text>: בז׳ חשון מבקשים גשם בעמידה ("ותן טל ומטר").{'\n\n'}
              <Text style={{ fontWeight: '700' }}>בחו"ל</Text>: 60 יום אחרי תקופת תשרי (≈4 דצמבר) מתחילים לבקש גשם.{'\n\n'}
              <Text style={{ fontWeight: '700' }}>תקופת ניסן</Text>: ממוסף יום א\' פסח - "מוריד הטל". אין יותר ברכת השנים בגשם.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>מים שנמצאו בתקופה</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              מנהג: בזמן מעבר תקופה (כל 3 חודשים), אסור לשתות מים ללא ברזל בתוכם. נהגו לשים מטבע / כלי ברזל / סכין במים בעת המעבר, כדי שלא ניזוקים.
              {'\n\n'}המעבר אורך 2 דקות לפני ואחרי הזמן המדויק.
            </Text>
          </Card>

          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>תקופות קרובות</Text>
          {tekufot.slice(0, 8).map((t) => (
            <Card key={t.start.toISOString()}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.md }}>
                <Text style={{ fontSize: 32 }}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{t.name}</Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{t.meaning}</Text>
                  <Text style={[typography.bodyBold, { color: colors.primary, marginTop: 4 }]}>
                    {bothDates(t.start)}
                  </Text>
                </View>
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
