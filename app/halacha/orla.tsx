import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, months } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

/** Format a Hebrew year (e.g., 5786) as "תשפ״ו" without the "ה'" prefix. */
function hebrewYear(y: number): string {
  if (y < 5000) return String(y);
  return hebrewNumeral(y - 5000);
}

const HEB_MONTHS: Array<{ key: number; name: string }> = [
  { key: months.NISAN, name: 'ניסן' },
  { key: months.IYYAR, name: 'אייר' },
  { key: months.SIVAN, name: 'סיון' },
  { key: months.TAMUZ, name: 'תמוז' },
  { key: months.AV, name: 'אב' },
  { key: months.ELUL, name: 'אלול' },
  { key: months.TISHREI, name: 'תשרי' },
  { key: months.CHESHVAN, name: 'חשון' },
  { key: months.KISLEV, name: 'כסלו' },
  { key: months.TEVET, name: 'טבת' },
  { key: months.SHVAT, name: 'שבט' },
  { key: months.ADAR_I, name: 'אדר' },
];

/**
 * חישוב סטטוס ערלה. הכללים:
 * 1. שנת הנטיעה הראשונה מסתיימת בא' תשרי הקרוב.
 *    אבל אם נטעו פחות מ-45 יום לפני א' תשרי (כלומר אחרי ט"ו אב) - אותה שנה לא נספרת,
 *    והשנה הראשונה היא רק מ-א' תשרי הבא.
 * 2. אם נטעו אחרי ט"ו אב עם גוש (שורשי הצמח עם אדמה) - אותה שנה כן נספרת.
 * 3. 3 שנים ראשונות = ערלה (אסור).
 * 4. השנה הרביעית = נטע רבעי (טעון פדיון).
 * 5. מהשנה החמישית - מותר.
 *
 * הגדרת פירות לפי חנטה:
 * - פרי שחנט (התחיל לגדול) לפני ט"ו בשבט של שנה שלישית - מן הערלה.
 * - פרי שחנט אחרי ט"ו בשבט של שנה רביעית - מהיתר.
 */
function computeOrla(plantingHYear: number, plantingHMonth: number, plantingHDay: number, withGush: boolean): {
  yearOneEnds: number;
  orlaEnds: number;
  netaRevaiEnds: number;
  status: 'orla' | 'neta-revai' | 'permitted';
  chanataBeforeTuBeshvat: { startsWhen: string; endsWhen: string };
  chanataAfterTuBeshvat: { startsWhen: string; endsWhen: string };
} {
  // האם הנטיעה הייתה לפני או אחרי ט"ו אב?
  const beforeTuBeAv = plantingHMonth !== months.AV || plantingHDay < 15;
  const afterTuBeAvWithGush = !beforeTuBeAv && withGush;

  // שנה ראשונה מסתיימת בתשרי הבא, אם נטעו לפני ט"ו אב או אחרי ט"ו אב עם גוש.
  // אחרת - השנה לא נספרת, ושנה ראשונה מסתיימת בתשרי שאחרי.
  const yearOneCountedFromThisYear = beforeTuBeAv || afterTuBeAvWithGush;
  const yearOneEnds = yearOneCountedFromThisYear ? plantingHYear + 1 : plantingHYear + 2;
  const orlaEnds = yearOneEnds + 2; // 3 שנים שלמות
  const netaRevaiEnds = orlaEnds + 1;

  // תאריך נוכחי
  const todayHd = new HDate(new Date());
  const currentYear = todayHd.getFullYear();

  let status: 'orla' | 'neta-revai' | 'permitted' = 'permitted';
  if (currentYear < orlaEnds) status = 'orla';
  else if (currentYear < netaRevaiEnds) status = 'neta-revai';

  // חנטה - הקובע הוא ט"ו בשבט
  // פרי שחנט לפני ט"ו בשבט של שנת אורלה - בערלה
  // פרי שחנט אחרי ט"ו בשבט של שנה רביעית - מותר (אחרי פדיון)
  const orlaShvatYear = orlaEnds; // ט"ו בשבט שעובר את הפרי מערלה לנטע רבעי
  const revaiShvatYear = netaRevaiEnds; // ט"ו בשבט שעובר מנטע רבעי לחולין

  return {
    yearOneEnds,
    orlaEnds,
    netaRevaiEnds,
    status,
    chanataBeforeTuBeshvat: {
      startsWhen: `חנטה לפני ט"ו בשבט ${hebrewNumeral(orlaShvatYear - 5000)}`,
      endsWhen: 'בערלה (אסור)',
    },
    chanataAfterTuBeshvat: {
      startsWhen: `חנטה אחרי ט"ו בשבט ${hebrewNumeral(orlaShvatYear - 5000)}`,
      endsWhen: 'נטע רבעי (חייב פדיון)',
    },
  };
}

export default function OrlaScreen() {
  const router = useRouter();
  const todayHd = new HDate(new Date());
  const [year, setYear] = useState<number>(Math.max(5781, todayHd.getFullYear() - 1));
  const [month, setMonth] = useState<number>(months.NISAN);
  const [isAfterTuBeAv, setIsAfterTuBeAv] = useState<boolean>(false);
  const [withGush, setWithGush] = useState<boolean>(false);

  // Wrap month-change to reset Av-specific state — otherwise the hidden
  // checkbox state leaks back when the user returns to Av.
  function selectMonth(m: number) {
    setMonth(m);
    if (m !== months.AV) {
      setIsAfterTuBeAv(false);
      setWithGush(false);
    }
  }

  // יום הנטיעה: אם בחודש אב והוא אחרי ט"ו = יום 16. אחרת = יום 1 (לפי החודש).
  const day = month === months.AV ? (isAfterTuBeAv ? 16 : 1) : 1;

  const result = useMemo(
    () => computeOrla(year, month, day, withGush),
    [year, month, day, withGush]
  );

  // הצג רק שנים החל מתשפ"א (5781). אם השנה הנוכחית מאוחרת מ-תשפ"א, מציגים את כל הטווח.
  const minYear = 5781;
  const maxYear = todayHd.getFullYear();
  const yearsList = Array.from(
    { length: Math.max(1, maxYear - minYear + 1) },
    (_, i) => maxYear - i,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="מחשבון ערלה" subtitle="חישוב לפי שנת נטיעה עברית" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>שנת הנטיעה (עברי):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
                {yearsList.map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => setYear(y)}
                    style={[styles.chip, year === y && styles.chipActive]}
                  >
                    <Text style={[typography.body, { color: year === y ? colors.textInverse : colors.textPrimary }]}>
                      {hebrewYear(y)}
                    </Text>
                    <Text style={[typography.caption, { color: year === y ? colors.textInverse : colors.textMuted, opacity: 0.7 }]}>
                      ({y})
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>חודש הנטיעה:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
              {HEB_MONTHS.map((m) => (
                <Pressable
                  key={m.key}
                  onPress={() => selectMonth(m.key)}
                  style={[styles.chip, month === m.key && styles.chipActive]}
                >
                  <Text style={[typography.body, { color: month === m.key ? colors.textInverse : colors.textPrimary }]}>
                    {m.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {month === months.AV && (
            <Card variant="accent">
              <Text style={[typography.bodyBold, { color: colors.primaryDark, marginBottom: spacing.sm }]}>נטיעה בחודש אב:</Text>
              <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85, marginBottom: spacing.md }]}>
                ט"ו באב מהווה את גבול ה-45 יום לפני ראש השנה. נטיעה לפני ט"ו אב = השנה נספרת. נטיעה אחריו - תלוי אם בגוש.
              </Text>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => setIsAfterTuBeAv(false)}
                  style={[styles.chip, !isAfterTuBeAv && styles.chipActive, { flexGrow: 1, minWidth: 140 }]}
                >
                  <Text style={[typography.body, { color: !isAfterTuBeAv ? colors.textPrimary : colors.textPrimary, textAlign: 'center' }]}>
                    לפני ט"ו באב
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsAfterTuBeAv(true)}
                  style={[styles.chip, isAfterTuBeAv && styles.chipActive, { flexGrow: 1, minWidth: 140 }]}
                >
                  <Text style={[typography.body, { color: isAfterTuBeAv ? colors.textPrimary : colors.textPrimary, textAlign: 'center' }]}>
                    אחרי ט"ו באב
                  </Text>
                </Pressable>
              </View>
              {isAfterTuBeAv && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={[typography.bodyBold, { color: colors.primaryDark, marginBottom: spacing.sm }]}>
                    איך נטעו את העץ?
                  </Text>
                  <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
                    <Pressable
                      onPress={() => setWithGush(true)}
                      style={[styles.chip, withGush && styles.chipActive, { flexGrow: 1, minWidth: 140 }]}
                    >
                      <Text style={[typography.body, { color: withGush ? colors.textPrimary : colors.textPrimary, textAlign: 'center' }]}>
                        עם גוש (שורשים באדמה)
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setWithGush(false)}
                      style={[styles.chip, !withGush && styles.chipActive, { flexGrow: 1, minWidth: 140 }]}
                    >
                      <Text style={[typography.body, { color: !withGush ? colors.textPrimary : colors.textPrimary, textAlign: 'center' }]}>
                        בלי גוש (שורשים חשופים)
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.75, marginTop: spacing.sm }]}>
                    💡 עץ עם גוש קולט מיד והשנה נספרת. בלי גוש - השנה אינה נספרת.
                  </Text>
                </View>
              )}
            </Card>
          )}

          <Card variant={result.status === 'permitted' ? 'accent' : result.status === 'neta-revai' ? 'primary' : 'default'}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 56 }}>
                {result.status === 'orla' ? '🚫' : result.status === 'neta-revai' ? '⚠️' : '✓'}
              </Text>
              <Text
                style={[
                  typography.h1,
                  {
                    color: result.status === 'permitted' ? colors.primaryDark : result.status === 'neta-revai' ? colors.textInverse : colors.textPrimary,
                    marginTop: spacing.md,
                    textAlign: 'center',
                  },
                ]}
              >
                {result.status === 'orla'
                  ? 'העץ עדיין בערלה'
                  : result.status === 'neta-revai'
                  ? 'נטע רבעי - חייב פדיון'
                  : 'העץ עבר את שנות הערלה'}
              </Text>
            </View>
          </Card>

          {result.status !== 'permitted' && (
            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>פרי לפי מועד החנטה</Text>
              <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md }]}>
                הקובע ההלכתי הוא <Text style={{ fontWeight: '700' }}>תאריך חנטת הפרי</Text> (תחילת הצימוח שלו) - לא תאריך הקטיף.
              </Text>

              <View style={[styles.resultRow, { backgroundColor: '#FFE4E1' }]}>
                <Text style={{ fontSize: 24 }}>🚫</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.danger }]}>פרי שחנט לפני ט"ו בשבט {hebrewYear(result.orlaEnds)}</Text>
                  <Text style={[typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    בערלה - אסור באכילה ובהנאה. שורפים / קוברים.
                  </Text>
                </View>
              </View>

              <View style={[styles.resultRow, { backgroundColor: '#FFF4E1' }]}>
                <Text style={{ fontSize: 24 }}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.warning }]}>פרי שחנט בין ט"ו בשבט {hebrewYear(result.orlaEnds)} לט"ו בשבט {hebrewYear(result.netaRevaiEnds)}</Text>
                  <Text style={[typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    נטע רבעי - מותר באכילה אחרי פדיון על מטבע.
                  </Text>
                </View>
              </View>

              <View style={[styles.resultRow, { backgroundColor: '#E1F4E4' }]}>
                <Text style={{ fontSize: 24 }}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.success }]}>פרי שחנט אחרי ט"ו בשבט {hebrewYear(result.netaRevaiEnds)}</Text>
                  <Text style={[typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    חולין - מותר באכילה (כמובן אחרי הפרשת תרו"מ).
                  </Text>
                </View>
              </View>
            </Card>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>סיכום השנים</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
              ספירת שנים מסתיימת בא' תשרי. מעבר הפירות בין ערלה → רבעי → חולין הוא בט"ו בשבט.
            </Text>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <View style={styles.timelineRow}>
                <Pill label="א' תשרי" tone="default" />
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                  סוף שנה ראשונה - {hebrewYear(result.yearOneEnds)}
                </Text>
              </View>
              <View style={styles.timelineRow}>
                <Pill label="ט״ו בשבט" tone="warning" />
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                  חנטה אחרי תאריך זה ({hebrewYear(result.orlaEnds)}) - פרי נטע רבעי (חייב פדיון)
                </Text>
              </View>
              <View style={styles.timelineRow}>
                <Pill label="ט״ו בשבט" tone="success" />
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                  חנטה אחרי תאריך זה ({hebrewYear(result.netaRevaiEnds)}) - פרי חולין (מותר)
                </Text>
              </View>
            </View>
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
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 60,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  resultRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
});
