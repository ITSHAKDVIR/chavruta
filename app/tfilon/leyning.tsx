/**
 * קריאת התורה לשני וחמישי — 3 עליות לפי החלוקה הרשמית של Hebcal.
 *
 * שני מקורות:
 *   - Hebcal API: מקבל את 3 העליות (כהן/לוי/ישראל) לפי הפרשה ההלכתית
 *     המעודכנת (כולל פרשיות כפולות, חגים, ר"ח).
 *   - Sefaria: שואב את הטקסט המדויק לכל עלייה לפי הטווח שmceClient Hebcal נתן.
 *
 * זמינות: בימי שני וחמישי בלבד. ביתר הימים — הודעה.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { useLocation } from '../../src/hooks/useLocation';
import { fetchMondayThursdayLeyning, aliyaToSefariaRef, WeekdayLeyning } from '../../src/services/hebcalLeyning';
import { findNextShabbatParshah } from '../../src/data/hebcal';
import { fetchSefariaText } from '../../src/services/sefaria';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const ALIYAH_LABELS = ['ראשון (כהן)', 'שני (לוי)', 'שלישי (ישראל)'];

/** Strip HTML tags (<b>, <i>, etc.) that Sefaria sometimes embeds. */
function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

type AliyaText = { ref: string; lines: string[]; loading: boolean; error?: boolean };

export default function MondayThursdayLeyning() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isMonOrThu = dayOfWeek === 1 || dayOfWeek === 4;
  const dayLabel = dayOfWeek === 1 ? 'יום שני' : dayOfWeek === 4 ? 'יום חמישי' : '';

  // Hebcal returns the English parsha name; we resolve to the Hebrew name
  // via Hebcal's local Sedra logic so the UI never shows English.
  const parshaHe = (() => {
    try { return findNextShabbatParshah(today, inIsrael)?.parshah ?? null; } catch { return null; }
  })();

  const [leyning, setLeyning] = useState<WeekdayLeyning | null>(null);
  const [aliyot, setAliyot] = useState<AliyaText[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState(false);

  // Step 1: fetch the aliyot ranges from Hebcal
  useEffect(() => {
    let cancelled = false;
    setLoadingMeta(true); setMetaError(false);
    fetchMondayThursdayLeyning(today, inIsrael).then((r) => {
      if (cancelled) return;
      if (!r) { setMetaError(true); setLeyning(null); }
      else setLeyning(r);
      setLoadingMeta(false);
    });
    return () => { cancelled = true; };
  }, [today.toDateString(), inIsrael]);

  // Step 2: when aliyot ranges arrive, fetch each aliya's text from Sefaria
  useEffect(() => {
    if (!leyning) { setAliyot([]); return; }
    let cancelled = false;
    setAliyot(leyning.aliyot.map((a) => ({ ref: aliyaToSefariaRef(a), lines: [], loading: true })));
    (async () => {
      const results = await Promise.all(leyning.aliyot.map(async (a): Promise<AliyaText> => {
        const ref = aliyaToSefariaRef(a);
        try {
          const t = await fetchSefariaText(ref);
          if (t && t.heText.length > 0) {
            return { ref, lines: t.heText.map(stripHtml), loading: false };
          }
          return { ref, lines: [], loading: false, error: true };
        } catch {
          return { ref, lines: [], loading: false, error: true };
        }
      }));
      if (!cancelled) setAliyot(results);
    })();
    return () => { cancelled = true; };
  }, [leyning?.parsha, leyning?.date]);

  if (!isMonOrThu) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <ScreenHeader title="קריאת התורה" subtitle="ימי שני וחמישי" />
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>
                אין קריאת התורה היום (יום {['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][dayOfWeek]}).
                {'\n'}קריאה זו מוצגת רק בימי שני וחמישי.
              </Text>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader
          title="קריאת התורה"
          subtitle={`${dayLabel}${parshaHe ? ` · פרשת ${parshaHe}` : ''}`}
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {loadingMeta ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : metaError || !leyning ? (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>
                לא ניתן לטעון את חלוקת העליות מ-Hebcal. ייתכן שאין חיבור לאינטרנט.
              </Text>
            </Card>
          ) : (
            <>
              <Card>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  📖 פרשת {parshaHe || leyning.parsha}
                </Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
                  3 עליות · חלוקה רשמית מ-Hebcal · טקסט מ-Sefaria
                </Text>
              </Card>

              {aliyot.map((al, i) => (
                <Card key={al.ref} padding="xl">
                  <View style={styles.aliyahHeader}>
                    <View style={styles.aliyahBadge}>
                      <Text style={[typography.caption, { color: colors.textInverse, fontWeight: '700' }]}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={[typography.h3, { color: colors.textPrimary, flex: 1 }]}>
                      {ALIYAH_LABELS[i]}
                    </Text>
                  </View>
                  {al.loading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : al.error ? (
                    <Text style={[typography.small, { color: colors.danger }]}>
                      לא ניתן לטעון את הטקסט.
                    </Text>
                  ) : (
                    al.lines.map((verse, j) => (
                      <Text key={j} style={[typography.sacred, styles.verseText]}>
                        {verse}
                      </Text>
                    ))
                  )}
                </Card>
              ))}
            </>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  aliyahHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  aliyahBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  verseText: {
    color: colors.textPrimary,
    marginVertical: 4,
    lineHeight: 28,
    textAlign: 'right',
  },
});
