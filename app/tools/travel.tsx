import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useTravelDetection } from '../../src/hooks/useTravelDetection';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { TFILOT } from '../../src/data/tfilot';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/travel-prefs';

const TFILA_HADERECH = TFILOT.find((t) => t.id === 'tefilat-haderech')!.text;

export default function TravelScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useStoredJSON<{ enabled: boolean }>(KEY, { enabled: false });
  const { travelState, markSaid } = useTravelDetection(prefs.enabled);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="תפילת הדרך" subtitle="זיהוי אוטומטי לנסיעה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>זיהוי נסיעה אוטומטי</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                  בעת התרחקות מעל 12 ק"מ (3 פרסה) - תזכורת לומר תפילת הדרך.
                </Text>
              </View>
              <Switch
                value={prefs.enabled}
                onValueChange={(v) => setPrefs({ enabled: v })}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
          </Card>

          {travelState.state === 'permission-denied' && (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>
                הרשאת מיקום נדחתה. אישור בהגדרות המכשיר.
              </Text>
            </Card>
          )}

          {travelState.state === 'traveling' && travelState.shouldSay && (
            <Card variant="primary">
              <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>
                🚗 התרחקת {travelState.distanceKm.toFixed(1)} ק"מ
              </Text>
              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 4 }]}>
                זמן לומר תפילת הדרך
              </Text>
            </Card>
          )}

          {travelState.state === 'traveling' && !travelState.shouldSay && (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>
                אמרת תפילת הדרך לפני פחות מ-4 שעות - אין צורך לחזור.
              </Text>
            </Card>
          )}

          {travelState.state === 'stationary' && prefs.enabled && (
            <Card>
              <Text style={[typography.body, { color: colors.textMuted }]}>
                המיקום עוקב. תקבל הודעה כשתתרחק מספיק.
              </Text>
            </Card>
          )}

          <Card padding="xl">
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              נוסח תפילת הדרך
            </Text>
            <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 32 }]}>
              {TFILA_HADERECH}
            </Text>
          </Card>

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
            <Button label="✓ אמרתי" onPress={markSaid} fullWidth style={{ flex: 1 }} />
          </View>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הלכות בקיצור</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              <Text style={{ fontWeight: '700' }}>מתי</Text>: ביציאה מהעיר לדרך של 3 פרסה (כ-12 ק"מ).{'\n'}
              <Text style={{ fontWeight: '700' }}>איפה</Text>: אחרי שצאת מתחום העיר.{'\n'}
              <Text style={{ fontWeight: '700' }}>פעם אחת ביום</Text>: אם המשיכה הנסיעה למחרת - אומרים שוב.{'\n'}
              <Text style={{ fontWeight: '700' }}>שינה בדרך</Text>: אם ישנת בדרך, אומרים שוב כשמתחילים.
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
});
