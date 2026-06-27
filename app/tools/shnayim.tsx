import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { useLocation } from '../../src/hooks/useLocation';
import { fetchSefariaText, fetchParshaAliyot, cleanSefariaText } from '../../src/services/sefaria';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { translateRef } from '../../src/data/refTranslate';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/shnayim';
const KEY_PREFS = '@yahadut/shnayim-prefs';

type AliyahState = { mikra1: boolean; mikra2: boolean; targum: boolean; rashi: boolean };
type Progress = {
  parshahId: string;
  aliyot: Record<number, AliyahState>;
};
type Prefs = {
  withRashi: boolean;
  layout: 'verse-by-verse' | 'sequential';
};

const ALIYAH_NAMES = ['ראשון - כהן', 'שני - לוי', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי'];

// Convert "Numbers 4:21-4:37" → "Numbers.4.21-4.37"
function refToApi(humanRef: string): string {
  return humanRef.replace(/\s+/g, '_').replace(/:/g, '.').replace(/\s+-\s+/g, '-');
}

export default function ShnayimScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';

  const [prefs, setPrefs] = useStoredJSON<Prefs>(KEY_PREFS, { withRashi: false, layout: 'verse-by-verse' });

  const [parshaInfo, setParshaInfo] = useState<{ name: string; aliyot: string[] } | null>(null);
  const [loadingParsha, setLoadingParsha] = useState(true);

  // The Shabbat this week's shnayim-mikra is for. Stays the SAME the whole week
  // INCLUDING Shabbat itself (so you can still finish on Shabbat morning — the
  // halachic deadline), and only rolls to the next parsha on מוצאי שבת / Sunday.
  // (The old `|| 7` flipped on Saturday, hiding the parsha you were finishing.)
  const upcomingSaturday = useMemo(() => {
    const d = new Date();
    const day = d.getDay();          // Sun=0 … Sat=6
    d.setDate(d.getDate() + ((6 - day + 7) % 7)); // Sat → +0 (today); Sun-Fri → coming Sat
    return d;
  }, []);

  useEffect(() => {
    setLoadingParsha(true);
    fetchParshaAliyot(upcomingSaturday, inIsrael).then((info) => {
      setParshaInfo(info ? { name: info.name, aliyot: info.aliyot } : null);
      setLoadingParsha(false);
    });
  }, [upcomingSaturday.toDateString(), inIsrael]);

  const parshahId = parshaInfo ? `${parshaInfo.name}-${upcomingSaturday.toISOString().slice(0, 10)}` : 'none';
  const [progress, setProgress] = useStoredJSON<Progress>(KEY, { parshahId, aliyot: {} });
  const current: Progress = progress.parshahId === parshahId ? progress : { parshahId, aliyot: {} };

  const weekday = new Date().getDay();
  const defaultAliyah = weekday === 6 ? 7 : weekday + 1;
  const [activeAliyah, setActiveAliyah] = useState(defaultAliyah);

  const [mikraVerses, setMikraVerses] = useState<string[]>([]);
  const [onkelosVerses, setOnkelosVerses] = useState<string[]>([]);
  const [rashiVerses, setRashiVerses] = useState<string[][]>([]);
  const [loadingText, setLoadingText] = useState(false);

  const activeRef = parshaInfo?.aliyot?.[activeAliyah - 1];

  useEffect(() => {
    if (!activeRef) return;
    const apiRef = refToApi(activeRef);
    setLoadingText(true);
    Promise.all([
      fetchSefariaText(apiRef),
      fetchSefariaText(`Onkelos_${apiRef}`),
      prefs.withRashi ? fetchSefariaText(`Rashi_on_${apiRef}`) : Promise.resolve(null),
    ]).then(([m, o, r]) => {
      setMikraVerses((m?.heText ?? []).map(cleanSefariaText));
      setOnkelosVerses((o?.heText ?? []).map(cleanSefariaText));
      if (r) {
        // Rashi returns array of arrays (one per verse, multiple comments)
        const rashi: string[][] = [];
        for (const v of r.heText ?? []) {
          if (Array.isArray(v)) rashi.push(v.map(cleanSefariaText));
          else if (typeof v === 'string') rashi.push([cleanSefariaText(v)]);
          else rashi.push([]);
        }
        setRashiVerses(rashi);
      } else {
        setRashiVerses([]);
      }
      setLoadingText(false);
    }).catch(() => setLoadingText(false));
  }, [activeRef, prefs.withRashi]);

  function toggleField(num: number, field: keyof AliyahState) {
    const aliyot = { ...current.aliyot };
    const v = aliyot[num] ?? { mikra1: false, mikra2: false, targum: false, rashi: false };
    aliyot[num] = { ...v, [field]: !v[field] };
    setProgress({ ...current, aliyot });
  }

  function isAliyahDone(num: number): boolean {
    const a = current.aliyot[num];
    if (!a) return false;
    if (!a.mikra1 || !a.mikra2 || !a.targum) return false;
    if (prefs.withRashi && !a.rashi) return false;
    return true;
  }

  function markAllForActive(): void {
    const aliyot = { ...current.aliyot };
    aliyot[activeAliyah] = { mikra1: true, mikra2: true, targum: true, rashi: true };
    setProgress({ ...current, aliyot });
  }

  const doneCount = ALIYAH_NAMES.filter((_, i) => isAliyahDone(i + 1)).length;
  const allDone = doneCount === 7;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}><Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="שניים מקרא ואחד תרגום" subtitle={parshaInfo?.name ?? '...'} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {loadingParsha && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md }]}>טוען פרשת השבוע...</Text>
            </View>
          )}

          {parshaInfo && (
            <>
              <Card variant={allDone ? 'accent' : 'primary'}>
                <Text style={[typography.h2, { color: allDone ? colors.primaryDark : colors.textInverse }]}>
                  {allDone ? '✓ הושלם השבוע' : `${doneCount} / 7 עליות הושלמו`}
                </Text>
                <Text style={[typography.small, { color: allDone ? colors.primaryDark : colors.textInverse, opacity: 0.85, marginTop: 4 }]}>
                  היום ({ALIYAH_NAMES[defaultAliyah - 1]}) - לפי המנהג נכון ללמוד עליה זו
                </Text>
              </Card>

              <Card>
                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>הגדרות לימוד:</Text>
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <Pressable
                    onPress={() => setPrefs({ ...prefs, withRashi: !prefs.withRashi })}
                    style={[styles.toggle, prefs.withRashi && styles.toggleOn]}
                  >
                    <Text style={[typography.body, { color: prefs.withRashi ? colors.textInverse : colors.textPrimary }]}>
                      {prefs.withRashi ? '✓ עם רש"י' : 'בלי רש"י'}
                    </Text>
                  </Pressable>
                </View>
                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>סגנון תצוגה:</Text>
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <Pressable
                    onPress={() => setPrefs({ ...prefs, layout: 'verse-by-verse' })}
                    style={[styles.toggle, prefs.layout === 'verse-by-verse' && styles.toggleOn, { flexGrow: 1, flexBasis: 140, minWidth: 140 }]}
                  >
                    <Text
                      style={[typography.body, { color: prefs.layout === 'verse-by-verse' ? colors.textInverse : colors.textPrimary, textAlign: 'center' }]}
                    >
                      פסוק-פסוק{'\n'}(פס׳ + תרגום)
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPrefs({ ...prefs, layout: 'sequential' })}
                    style={[styles.toggle, prefs.layout === 'sequential' && styles.toggleOn, { flexGrow: 1, flexBasis: 140, minWidth: 140 }]}
                  >
                    <Text
                      style={[typography.body, { color: prefs.layout === 'sequential' ? colors.textInverse : colors.textPrimary, textAlign: 'center' }]}
                    >
                      רציף{'\n'}(מקרא, שוב, תרגום)
                    </Text>
                  </Pressable>
                </View>
              </Card>

              <View style={styles.tabs}>
                {ALIYAH_NAMES.map((name, i) => {
                  const num = i + 1;
                  const isActive = activeAliyah === num;
                  const isToday = defaultAliyah === num;
                  const done = isAliyahDone(num);
                  return (
                    <Pressable
                      key={num}
                      onPress={() => setActiveAliyah(num)}
                      style={[styles.tab, isActive && styles.tabActive, isToday && !isActive && styles.tabToday]}
                    >
                      <Text style={[typography.caption, { color: isActive ? colors.textInverse : colors.textPrimary, fontWeight: '700' }]}>
                        {hebrewNumeral(num)}
                      </Text>
                      <Text
                        style={[typography.caption, { color: isActive ? colors.textInverse : colors.textMuted, fontSize: 10 }]}
                      >
                        {name.split(' - ')[0]}
                      </Text>
                      {done && <Text style={{ fontSize: 10, color: isActive ? colors.textInverse : colors.success }}>✓</Text>}
                    </Pressable>
                  );
                })}
              </View>

              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{ALIYAH_NAMES[activeAliyah - 1]}</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                  {activeRef ? translateRef(activeRef) : ''}
                </Text>
                {isAliyahDone(activeAliyah) && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Pill label="✓ נקראה" tone="success" />
                  </View>
                )}
              </Card>

              {loadingText && (
                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md }]}>טוען טקסט...</Text>
                </View>
              )}

              {!loadingText && mikraVerses.length === 0 && (
                <Card>
                  <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
                    לא נטען טקסט לעליה זו. בדוק חיבור אינטרנט.
                  </Text>
                </Card>
              )}

              {!loadingText && mikraVerses.length > 0 && prefs.layout === 'verse-by-verse' && (
                <Card padding="xl">
                  <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}>פסוק אחר פסוק</Text>
                  {mikraVerses.map((v, i) => (
                    <View key={i} style={[styles.versePack, i < mikraVerses.length - 1 && styles.versePackBorder]}>
                      <Text style={[typography.sacred, { color: colors.textPrimary }]}>
                        <Text style={{ color: colors.primary, fontWeight: '700' }}>({hebrewNumeral(i + 1)}) </Text>
                        {v}
                      </Text>
                      {onkelosVerses[i] && (
                        <Text style={[typography.body, { color: colors.textSecondary, marginTop: 6, fontStyle: 'italic' }]}>
                          <Text style={{ color: colors.accentDark, fontWeight: '700' }}>תרגום: </Text>
                          {onkelosVerses[i]}
                        </Text>
                      )}
                      {prefs.withRashi && rashiVerses[i] && rashiVerses[i].length > 0 && (
                        <View style={{ marginTop: 6 }}>
                          <Text style={{ color: colors.info, fontWeight: '700' }}>רש"י:</Text>
                          {rashiVerses[i].map((c, j) => (
                            <Text key={j} style={[typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                              {c}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </Card>
              )}

              {!loadingText && mikraVerses.length > 0 && prefs.layout === 'sequential' && (
                <>
                  <Card padding="xl">
                    <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>מקרא - פעם ראשונה</Text>
                    <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 32 }]}>
                      {mikraVerses.map((v, i) => `(${hebrewNumeral(i + 1)}) ${v}`).join(' ')}
                    </Text>
                  </Card>
                  <Card padding="xl">
                    <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>מקרא - פעם שנייה</Text>
                    <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 32 }]}>
                      {mikraVerses.map((v, i) => `(${hebrewNumeral(i + 1)}) ${v}`).join(' ')}
                    </Text>
                  </Card>
                  <Card padding="xl">
                    <Text style={[typography.h3, { color: colors.accentDark, marginBottom: spacing.sm }]}>תרגום אונקלוס</Text>
                    <Text style={[typography.body, { color: colors.textPrimary, lineHeight: 28 }]}>
                      {onkelosVerses.map((v, i) => `(${hebrewNumeral(i + 1)}) ${v}`).join(' ')}
                    </Text>
                  </Card>
                  {prefs.withRashi && rashiVerses.length > 0 && (
                    <Card padding="xl">
                      <Text style={[typography.h3, { color: colors.info, marginBottom: spacing.sm }]}>רש"י</Text>
                      {rashiVerses.map((arr, i) => arr.length > 0 ? (
                        <View key={i} style={{ marginBottom: spacing.sm }}>
                          <Text style={[typography.bodyBold, { color: colors.primary }]}>פסוק {hebrewNumeral(i + 1)}:</Text>
                          {arr.map((c, j) => (
                            <Text key={j} style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}>{c}</Text>
                          ))}
                        </View>
                      ) : null)}
                    </Card>
                  )}
                </>
              )}

              {!loadingText && mikraVerses.length > 0 && (
                <Pressable
                  onPress={markAllForActive}
                  style={[
                    styles.bigDoneBtn,
                    isAliyahDone(activeAliyah) && styles.bigDoneBtnDone,
                  ]}
                >
                  <Text style={[typography.h2, { color: colors.textInverse }]}>
                    {isAliyahDone(activeAliyah) ? '✓ נקראה' : '✓ קראתי את העליה'}
                  </Text>
                </Pressable>
              )}

              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>הלכה</Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                  <Text style={{ fontWeight: '700' }}>מתי</Text> - מיום ראשון בשבוע עד שבת בבוקר.{'\n'}
                  <Text style={{ fontWeight: '700' }}>איך</Text> - הפרשה פעמיים במקרא, פעם אחת תרגום אונקלוס. יש שמוסיפים רש"י.{'\n'}
                  <Text style={{ fontWeight: '700' }}>מנהג</Text> - עליה אחת ביום (ראשון ביום ראשון וכו׳).
                </Text>
              </Card>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  tabs: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    flexGrow: 1,
    flexBasis: 60,
    minWidth: 60,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  tabToday: { borderColor: colors.success, borderWidth: 2 },
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  toggleOn: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  checkBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkBtnOn: { backgroundColor: colors.success, borderColor: colors.success },
  bigDoneBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  bigDoneBtnDone: { backgroundColor: colors.success, borderColor: colors.success },
  versePack: { paddingVertical: spacing.sm },
  versePackBorder: { borderBottomWidth: 1, borderBottomColor: '#F2EDE0' },
});
