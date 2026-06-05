import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { fetchSefariaText, refForCycle, sefariaUrlFor, SefariaText, cleanSefariaText, fetchSefariaCalendar } from '../../src/services/sefaria';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { getTodayLearning } from '../../src/data/learning';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function CycleReader() {
  const { cycle } = useLocalSearchParams<{ cycle: string }>();
  const router = useRouter();
  const cycleId = String(cycle);

  useEffect(() => {
    const dedicatedScreens: Record<string, string> = {
      shnayim: '/tools/shnayim',
      'tehillim-chodesh': '/tehillim',
      parsha: '/tools/parsha',
      'halacha-yomit-kosharot': '/learn/halacha-yomit-kosharot',
    };
    const dest = dedicatedScreens[cycleId];
    if (dest) router.replace(dest as any);
  }, [cycleId]);

  const [dayOffset, setDayOffset] = useState(0);
  const date = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const [text, setText] = useState<SefariaText | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const learning = useMemo(() => getTodayLearning(date).find((c) => c.id === cycleId), [date.toDateString(), cycleId]);
  const ref = useMemo(() => refForCycle(cycleId, date), [date.toDateString(), cycleId]);
  const [dynamicRef, setDynamicRef] = useState<string | null>(null);
  const externalUrl = useMemo(() => sefariaUrlFor(cycleId, date) ?? (dynamicRef ? `https://www.sefaria.org.il/${dynamicRef}?lang=he` : null), [date.toDateString(), cycleId, dynamicRef]);

  const SEFARIA_CYCLE_TO_EN: Record<string, string> = {
    'rambam-1': 'Daily Rambam',
    'rambam-3': 'Daily Rambam (3 Chapters)',
    'halacha-yomit': 'Halakhah Yomit',
    'arukh-hashulchan': 'Arukh HaShulchan Yomi',
    'tanya': 'Tanya Yomi',
    'tanach-929': '929',
    'daf-week': 'Daf a Week',
    'tanakh-yomi': 'Tanakh Yomi',
    'haftarah': 'Haftarah',
  };

  useEffect(() => {
    setText(null);
    setError(null);
    setLoading(true);
    setDynamicRef(null);

    async function load() {
      let effectiveRef = ref;
      if (!effectiveRef && SEFARIA_CYCLE_TO_EN[cycleId]) {
        const items = await fetchSefariaCalendar(date);
        const item = items.find((i) => i.titleEn === SEFARIA_CYCLE_TO_EN[cycleId]);
        if (item?.url) {
          effectiveRef = item.url;
          setDynamicRef(item.url);
        }
      }
      if (!effectiveRef) {
        setLoading(false);
        setError('הלימוד הזה לא זמין לקריאה במאגר');
        return;
      }
      try {
        const t = await fetchSefariaText(effectiveRef);
        if (!t || t.heText.length === 0) setError('הטקסט לא נטען. נסה את הקישור החיצוני.');
        else setText(t);
      } catch {
        setError('שגיאת תקשורת. אולי אין חיבור לאינטרנט.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ref, cycleId, date.toDateString()]);

  const hebrew = useMemo(() => hebrewDateInfo(date), [date.toDateString()]);
  const isToday = dayOffset === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        {externalUrl && (
          <Pressable onPress={() => Linking.openURL(externalUrl)} hitSlop={10}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>פתח ב-Sefaria ↗</Text>
          </Pressable>
        )}
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title={learning?.hebrewName ?? 'לימוד יומי'} subtitle={learning?.todayLabel} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
              <Pressable onPress={() => setDayOffset(dayOffset - 1)} style={styles.navBtn}>
                <Text style={[typography.h3, { color: colors.primary }]}>‹</Text>
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{hebrew.gematria}</Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  {date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                {!isToday && (
                  <Pressable onPress={() => setDayOffset(0)} style={{ marginTop: 4 }}>
                    <Text style={[typography.caption, { color: colors.primary }]}>← קפוץ להיום</Text>
                  </Pressable>
                )}
              </View>
              <Pressable onPress={() => setDayOffset(dayOffset + 1)} style={styles.navBtn}>
                <Text style={[typography.h3, { color: colors.primary }]}>›</Text>
              </Pressable>
            </View>
          </Card>

          {loading && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md }]}>טוען טקסט...</Text>
            </View>
          )}
          {error && (
            <Card>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{error}</Text>
              {externalUrl && (
                <View style={{ marginTop: spacing.md }}>
                  <Button label="פתח ב-Sefaria" onPress={() => Linking.openURL(externalUrl)} variant="primary" />
                </View>
              )}
            </Card>
          )}
          {text && (
            <Card padding="xl">
              <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.md }]}>
                {text.heRef || text.ref}
              </Text>
              {text.heText.map((para, i) => (
                <View key={i} style={[styles.para, i < text.heText.length - 1 && styles.paraBorder]}>
                  <Text style={[typography.sacred, { color: colors.textPrimary }]}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>({hebrewNumeral(i + 1)}) </Text>
                    {stripHTML(para)}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
            <Button label="‹ אתמול" onPress={() => setDayOffset(dayOffset - 1)} variant="secondary" style={{ flex: 1 }} fullWidth />
            <Button label="מחר ›" onPress={() => setDayOffset(dayOffset + 1)} variant="secondary" style={{ flex: 1 }} fullWidth />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const stripHTML = cleanSefariaText;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  navBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  para: { paddingVertical: spacing.sm },
  paraBorder: { borderBottomWidth: 1, borderBottomColor: '#F2EDE0' },
});
