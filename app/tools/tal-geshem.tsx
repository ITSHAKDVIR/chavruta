import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { useLocation } from '../../src/hooks/useLocation';
import {
  gevurotSeasonFor,
  birkatHashanimSeasonFor,
  tefillotSinceStart,
  SeasonInfo,
  CHAZAKA_TARGET,
} from '../../src/data/chazakaTalGeshem';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { getJSON, setJSON, getString, setString, Keys } from '../../src/storage/storage';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type ChazakaState = {
  gevurot: {
    /** Number of times the user has rehearsed the phrase manually. */
    rehearsals: number;
    /** ISO start date last seen — used to detect season change and auto-reset. */
    lastSeasonStartISO: string;
  };
  birkat: {
    rehearsals: number;
    lastSeasonStartISO: string;
  };
};

const DEFAULT_STATE: ChazakaState = {
  gevurot: { rehearsals: 0, lastSeasonStartISO: '' },
  birkat: { rehearsals: 0, lastSeasonStartISO: '' },
};

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


type Nusach = 'ashkenazi' | 'sephardi';

/** Full phrase to rehearse — depends on nusach + season. */
function rehearsalText(kind: 'gevurot' | 'birkat', season: 'winter' | 'summer', nusach: Nusach): string {
  if (kind === 'gevurot') {
    if (season === 'winter') {
      // כל הנוסחאות: "משיב הרוח ומוריד הגשם" בחורף
      return '...מְחַיֵּה מֵתִים אַתָּה רַב לְהוֹשִׁיעַ - מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם...';
    }
    // קיץ — בארץ ישראל אומרים "מוריד הטל" בכל הנוסחאות
    return '...מְחַיֵּה מֵתִים אַתָּה רַב לְהוֹשִׁיעַ - מוֹרִיד הַטָּל...';
  }
  // Birkat HaShanim — only the SHORT phrase that needs memorization
  // (the changing bit, not the full bracha). User-specified nusach:
  // - Ashkenazi: just the closing "ואת כל מיני תבואתה לטובה" + transition word
  // - Sephardi: the "anchor" from the previous bracha (רפואה) + opening word
  //   so the person catches when to switch into the new nusach.
  if (nusach === 'ashkenazi') {
    if (season === 'winter') {
      return 'וְאֵת כָּל מִינֵי תְבוּאָתָהּ לְטוֹבָה, וְתֵן טַל וּמָטָר לִבְרָכָה';
    }
    return 'וְאֵת כָּל מִינֵי תְבוּאָתָהּ לְטוֹבָה, וְתֵן בְּרָכָה';
  }
  // Sephardi: the anchor phrase before "ברכנו" / "ברך עלינו"
  if (season === 'winter') {
    return 'רוֹפֵא חוֹלֵי עַמּוֹ יִשְׂרָאֵל. בָּרֵךְ עָלֵינוּ';
  }
  return 'רוֹפֵא חוֹלֵי עַמּוֹ יִשְׂרָאֵל. בָּרְכֵנוּ';
}

export default function TalGeshemChazakaScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const now = useMemo(() => new Date(), []);
  const inIsrael = location.countryCode === 'IL';

  const gevurotSeason = useMemo(() => gevurotSeasonFor(now), [now.toDateString()]);
  const birkatSeason = useMemo(() => birkatHashanimSeasonFor(now, inIsrael), [now.toDateString(), inIsrael]);

  const [state, setState] = useState<ChazakaState>(DEFAULT_STATE);
  const [nusach, setNusachState] = useState<Nusach>('ashkenazi');
  const [loaded, setLoaded] = useState(false);

  // Load global nusach preference once
  useEffect(() => {
    (async () => {
      const stored = await getString(Keys.nusach, 'ashkenazi');
      // Sephardi + Edot Mizrach share the Sephardic-family nusach for
      // ותן טל ומטר phrasing — only Ashkenazi differs.
      const isSefardicFamily = ['sephardi', 'edot-mizrach'].includes(stored);
      setNusachState((isSefardicFamily ? 'sephardi' : 'ashkenazi') as Nusach);
    })();
  }, []);

  async function setNusach(n: Nusach) {
    setNusachState(n);
    await setString(Keys.nusach, n);
  }

  // Load state + auto-reset rehearsal count when season changes
  useEffect(() => {
    (async () => {
      const stored = await getJSON<ChazakaState>(Keys.chazakaTefillot, DEFAULT_STATE);
      const next = { ...stored };
      const gevStartIso = dateToISO(gevurotSeason.startDate);
      const brStartIso = dateToISO(birkatSeason.startDate);
      let changed = false;
      if (next.gevurot.lastSeasonStartISO !== gevStartIso) {
        next.gevurot = { rehearsals: 0, lastSeasonStartISO: gevStartIso };
        changed = true;
      }
      if (next.birkat.lastSeasonStartISO !== brStartIso) {
        next.birkat = { rehearsals: 0, lastSeasonStartISO: brStartIso };
        changed = true;
      }
      if (changed) await setJSON(Keys.chazakaTefillot, next);
      setState(next);
      setLoaded(true);
    })();
  }, [gevurotSeason.startDate.getTime(), birkatSeason.startDate.getTime()]);

  const updateState = useCallback(async (patch: Partial<ChazakaState>) => {
    const next = { ...state, ...patch };
    setState(next);
    await setJSON(Keys.chazakaTefillot, next);
  }, [state]);

  const addGevurot = (delta: number) =>
    updateState({ gevurot: { ...state.gevurot, rehearsals: Math.max(0, state.gevurot.rehearsals + delta) } });
  const addBirkat = (delta: number) =>
    updateState({ birkat: { ...state.birkat, rehearsals: Math.max(0, state.birkat.rehearsals + delta) } });
  const resetGevurot = () =>
    updateState({ gevurot: { ...state.gevurot, rehearsals: 0 } });
  const resetBirkat = () =>
    updateState({ birkat: { ...state.birkat, rehearsals: 0 } });

  const gevurotTefillot = tefillotSinceStart(gevurotSeason.startDate, now, 'gevurot');
  const gevurotTotal = state.gevurot.rehearsals + gevurotTefillot;
  const birkatTefillot = tefillotSinceStart(birkatSeason.startDate, now, 'birkat-hashanim');
  const birkatTotal = state.birkat.rehearsals + birkatTefillot;

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
          title="חזקה לטל וגשם"
          subtitle="שינון 90 פעמים → לא צריך לחזור גם אם הסתפקת"
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
              <Text style={{ fontWeight: '700' }}>הרעיון:</Text> במעבר עונה (פסח / שמיני עצרת / ז' חשון) קיים חשש שיתפלל בנוסח הישן בטעות.
              ההלכה: אם אמרת את הנוסח החדש 90 פעמים רצופות - אתה מוחזק, ואם הסתפקת אינך חוזר.{'\n\n'}
              <Text style={{ fontWeight: '700' }}>איך:</Text> אפשר לשנן את הנוסח 90 פעם רצוף מיד בתחילת העונה
              (כל לחיצה על "+ שיננתי" = חזרה אחת). התפילות הרגילות שכבר התפללת מתחילת העונה - מתקזזות אוטומטית.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>נוסח התפילה שלך:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Pressable
                onPress={() => setNusach('ashkenazi')}
                style={[styles.nusachBtn, nusach === 'ashkenazi' && styles.nusachBtnActive, { flexGrow: 1, minWidth: 140 }]}
              >
                <Text style={[typography.bodyBold, { color: nusach === 'ashkenazi' ? colors.textInverse : colors.textPrimary, textAlign: 'center' }]}>
                  אשכנז
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNusach('sephardi')}
                style={[styles.nusachBtn, nusach === 'sephardi' && styles.nusachBtnActive, { flexGrow: 1, minWidth: 140 }]}
              >
                <Text style={[typography.bodyBold, { color: nusach === 'sephardi' ? colors.textInverse : colors.textPrimary, textAlign: 'center' }]}>
                  ספרד / עדות מזרח
                </Text>
              </Pressable>
            </View>
          </Card>

          {loaded && (
            <>
              <ChazakaCard
                kind="gevurot"
                title="ברכת גבורות (משיב הרוח / מוריד הטל)"
                subtitle="הברכה השנייה בעמידה - 'מחיה מתים'"
                season={gevurotSeason}
                rehearsals={state.gevurot.rehearsals}
                tefillot={gevurotTefillot}
                total={gevurotTotal}
                phrase={rehearsalText('gevurot', gevurotSeason.season as 'winter' | 'summer', nusach)}
                onAdd={() => addGevurot(1)}
                onAdd10={() => addGevurot(10)}
                onSub={() => addGevurot(-1)}
                onReset={resetGevurot}
              />

              <ChazakaCard
                kind="birkat"
                title="ברכת השנים (ברך עלינו / ברכנו)"
                subtitle="הברכה התשיעית בעמידה - 'מברך השנים'"
                season={birkatSeason}
                rehearsals={state.birkat.rehearsals}
                tefillot={birkatTefillot}
                total={birkatTotal}
                phrase={rehearsalText('birkat', birkatSeason.season as 'winter' | 'summer', nusach)}
                onAdd={() => addBirkat(1)}
                onAdd10={() => addBirkat(10)}
                onSub={() => addBirkat(-1)}
                onReset={resetBirkat}
                locationNote={inIsrael ? 'ארץ ישראל: מתחילים ב-ז\' חשון' : 'חו"ל: מתחילים ב-4-5 בדצמבר'}
              />
            </>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>פרטים</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              <Text style={{ fontWeight: '700' }}>תפילות הנספרות אוטומטית:</Text>{'\n'}
              ⊙ ברכת גבורות נאמרת בכל תפילת עמידה - שחרית, מנחה ומעריב. <Text style={{ fontWeight: '700' }}>בשבת ויו"ט גם בתפילת מוסף</Text> - סה"כ 4 תפילות בשבת.{'\n\n'}
              ⊙ ברכת השנים נאמרת רק בתפילת חול (3 פעמים ביום). <Text style={{ fontWeight: '700' }}>בשבת/יו"ט אין ברכת השנים</Text> - מספר התפילות מהיום הוא 0.{'\n\n'}
              <Text style={{ fontWeight: '700' }}>חזקה (90 חזרות):</Text> ושאלות ותשובות מאוחרות שונות.
            </Text>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ChazakaCard({
  kind,
  title,
  subtitle,
  season,
  rehearsals,
  tefillot,
  total,
  phrase,
  onAdd,
  onAdd10,
  onSub,
  onReset,
  locationNote,
}: {
  kind: 'gevurot' | 'birkat';
  title: string;
  subtitle: string;
  season: SeasonInfo;
  rehearsals: number;
  tefillot: number;
  total: number;
  phrase: string;
  onAdd: () => void;
  onAdd10: () => void;
  onSub: () => void;
  onReset: () => void;
  locationNote?: string;
}) {
  const done = total >= CHAZAKA_TARGET;
  const progress = Math.min(1, total / CHAZAKA_TARGET);
  const remaining = Math.max(0, CHAZAKA_TARGET - total);

  return (
    <Card>
      <Text style={[typography.h2, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text>

      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
        מ-{hebrewDateInfo(season.startDate).gematria} עד {hebrewDateInfo(season.nextTransition).gematria}
      </Text>
      {locationNote ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{locationNote}</Text>
      ) : null}

      <View style={styles.phraseBox}>
        <Text style={[typography.caption, { color: colors.primary, marginBottom: 4, fontWeight: '700' }]}>הנוסח לשינון:</Text>
        <Text style={[typography.sacred, { color: colors.textPrimary, fontSize: 20, lineHeight: 30 }]}>
          {phrase}
        </Text>
      </View>

      <View style={{ marginTop: spacing.md }}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={[typography.display, { color: done ? colors.success : colors.primary, fontSize: 36 }]}>
            {total} / {CHAZAKA_TARGET}
          </Text>
          {done ? (
            <Text style={[typography.bodyBold, { color: colors.success }]}>✓ הושלמה החזקה</Text>
          ) : (
            <Text style={[typography.small, { color: colors.textMuted }]}>נותרו {remaining}</Text>
          )}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: done ? colors.success : colors.primary }]} />
        </View>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>
          תפילות שעברו מאז תחילת העונה: {tefillot}
          {rehearsals > 0 ? ` · שיננתי ידנית: ${rehearsals}` : ''}
        </Text>
      </View>

      <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
        <Pressable onPress={onAdd} style={[styles.btn, styles.btnPrimary, { flexGrow: 1, minWidth: 90 }]}>
          <Text style={[typography.bodyBold, { color: colors.textInverse }]}>+ שיננתי</Text>
        </Pressable>
        <Pressable onPress={onAdd10} style={[styles.btn, styles.btnSecondary, { flexGrow: 1, minWidth: 90 }]}>
          <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>+ 10 חזרות</Text>
        </Pressable>
        <Pressable onPress={onSub} style={[styles.btn, styles.btnGhost, { flexGrow: 1, minWidth: 90 }]}>
          <Text style={[typography.body, { color: colors.textMuted }]}>− 1</Text>
        </Pressable>
        <Pressable onPress={onReset} style={[styles.btn, styles.btnGhost, { flexGrow: 1, minWidth: 90 }]}>
          <Text style={[typography.body, { color: colors.danger }]}>אפס שינון</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  phraseBox: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTrack: { marginTop: spacing.sm, height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  progressFill: { height: '100%' },
  btn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1 },
  btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  btnSecondary: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  btnGhost: { backgroundColor: 'transparent', borderColor: colors.border },
  nusachBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  nusachBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
