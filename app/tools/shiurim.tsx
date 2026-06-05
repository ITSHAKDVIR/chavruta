import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { SHIURIM, CHAZAL_CALCULATIONS, ShiurEntry } from '../../src/data/shiurim';
import { fetchPrutaValues, getCachedPrutaValues, PrutaSnapshot } from '../../src/services/prutaApi';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const CATEGORIES = [
  { id: 'volume', label: 'נפח / משקל', emoji: '⚖️' },
  { id: 'length', label: 'אורך', emoji: '📏' },
  { id: 'time', label: 'זמן', emoji: '⏰' },
  { id: 'money', label: 'ממון', emoji: '💰' },
];

export default function ShiurimScreen() {
  const router = useRouter();
  const [cat, setCat] = useState<string>('volume');
  const filtered = SHIURIM.filter((s) => s.category === cat || (cat === 'volume' && s.category === 'weight'));
  // Live pruta values from pruta-silver.com — load cached snapshot
  // immediately, then refresh from the network in the background.
  const [pruta, setPruta] = useState<PrutaSnapshot | null>(null);
  const [prutaLoading, setPrutaLoading] = useState(false);
  useEffect(() => {
    (async () => {
      const cached = await getCachedPrutaValues();
      if (cached) setPruta(cached);
      setPrutaLoading(true);
      const live = await fetchPrutaValues();
      if (live) setPruta(live);
      setPrutaLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="שיעורי חז״ל" subtitle="כזית, רביעית, אמה, פרסה ועוד" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.id} onPress={() => setCat(c.id)} style={[styles.tab, cat === c.id && styles.tabActive]}>
                <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                <Text style={[typography.caption, { color: cat === c.id ? colors.textInverse : colors.textPrimary, marginRight: 4 }]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Live pruta panel — only shown on the "money" category. Values
              are pulled real-time from pruta-silver.com, with a stale
              cached value rendered first so the screen isn't empty. */}
          {cat === 'money' && (
            <Card variant="featured">
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[typography.bodyBold, { color: colors.primary }]}>שווי פרוטה - חי</Text>
                {prutaLoading && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
              {pruta ? (
                <>
                  <View style={[styles.opRow, styles.opRowBorder, { marginTop: spacing.sm }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.textPrimary }]}>פרוטה - מחיר בורסה</Text>
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        לפי מחיר הכסף בבורסה
                      </Text>
                    </View>
                    <Text style={[typography.h3, { color: colors.primary }]}>{pruta.prutaBursa} אגורות</Text>
                  </View>
                  <View style={[styles.opRow, styles.opRowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.textPrimary }]}>פרוטה - מחיר חנות</Text>
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        עם רווח קמעוני ומע״ם
                      </Text>
                    </View>
                    <Text style={[typography.h3, { color: colors.primary }]}>{pruta.prutaRetailer} אגורות</Text>
                  </View>
                  <View style={[styles.opRow, styles.opRowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.textPrimary }]}>פדיון הבן (101 גרם)</Text>
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        שיטה הרווחת
                      </Text>
                    </View>
                    <Text style={[typography.h3, { color: colors.primary }]}>{pruta.pidyonHaben101} ש״ח</Text>
                  </View>
                  <View style={styles.opRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.textPrimary }]}>פדיון הבן (96 גרם)</Text>
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        חזון איש
                      </Text>
                    </View>
                    <Text style={[typography.h3, { color: colors.primary }]}>{pruta.pidyonHaben96} ש״ח</Text>
                  </View>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' }]}>
                    עודכן {pruta.date} {pruta.time} · מקור: pruta-silver.com
                  </Text>
                </>
              ) : prutaLoading ? (
                <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
                  טוען נתונים...
                </Text>
              ) : (
                <Text style={[typography.small, { color: colors.warning, marginTop: spacing.sm }]}>
                  לא הצלחנו לטעון נתונים. בדוק חיבור לאינטרנט.
                </Text>
              )}
            </Card>
          )}

          {filtered.map((s) => (
            <ShiurCard key={s.id} shiur={s} />
          ))}

          {cat === 'volume' && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                החלת השיעורים על מצוות
              </Text>
              {CHAZAL_CALCULATIONS.map((c) => {
                const shiur = SHIURIM.find((s) => s.id === c.fromShiur)!;
                return (
                  <Card key={c.id} style={{ marginBottom: spacing.sm }}>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>{c.label}</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[typography.small, { color: colors.textMuted }]}>{shiur.name} × {c.multiplier}</Text>
                        <Text style={[typography.h3, { color: colors.primary, marginTop: 2 }]}>
                          {shiur.opinions[1] ? shiur.opinions[1].value * c.multiplier : shiur.opinions[0].value * c.multiplier} {shiur.opinions[1]?.unit ?? shiur.opinions[0].unit}
                        </Text>
                        <Text style={[typography.caption, { color: colors.textMuted }]}>
                          {shiur.opinions[1] ? shiur.opinions[1].authority : shiur.opinions[0].authority}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ShiurCard({ shiur }: { shiur: ShiurEntry }) {
  return (
    <Card>
      <Text style={[typography.h2, { color: colors.textPrimary }]}>{shiur.name}</Text>
      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{shiur.description}</Text>
      <Text style={[typography.caption, { color: colors.primary, marginTop: spacing.sm, fontStyle: 'italic' }]}>
        שימוש: {shiur.application}
      </Text>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {shiur.opinions.map((op, i) => (
          <View key={i} style={[styles.opRow, i < shiur.opinions.length - 1 && styles.opRowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{op.authority}</Text>
              {op.note ? <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{op.note}</Text> : null}
            </View>
            <Text style={[typography.h3, { color: colors.primary }]}>
              {op.value} {op.unit}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  tab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  opRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: spacing.xs },
  opRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
