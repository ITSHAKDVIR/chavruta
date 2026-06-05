import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, months } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { getString, Keys } from '../../src/storage/storage';
import { fetchSefariaText } from '../../src/services/sefaria';
import { parseParagraphs, activeTags, shouldRender, weekdayTag, ParsedParagraph } from '../../src/services/siddurParser';
import { HDate as HDateForCalc, months as monthsForCalc } from '@hebcal/core';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Nusach = 'ashkenazi' | 'sephardi';

const NUSACH_LABEL: Record<Nusach, string> = {
  ashkenazi: 'אשכנז',
  sephardi: 'ספרד / עדות מזרח',
};

const DAY_LABELS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'הושענא רבה'];

const ASHKENAZ_REFS = [
  "Siddur Ashkenaz, Festivals, Sukkot, Hosha'anot, First Day of Sukkot",
  "Siddur Ashkenaz, Festivals, Sukkot, Hosha'anot, Second Day of Sukkot",
  "Siddur Ashkenaz, Festivals, Sukkot, Hosha'anot, Third Day of Sukkot",
  "Siddur Ashkenaz, Festivals, Sukkot, Hosha'anot, Fourth Day of Sukkot",
  "Siddur Ashkenaz, Festivals, Sukkot, Hosha'anot, Fifth Day of Sukkot",
  "Siddur Ashkenaz, Festivals, Sukkot, Hosha'anot, Sixth Day of Sukkot",
  "Siddur Ashkenaz, Festivals, Sukkot, Hosha'anot, Hosha'ana Rabba",
];

const SEPHARDI_REFS: { label: string; ref: string }[] = [
  { label: 'סדר ההושענות', ref: 'Siddur Sefard, Sukkot, Order of Hoshanot' },
  { label: 'לימים א׳-ו׳ של סוכות', ref: 'Siddur Sefard, Sukkot, First Day & Chol HaMoed' },
  { label: 'לשבת', ref: 'Siddur Sefard, Sukkot, Sabbath' },
  { label: 'להושענא רבה', ref: 'Siddur Sefard, Sukkot, Hoshana Rabba' },
];

function sukkotDayFor(date: Date): number | null {
  const hd = new HDate(date);
  if (hd.getMonth() !== months.TISHREI) return null;
  const d = hd.getDate();
  if (d >= 15 && d <= 21) return d - 14;
  return null;
}

function isShabbat(date: Date): boolean {
  return date.getDay() === 6;
}

export default function HoshanotScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';

  const [nusach, setNusach] = useState<Nusach>('ashkenazi');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedSephardiIdx, setSelectedSephardiIdx] = useState<number>(1);
  const [paragraphs, setParagraphs] = useState<ParsedParagraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getString(Keys.nusach, 'ashkenazi');
      if (stored === 'sephardi' || stored === 'edot-mizrach' || stored === 'chabad') {
        setNusach('sephardi');
      } else {
        setNusach('ashkenazi');
      }
      const today = sukkotDayFor(new Date());
      if (today) {
        setSelectedDay(today);
        if (today === 7) setSelectedSephardiIdx(3);
        else if (isShabbat(new Date())) setSelectedSephardiIdx(2);
        else setSelectedSephardiIdx(1);
      }
    })();
  }, []);

  const refToFetch = useMemo((): string | null => {
    if (nusach === 'ashkenazi') return ASHKENAZ_REFS[selectedDay - 1] ?? null;
    return SEPHARDI_REFS[selectedSephardiIdx]?.ref ?? null;
  }, [nusach, selectedDay, selectedSephardiIdx]);

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
          setError('הטקסט לא נטען');
        }
      })
      .catch(() => setError('שגיאת רשת'))
      .finally(() => setLoading(false));
  }, [refToFetch]);

  // Determine the Gregorian weekday on which "Day N of Sukkot" falls this year.
  // Sukkot starts on 15 Tishrei. We need the upcoming Sukkot (or current, if we're
  // inside it). The Hebrew year rolls over at 1 Tishrei. In hebcal's month index
  // Nisan=1 ... Elul=6, Tishrei=7, Cheshvan=8 ... Adar=12/13.
  //
  // The only time the *current* Hebrew year still has Sukkot ahead is when we're
  // in Tishrei before day 23 (or before, but Tishrei 1-22 covers the run-up and
  // chag itself). All other dates point at Sukkot of year+1.
  const sukkotDayWeekday = useMemo(() => {
    const now = new Date();
    const hd = new HDateForCalc(now);
    const m = hd.getMonth();
    const d = hd.getDate();
    let year = hd.getFullYear();
    const inCurrentSukkot = m === monthsForCalc.TISHREI && d <= 22;
    if (!inCurrentSukkot) year++;
    try {
      const firstDay = new HDateForCalc(15, monthsForCalc.TISHREI, year).greg();
      const nDay = new Date(firstDay);
      nDay.setDate(firstDay.getDate() + (selectedDay - 1));
      return nDay.getDay(); // 0-6
    } catch {
      return new Date().getDay();
    }
  }, [selectedDay]);

  // activeTags + the "fell-X" tag for the selected Sukkot day
  const active = useMemo(() => {
    const tags = activeTags(new Date(), inIsrael);
    tags.add(weekdayTag(sukkotDayWeekday));
    return tags;
  }, [inIsrael, sukkotDayWeekday]);

  const todayDay = sukkotDayFor(new Date());

  const weekdayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][sukkotDayWeekday];

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
          title="הושענות"
          subtitle={
            nusach === 'ashkenazi'
              ? `יום ${DAY_LABELS[selectedDay - 1]} של סוכות · יום ${weekdayName}`
              : SEPHARDI_REFS[selectedSephardiIdx]?.label ?? ''
          }
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {todayDay !== null && (
            <Card variant="primary">
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                ✓ <Text style={{ fontWeight: '700' }}>היום סוכות יום {DAY_LABELS[todayDay - 1]}</Text>
                {todayDay === 7 ? ' (הושענא רבה)' : ''}
              </Text>
              {isShabbat(new Date()) && todayDay !== 7 && (
                <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, marginTop: 4 }]}>
                  בשבת אין הקפות עם לולב, אבל יש ציבורים שאומרים את הפיוט.
                </Text>
              )}
            </Card>
          )}
          {todayDay === null && (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
                היום לא חג הסוכות. אתה צופה בטקסט לעיון או הכנה.
              </Text>
            </Card>
          )}

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>נוסח:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
              {(Object.keys(NUSACH_LABEL) as Nusach[]).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setNusach(n)}
                  style={[styles.btn, nusach === n && styles.btnActive]}
                >
                  <Text style={[typography.bodyBold, { color: nusach === n ? colors.textInverse : colors.textPrimary }]}>
                    {NUSACH_LABEL[n]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {nusach === 'ashkenazi' && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>בחר יום:</Text>
              <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
                {DAY_LABELS.map((lbl, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedDay(i + 1)}
                    style={[
                      styles.dayChip,
                      selectedDay === i + 1 && styles.dayChipActive,
                      todayDay === i + 1 && styles.dayChipToday,
                    ]}
                  >
                    <Text style={[
                      typography.caption,
                      {
                        color: selectedDay === i + 1 ? colors.textInverse : colors.textPrimary,
                        fontWeight: selectedDay === i + 1 ? '700' : '400',
                      },
                    ]}>
                      {lbl}{todayDay === i + 1 ? ' ✦' : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          )}

          {nusach === 'sephardi' && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>בחר חלק:</Text>
              <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
                {SEPHARDI_REFS.map((s, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedSephardiIdx(i)}
                    style={[styles.dayChip, selectedSephardiIdx === i && styles.dayChipActive]}
                  >
                    <Text style={[
                      typography.caption,
                      {
                        color: selectedSephardiIdx === i ? colors.textInverse : colors.textPrimary,
                        fontWeight: selectedSephardiIdx === i ? '700' : '400',
                      },
                    ]}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          )}

          {loading && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md }]}>טוען...</Text>
            </View>
          )}

          {error && (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>{error}</Text>
            </Card>
          )}

          {paragraphs.length > 0 && (
            <Card>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm }}>
                <Pressable
                  onPress={() => setShowAll(!showAll)}
                  style={[styles.toggleChip, showAll && styles.toggleChipActive]}
                >
                  <Text style={[typography.caption, { color: showAll ? colors.textInverse : colors.textPrimary }]}>
                    {showAll ? '✓ ' : ''}כל התוספות
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
                  return <Text key={j} style={[typography.small, styles.note]}>{p.body}</Text>;
                }
                if (p.kind === 'conditional' || p.kind === 'alternative') {
                  const inSeasonP = !p.tags || p.tags.length === 0 || p.tags.some((t) => active.has(t));
                  return (
                    <View key={j} style={[styles.condBlock, !inSeasonP && styles.condMuted]}>
                      {p.marker ? <Text style={styles.condMarker}>🔹 {p.marker}{!inSeasonP && ' · לא היום'}</Text> : null}
                      <Text style={[typography.sacred, styles.paragraph, inSeasonP ? styles.condText : styles.condTextMuted]}>
                        {p.body}
                      </Text>
                    </View>
                  );
                }
                return <Text key={j} style={[typography.sacred, styles.paragraph]}>{p.body}</Text>;
              })}
            </Card>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>על ההושענות</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              ⊙ בכל יום מימי הסוכות (מלבד שבת) מקיפים את הבימה עם הלולב והאתרוג ואומרים פיוט "הושענא...".{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>הושענא רבה</Text> (יום ז׳ של סוכות): שבע הקפות עם כל ההושענות, ולבסוף חבטת ערבה.{'\n\n'}
              ⊙ בשבת אין הקפות ולא לוקחים את הלולב, אבל חלק מהציבורים אומרים את הפיוט.
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
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  dayChipToday: { borderColor: '#8B3A62', borderWidth: 2 },
  toggleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  paragraph: { color: colors.textPrimary, lineHeight: 32, textAlign: 'right', marginTop: spacing.sm },
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
