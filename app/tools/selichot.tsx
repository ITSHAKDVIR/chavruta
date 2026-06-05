import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { getString, Keys } from '../../src/storage/storage';
import { useLocation } from '../../src/hooks/useLocation';
import { POLIN_DAYS, polinDayFor, sephardiSelichotActive, SelichotDayKey } from '../../src/data/selichotCalendar';
import { fetchSefariaText } from '../../src/services/sefaria';
import { parseParagraphs, activeTags, shouldRender, ParsedParagraph } from '../../src/services/siddurParser';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Nusach = 'polin' | 'edot-mizrach';

const NUSACH_LABEL: Record<Nusach, string> = {
  polin: 'אשכנז (פולין)',
  'edot-mizrach': 'עדות המזרח',
};

export default function SelichotScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';

  const [nusach, setNusach] = useState<Nusach>('polin');
  const [selectedDay, setSelectedDay] = useState<SelichotDayKey | null>(null);
  const [paragraphs, setParagraphs] = useState<ParsedParagraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Initialize: pick nusach from user's stored sephardi/ashkenazi preference, and today's day
  useEffect(() => {
    (async () => {
      const stored = await getString(Keys.nusach, 'ashkenazi');
      if (stored === 'sephardi' || stored === 'edot-mizrach') {
        setNusach('edot-mizrach');
      } else {
        setNusach('polin');
      }
      const today = polinDayFor(new Date(), inIsrael);
      setSelectedDay(today);
    })();
  }, [inIsrael]);

  // Determine which ref to fetch
  const refToFetch = useMemo((): string | null => {
    if (nusach === 'edot-mizrach') {
      // Edot HaMizrach selichot - single text
      return 'Selichot Edot HaMizrach.1-50';
    }
    if (!selectedDay) return null;
    const entry = POLIN_DAYS.find((d) => d.key === selectedDay);
    return entry?.ref ?? null;
  }, [nusach, selectedDay]);

  // Fetch text
  useEffect(() => {
    if (!refToFetch) {
      setParagraphs([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchSefariaText(refToFetch)
      .then((t) => {
        if (t && t.heText.length > 0) {
          setParagraphs(parseParagraphs(t.heText));
        } else {
          setError('הטקסט לא נטען. בדוק חיבור.');
        }
      })
      .catch(() => setError('שגיאת רשת'))
      .finally(() => setLoading(false));
  }, [refToFetch]);

  const active = useMemo(() => activeTags(new Date(), inIsrael), [inIsrael]);

  const todayPolin = polinDayFor(new Date(), inIsrael);
  const isSephardiActive = sephardiSelichotActive(new Date());
  const inSeason = nusach === 'polin' ? !!todayPolin : isSephardiActive;

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
          title="סליחות"
          subtitle={
            nusach === 'polin'
              ? selectedDay
                ? POLIN_DAYS.find((d) => d.key === selectedDay)?.he
                : 'בחר יום'
              : 'נוסח עדות המזרח'
          }
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* "תוקף היום" indicator */}
          {inSeason && (
            <Card variant="primary">
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                ✓ <Text style={{ fontWeight: '700' }}>היום אומרים סליחות</Text>
                {nusach === 'polin' && todayPolin
                  ? ` · ${POLIN_DAYS.find((d) => d.key === todayPolin)?.he}`
                  : ''}
              </Text>
            </Card>
          )}
          {!inSeason && (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
                היום לא אומרים סליחות. אתה צופה בטקסט לעיון או הכנה.
              </Text>
            </Card>
          )}

          {/* Nusach selector */}
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>נוסח:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
              {(Object.keys(NUSACH_LABEL) as Nusach[]).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setNusach(n)}
                  style={[styles.btn, nusach === n && styles.btnActive]}
                >
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: nusach === n ? colors.textInverse : colors.textPrimary },
                    ]}
                  >
                    {NUSACH_LABEL[n]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Day selector for Polin */}
          {nusach === 'polin' && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                בחר יום:
              </Text>
              <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
                {POLIN_DAYS.map((d) => (
                  <Pressable
                    key={d.key}
                    onPress={() => setSelectedDay(d.key)}
                    style={[
                      styles.dayChip,
                      selectedDay === d.key && styles.dayChipActive,
                      d.key === todayPolin && styles.dayChipToday,
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: selectedDay === d.key ? colors.textInverse : colors.textPrimary,
                          fontWeight: selectedDay === d.key ? '700' : '400',
                        },
                      ]}
                    >
                      {d.he}
                      {d.key === todayPolin ? ' ✦' : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
                ✦ = היום
              </Text>
            </Card>
          )}

          {/* Text */}
          {loading && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md }]}>
                טוען...
              </Text>
            </View>
          )}

          {error && (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>{error}</Text>
            </Card>
          )}

          {/* Display toggles */}
          {paragraphs.length > 0 && (
            <Card>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm }}>
                <Pressable
                  onPress={() => setShowAll(!showAll)}
                  style={[styles.toggleChip, showAll && styles.toggleChipActive]}
                >
                  <Text style={[typography.caption, { color: showAll ? colors.textInverse : colors.textPrimary }]}>
                    {showAll ? '✓ ' : ''}הצג את כל התוספות
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowNotes(!showNotes)}
                  style={[styles.toggleChip, showNotes && styles.toggleChipActive]}
                >
                  <Text style={[typography.caption, { color: showNotes ? colors.textInverse : colors.textPrimary }]}>
                    {showNotes ? '✓ ' : ''}הערות הלכתיות
                  </Text>
                </Pressable>
              </View>
            </Card>
          )}

          {paragraphs.length > 0 && (
            <Card padding="xl">
              {paragraphs.map((p, j) => {
                if (!shouldRender(p, active, { showAll, showNotes })) return null;
                if (p.kind === 'halachic-note') {
                  return (
                    <Text key={j} style={[typography.small, styles.note]}>
                      {p.body}
                    </Text>
                  );
                }
                if (p.kind === 'conditional' || p.kind === 'alternative') {
                  const inSeasonP = !p.tags || p.tags.length === 0 || p.tags.some((t) => active.has(t));
                  return (
                    <View key={j} style={[styles.condBlock, !inSeasonP && styles.condMuted]}>
                      {p.marker && (
                        <Text style={styles.condMarker}>🔹 {p.marker}{!inSeasonP && ' · לא היום'}</Text>
                      )}
                      <Text style={[typography.sacred, styles.paragraph, inSeasonP ? styles.condText : styles.condTextMuted]}>
                        {p.body}
                      </Text>
                    </View>
                  );
                }
                return (
                  <Text key={j} style={[typography.sacred, styles.paragraph]}>
                    {p.body}
                  </Text>
                );
              })}
            </Card>
          )}

          {/* Explanation */}
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>מתי אומרים</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>אשכנז</Text>: מתחילים במוצ"ש שלפני ר"ה (לפחות 4 ימים). באשמורת הבוקר.{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>ספרדים ועדות המזרח</Text>: מ-א' אלול ועד יום כיפור (40 ימים).{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>בעשי״ת</Text>: שני הציבורים אומרים.{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>בתעניות ציבור</Text>: סדר סליחות מיוחד.
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
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    flexGrow: 1,
    minWidth: 110,
    alignItems: 'center',
  },
  btnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  dayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  dayChipToday: { borderColor: '#8B3A62' },
  toggleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  paragraph: {
    color: colors.textPrimary,
    lineHeight: 32,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  note: { color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm, lineHeight: 20, opacity: 0.85 },
  condBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 4,
    borderRightColor: '#8B3A62',
    backgroundColor: 'rgba(139, 58, 98, 0.07)',
    borderRadius: radius.sm,
  },
  condMuted: { borderRightColor: colors.border, backgroundColor: 'rgba(0,0,0,0.03)', opacity: 0.55 },
  condMarker: { color: '#8B3A62', fontWeight: '700', fontSize: 12, marginBottom: spacing.xs },
  condText: { color: '#5C1F3A', fontWeight: '500' },
  condTextMuted: { color: colors.textMuted, fontStyle: 'italic' },
});
