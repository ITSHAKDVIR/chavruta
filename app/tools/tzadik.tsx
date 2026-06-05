import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Image, Linking, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { fetchWikiSummary, WikiSummary } from '../../src/services/wiki';
import { findTodaysYahrtzeitTzadikim, findUpcomingYahrtzeit, TzadikYahrtzeit } from '../../src/data/tzadikim';
import { hebrewDateInfo } from '../../src/data/hebcal';

/** Hebrew-grammar-correct "in X days" phrase. */
function hebrewDaysUntil(n: number): string {
  if (n === 0) return 'היום';
  if (n === 1) return 'מחר';
  if (n === 2) return 'מחרתיים';
  // 3-10: "בעוד N ימים". 11+: "בעוד N יום".
  if (n <= 10) return `בעוד ${n} ימים`;
  return `בעוד ${n} יום`;
}
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function TzadikScreen() {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const hd = useMemo(() => new HDate(now), [now]);

  const todaysTzadikim = useMemo(
    () => findTodaysYahrtzeitTzadikim(hd.getMonth(), hd.getDate()),
    [hd],
  );

  // אם יש יארצייט היום - נציג. אם אין - נראה את היארצייטים הקרובים מתוך 14 ימים.
  const upcoming = useMemo(() => findUpcomingYahrtzeit(hd, 30), [hd]);
  const upcomingExcludingToday = upcoming.filter((u) => u.daysUntil > 0);
  const hasToday = todaysTzadikim.length > 0;

  // הצדיק להציג בכרטיס הראשי: היום, או הקרוב ביותר
  const [selectedIndex, setSelectedIndex] = useState(0);
  const featured: TzadikYahrtzeit | null = hasToday
    ? todaysTzadikim[Math.min(selectedIndex, todaysTzadikim.length - 1)]
    : upcomingExcludingToday[0]?.tzadik ?? null;

  const [summary, setSummary] = useState<WikiSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!featured) {
      setLoading(false);
      setSummary(null);
      return;
    }
    setLoading(true);
    fetchWikiSummary(featured.wikiTitle).then((s) => {
      setSummary(s);
      setLoading(false);
    });
  }, [featured?.wikiTitle]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader
          title={hasToday ? 'יארצייט היום' : 'יארצייטים קרובים'}
          subtitle={
            hasToday
              ? `${todaysTzadikim.length} ${todaysTzadikim.length === 1 ? 'צדיק' : 'צדיקים'} · ${hebrewDateInfo(now).gematria}`
              : `יארצייט קרוב · ${hebrewDateInfo(now).gematria}`
          }
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* בורר את הצדיק להציג אם יש יותר מאחד היום */}
          {hasToday && todaysTzadikim.length > 1 && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                צדיקים שיארצייטם היום:
              </Text>
              <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
                {todaysTzadikim.map((t, i) => (
                  <Pressable
                    key={t.wikiTitle}
                    onPress={() => setSelectedIndex(i)}
                    style={[styles.tabChip, selectedIndex === i && styles.tabChipActive]}
                  >
                    <Text
                      style={[
                        typography.small,
                        { color: selectedIndex === i ? colors.textInverse : colors.textPrimary },
                      ]}
                    >
                      {t.displayName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          )}

          {featured ? (
            <>
              <Card variant={hasToday ? 'primary' : 'default'}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.md }}>
                  {summary?.thumbnail && (
                    <Image source={{ uri: summary.thumbnail }} style={styles.thumb} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        typography.small,
                        { color: hasToday ? colors.textInverse : colors.textMuted, opacity: 0.85 },
                      ]}
                    >
                      {hasToday ? '🕯️ יארצייט היום' : '🕯️ היארצייט הקרוב'}
                    </Text>
                    <Text
                      style={[
                        typography.h1,
                        { color: hasToday ? colors.textInverse : colors.textPrimary, marginTop: 2 },
                      ]}
                    >
                      {summary?.title ?? featured.displayName}
                    </Text>
                    {featured.era && (
                      <Text
                        style={[
                          typography.small,
                          { color: hasToday ? colors.textInverse : colors.textMuted, opacity: 0.85, marginTop: 4 },
                        ]}
                      >
                        {featured.era}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>

              <Card>
                {loading ? (
                  <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : summary ? (
                  <>
                    <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 26 }]}>
                      {summary.extract}
                    </Text>
                    <View style={{ marginTop: spacing.md }}>
                      <Button
                        label="קרא עוד בויקיפדיה ↗"
                        onPress={() => Linking.openURL(summary.contentUrl)}
                        variant="secondary"
                      />
                    </View>
                  </>
                ) : (
                  <Text style={[typography.body, { color: colors.textMuted }]}>
                    התוכן לא נטען. אולי אין חיבור לאינטרנט.
                  </Text>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <Text style={[typography.body, { color: colors.textMuted }]}>
                לא מצאנו יארצייט בשבועות הקרובים.
              </Text>
            </Card>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              יארצייטים קרובים (30 ימים הבאים)
            </Text>
            {upcomingExcludingToday.length === 0 ? (
              <Text style={[typography.body, { color: colors.textMuted }]}>
                אין יארצייטים קרובים במאגר.
              </Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {upcomingExcludingToday.slice(0, 12).map((u) => (
                  <View
                    key={`${u.tzadik.wikiTitle}-${u.daysUntil}`}
                    style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.textPrimary }]}>{u.tzadik.displayName}</Text>
                      {u.tzadik.era && (
                        <Text style={[typography.caption, { color: colors.textMuted }]}>{u.tzadik.era}</Text>
                      )}
                    </View>
                    <Pill
                      label={hebrewDaysUntil(u.daysUntil)}
                      tone={u.daysUntil <= 3 ? 'warning' : 'default'}
                    />
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
            תוכן ביוגרפי: Wikipedia בעברית (CC-BY-SA)
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
  thumb: { width: 80, height: 100, borderRadius: 8 },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
