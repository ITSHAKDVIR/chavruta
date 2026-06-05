import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getTodayLearning, fetchSefariaCycles, LearnedEntry, LearningCycle, HALACHA_BOOKS, entryKey, todayISO } from '../../src/data/learning';
import { Linking } from 'react-native';
import { sefariaUrlFor } from '../../src/services/sefaria';
import { getJSON, Keys, setJSON } from '../../src/storage/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { BrandBar } from '../../src/components/BrandBar';
import { Icon } from '../../src/components/Icon';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Stats = {
  streakDays: number;
  totalSessions: number;
  byCycle: Record<string, number>;
};

function computeStats(history: LearnedEntry[]): Stats {
  const byCycle: Record<string, number> = {};
  const days = new Set<string>();
  for (const e of history) {
    byCycle[e.cycleId] = (byCycle[e.cycleId] ?? 0) + 1;
    days.add(e.dateISO);
  }
  const sortedDays = Array.from(days).sort().reverse();
  let streak = 0;
  const today = todayISO();
  const yesterday = todayISO(new Date(Date.now() - 86_400_000));
  if (sortedDays[0] === today || sortedDays[0] === yesterday) {
    streak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const cur = new Date(sortedDays[i]);
      const diff = Math.round((prev.getTime() - cur.getTime()) / 86_400_000);
      if (diff === 1) streak++;
      else break;
    }
  }
  return { streakDays: streak, totalSessions: history.length, byCycle };
}

export default function LearnScreen() {
  const router = useRouter();
  const today = new Date();
  const todayKey = todayISO(today);
  const localCycles = useMemo(() => getTodayLearning(today), [todayKey]);
  const [extendedCycles, setExtendedCycles] = useState<LearningCycle[]>([]);
  const cycles = useMemo(() => [...localCycles, ...extendedCycles], [localCycles, extendedCycles]);
  const [history, setHistory] = useState<LearnedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const h = await getJSON<LearnedEntry[]>(Keys.learnedHistory, []);
      const extra = await fetchSefariaCycles(today);
      if (mounted) {
        setHistory(h);
        setExtendedCycles(extra);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => computeStats(history), [history]);
  const learnedToday = useMemo(() => {
    const set = new Set<string>();
    for (const e of history) {
      if (e.dateISO === todayKey) set.add(e.cycleId);
    }
    return set;
  }, [history, todayKey]);

  async function toggle(cycleId: string, label: string) {
    const key = entryKey(cycleId, todayKey);
    const exists = history.find((e) => entryKey(e.cycleId, e.dateISO) === key);
    let next: LearnedEntry[];
    if (exists) {
      next = history.filter((e) => entryKey(e.cycleId, e.dateISO) !== key);
    } else {
      next = [...history, { cycleId, dateISO: todayKey, label }];
    }
    setHistory(next);
    await setJSON(Keys.learnedHistory, next);
  }

  async function resetHistory() {
    Alert.alert('איפוס היסטוריה', 'האם לאפס את כל מעקב הלימוד?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'אפס',
        style: 'destructive',
        onPress: async () => {
          setHistory([]);
          await setJSON(Keys.learnedHistory, []);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="לימוד יומי" subtitle="סמן מה למדת היום ובנה שגרת לימוד" />

        <View style={styles.statsRow}>
          <StatCard label="ימי רצף" value={stats.streakDays} iconName="flame" />
          <StatCard label="סך לימודים" value={stats.totalSessions} iconName="library" />
          <StatCard label="היום" value={learnedToday.size} iconName="checkCircle" />
        </View>

        <View style={styles.list}>
          {loading ? (
            <Text style={[typography.body, { color: colors.textMuted, padding: spacing.lg }]}>טוען...</Text>
          ) : (
            <>
              {cycles.filter((c) => !c.externalOnly).map((c) => {
                const done = learnedToday.has(c.id);
                return (
                  <Card key={c.id} style={styles.cycleCard}>
                    <View style={styles.cycleRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
                          <Text style={[typography.h3, { color: colors.textPrimary }]}>{c.hebrewName}</Text>
                          {done ? <Pill label="הושלם" tone="success" /> : null}
                        </View>
                        <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                          {c.description}
                        </Text>
                        <Text style={[typography.body, { color: colors.primary, marginTop: spacing.sm }]}>
                          {c.todayLabel}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                      <Button
                        label="📖 קרא"
                        onPress={() => router.push(`/learn/${c.id}` as any)}
                        variant="secondary"
                        style={{ flex: 1 }}
                        fullWidth
                      />
                      <Button
                        label={done ? '✓ נלמד' : 'סמן'}
                        onPress={() => toggle(c.id, c.todayLabel)}
                        variant={done ? 'secondary' : 'primary'}
                        style={{ flex: 1 }}
                        fullWidth
                      />
                    </View>
                  </Card>
                );
              })}

              <View style={{ marginTop: spacing.xl }}>
                <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  ספרי הלכה לעיון
                </Text>
                <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md }]}>
                  עיון חופשי בספרי הלכה - לחיצה תפתח את הספר באתר ספריא
                </Text>
                {HALACHA_BOOKS.map((b) => (
                  <Card
                    key={b.id}
                    style={styles.cycleCard}
                    onPress={() => router.push(`/browse?url=${encodeURIComponent(b.url)}&title=${encodeURIComponent(b.hebrewName)}` as any)}
                  >
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.h3, { color: colors.textPrimary }]}>{b.hebrewName}</Text>
                        <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                          {b.author} · {b.description}
                        </Text>
                      </View>
                      <Text style={[typography.small, { color: colors.primary }]}>↗</Text>
                    </View>
                  </Card>
                ))}
              </View>

              {cycles.filter((c) => c.externalOnly).length > 0 && (
                <View style={{ marginTop: spacing.xl }}>
                  <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                    לימודים יומיים נוספים באתר ספריא
                  </Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md }]}>
                    לימודים שאינם זמינים לקריאה ישירה - לחיצה תפתח את הטקסט באתר ספריא
                  </Text>
                  {cycles.filter((c) => c.externalOnly).map((c) => {
                    const done = learnedToday.has(c.id);
                    const url = c.externalUrl ?? sefariaUrlFor(c.id);
                    return (
                      <Card
                        key={c.id}
                        style={styles.cycleCard}
                        onPress={url ? () => router.push(`/browse?url=${encodeURIComponent(url)}&title=${encodeURIComponent(c.hebrewName)}` as any) : undefined}
                      >
                        <View style={styles.cycleRow}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
                              <Text style={[typography.h3, { color: colors.textPrimary }]}>{c.hebrewName}</Text>
                              {done ? <Pill label="הושלם" tone="success" /> : null}
                              <View style={{ flex: 1 }} />
                              <Text style={[typography.small, { color: colors.primary }]}>↗</Text>
                            </View>
                            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                              {c.description}
                            </Text>
                            <Text style={[typography.body, { color: colors.primary, marginTop: spacing.sm }]}>
                              {c.todayLabel}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Button label="איפוס היסטוריה" onPress={resetHistory} variant="ghost" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, iconName }: { label: string; value: number; iconName: string }) {
  return (
    <View style={styles.statCard}>
      <Icon name={iconName as any} size={24} color={colors.primary} strokeWidth={1.5} />
      <Text style={[typography.h1, { color: colors.primary, marginTop: 4 }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xl },
  statsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
  cycleCard: { marginBottom: spacing.md },
  cycleRow: { flexDirection: 'row-reverse', alignItems: 'flex-start' },
});
