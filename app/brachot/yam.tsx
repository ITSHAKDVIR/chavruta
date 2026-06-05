import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { WATER_SITES, nearestSite, daysSince } from '../../src/data/brachot';
import {
  loadBrachaHistory,
  loadBrachaPrefs,
  recordBracha,
  clearBracha,
  saveBrachaPrefs,
  BrachaHistory,
  BrachaPrefs,
} from '../../src/storage/brachot';
import { useWaterProximity } from '../../src/hooks/useWaterProximity';
import { presentNow } from '../../src/services/notifications';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function YamScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<BrachaHistory>({});
  const [prefs, setPrefs] = useState<BrachaPrefs | null>(null);
  const proximity = useWaterProximity(prefs?.geofencingEnabled ?? true);
  const [notified, setNotified] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setHistory(await loadBrachaHistory());
      setPrefs(await loadBrachaPrefs());
    })();
  }, []);

  useEffect(() => {
    if (proximity.state === 'tracking' && proximity.shouldRemind && !notified.has(proximity.site.id)) {
      presentNow({
        title: `${proximity.site.brachaShortName} - תזכורת`,
        body: `אתה ${proximity.distanceKm.toFixed(1)} ק"מ מ${proximity.site.hebrewName}. ניתן לברך.`,
        channelId: 'brachot',
      });
      setNotified((s) => new Set(s).add(proximity.site.id));
    }
  }, [proximity, notified]);

  async function markSaid(siteId: string) {
    const next = await recordBracha(siteId);
    setHistory(next);
  }
  async function reset(siteId: string) {
    Alert.alert('איפוס', 'לאפס את תאריך הברכה האחרון?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'אפס', style: 'destructive', onPress: async () => setHistory(await clearBracha(siteId)) },
    ]);
  }
  async function toggleGeofence(v: boolean) {
    if (!prefs) return;
    const next = { ...prefs, geofencingEnabled: v };
    setPrefs(next);
    await saveBrachaPrefs(next);
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
        <ScreenHeader title="ברכות הים" subtitle="עם מעקב מיקום אוטומטי" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant={proximity.state === 'tracking' && proximity.shouldRemind ? 'primary' : 'accent'}>
            {proximity.state === 'idle' && (
              <Text style={[typography.body, { color: colors.primaryDark }]}>המעקב כבוי. הפעל בהגדרות למטה.</Text>
            )}
            {proximity.state === 'permission-pending' && (
              <Text style={[typography.body, { color: colors.primaryDark }]}>מאתר מיקום...</Text>
            )}
            {proximity.state === 'permission-denied' && (
              <View>
                <Text style={[typography.h3, { color: colors.primaryDark }]}>גישה למיקום נדחתה</Text>
                <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: 4 }]}>
                  כדי לקבל תזכורת אוטומטית בקירבת ים, יש להפעיל הרשאת מיקום בהגדרות המכשיר.
                </Text>
              </View>
            )}
            {proximity.state === 'tracking' && (
              <View>
                <Text style={[typography.small, { color: proximity.shouldRemind ? colors.textInverse : colors.primaryDark, opacity: 0.85 }]}>
                  המקום הקרוב אליך
                </Text>
                <Text style={[typography.h1, { color: proximity.shouldRemind ? colors.textInverse : colors.primaryDark, marginTop: 2 }]}>
                  {proximity.site.hebrewName}
                </Text>
                <Text style={[typography.body, { color: proximity.shouldRemind ? colors.textInverse : colors.primaryDark, opacity: 0.9, marginTop: 4 }]}>
                  {proximity.distanceKm < 0.5
                    ? 'אתה בתוך האזור'
                    : `${proximity.distanceKm.toFixed(1)} ק"מ ממך`}
                  {proximity.lastSaidAt
                    ? ` · ברכת לפני ${daysSince(proximity.lastSaidAt)} ימים`
                    : ' · עוד לא ברכת'}
                </Text>
                {proximity.shouldRemind && (
                  <View style={{ marginTop: spacing.md }}>
                    <Pill label="מומלץ לברך עכשיו" tone="success" />
                  </View>
                )}
              </View>
            )}
            {proximity.state === 'error' && (
              <Text style={[typography.body, { color: colors.primaryDark }]}>שגיאת מיקום: {proximity.message}</Text>
            )}
          </Card>

          <Card>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>מעקב מיקום בזמן אמת</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                  כשפעיל - תקבל תזכורת כשתתקרב לים ועברו 30 יום.
                </Text>
              </View>
              <Switch
                value={prefs?.geofencingEnabled ?? false}
                onValueChange={toggleGeofence}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.surface}
              />
            </View>
          </Card>

          <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.md }]}>
            ימים ואגמים
          </Text>

          {WATER_SITES.map((site) => {
            const last = history[site.id];
            const days = daysSince(last);
            const eligible = days === null || days >= site.intervalDays;
            return (
              <Card key={site.id}>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: colors.textPrimary }]}>{site.hebrewName}</Text>
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{site.description}</Text>
                  </View>
                  <Pill
                    label={
                      days === null
                        ? 'טרם בירכת'
                        : eligible
                        ? `מותר (${days} ימים)`
                        : `עוד ${site.intervalDays - (days ?? 0)} ימים`
                    }
                    tone={eligible ? 'success' : 'default'}
                  />
                </View>

                <View style={[styles.brachaWrap, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[typography.sacred, { color: colors.textPrimary }]}>{site.brachaText}</Text>
                </View>

                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button
                    label="✓ בירכתי עכשיו"
                    onPress={() => markSaid(site.id)}
                    fullWidth
                    style={{ flex: 1 }}
                  />
                  {last && (
                    <Button label="איפוס" onPress={() => reset(site.id)} variant="ghost" />
                  )}
                </View>
              </Card>
            );
          })}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הלכה בקיצור</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              <Text style={{ fontWeight: '700' }}>הים הגדול</Text> (ים תיכון) - מברכים "שעשה את הים הגדול", פעם בשלושים יום.{'\n'}
              <Text style={{ fontWeight: '700' }}>שאר ימים</Text> (כינרת, ים המלח, ים סוף) - מברכים "עושה מעשה בראשית", פעם בשלושים יום.{'\n'}
              <Text style={{ fontWeight: '700' }}>תנאי</Text> - יש לראות את הים בעיניים (לא מהמטוס/מכונית כשלא רואים).
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
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
