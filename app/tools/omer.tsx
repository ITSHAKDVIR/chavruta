import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, months } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { omerDay } from '../../src/data/hebcal';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const SEFIROT = ['חסד', 'גבורה', 'תפארת', 'נצח', 'הוד', 'יסוד', 'מלכות'];

function omerText(day: number): string {
  const week = Math.floor((day - 1) / 7);
  const dayInWeek = ((day - 1) % 7) + 1;
  const numerals = ['', 'אחד', 'שני', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה'];
  if (day === 1) return 'הַיּוֹם יוֹם אֶחָד לָעֹמֶר.';
  if (day < 7) return `הַיּוֹם ${numerals[day]} יָמִים לָעֹמֶר.`;
  if (day === 7) return 'הַיּוֹם שִׁבְעָה יָמִים שֶׁהֵם שָׁבוּעַ אֶחָד לָעֹמֶר.';

  const weeksWord =
    week === 1 ? 'שָׁבוּעַ אֶחָד' : week === 2 ? 'שְׁנֵי שָׁבוּעוֹת' : `${numerals[week]} שָׁבוּעוֹת`;
  if (dayInWeek === 0 || dayInWeek === 7) {
    return `הַיּוֹם ${day} יוֹם שֶׁהֵם ${weeksWord} לָעֹמֶר.`;
  }
  const dayWord = dayInWeek === 1 ? 'יוֹם אֶחָד' : `${numerals[dayInWeek]} יָמִים`;
  return `הַיּוֹם ${day} יוֹם שֶׁהֵם ${weeksWord} וְ${dayWord} לָעֹמֶר.`;
}

function sefiraOfDay(day: number): { upper: string; lower: string; combined: string } {
  const week = Math.floor((day - 1) / 7);
  const inWeek = (day - 1) % 7;
  const upper = SEFIROT[week] ?? '—';
  const lower = SEFIROT[inWeek] ?? '—';
  return { upper, lower, combined: `${lower} שב${upper}` };
}

/** Returns the start date of Omer (16 Nisan) for the year containing the given date. */
function omerStart(date: Date): Date {
  const hd = new HDate(date);
  const y = hd.getMonth() <= months.NISAN ? hd.getFullYear() : hd.getFullYear() + 1;
  return new HDate(16, months.NISAN, y).greg();
}

function omerEnd(date: Date): Date {
  const hd = new HDate(date);
  const y = hd.getMonth() <= months.NISAN ? hd.getFullYear() : hd.getFullYear() + 1;
  return new HDate(5, months.SIVAN, y).greg();
}

export default function OmerScreen() {
  const router = useRouter();
  const today = new Date();
  const day = omerDay(today);
  const [selectedDay, setSelectedDay] = useState<number | null>(day);
  const viewDay = selectedDay ?? day ?? 1;

  const omerInfo = useMemo(() => {
    const start = omerStart(today);
    const end = omerEnd(today);
    const now = today.getTime();
    const startMs = start.getTime();
    const endMs = end.getTime();
    if (now < startMs) {
      const daysUntil = Math.ceil((startMs - now) / 86_400_000);
      return { status: 'before' as const, start, end, daysUntil };
    }
    if (now > endMs) {
      // Calculate next year's omer
      const hd = new HDate(today);
      const nextY = hd.getMonth() >= months.SIVAN ? hd.getFullYear() + 1 : hd.getFullYear();
      const nextStart = new HDate(16, months.NISAN, nextY).greg();
      const daysUntil = Math.ceil((nextStart.getTime() - now) / 86_400_000);
      return { status: 'after' as const, start, end, daysUntilNext: daysUntil, nextStart };
    }
    return { status: 'in-season' as const, start, end };
  }, [today.toDateString()]);

  const sefira = sefiraOfDay(viewDay);

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
          title="ספירת העומר"
          subtitle={day ? `יום ${day} מתוך 49` : 'מועד הספירה'}
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* IN SEASON - main display */}
          {day && (
            <Card variant="primary">
              <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>היום בעומר</Text>
              <Text style={{ fontSize: 110, color: colors.textPrimary, fontWeight: '700', lineHeight: 120 }}>
                {day}
              </Text>
              <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.95 }]}>
                {omerText(day)}
              </Text>
              <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md, opacity: 0.95 }]}>
                ✦ מידת היום: {sefira.combined}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(day / 49) * 100}%` }]} />
              </View>
              <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.85, marginTop: 4 }]}>
                {49 - day} ימים נותרו עד שבועות
              </Text>
            </Card>
          )}

          {/* OFF-SEASON - useful info */}
          {!day && omerInfo.status === 'before' && (
            <Card variant="primary">
              <Text style={[typography.h2, { color: colors.textPrimary }]}>⏳ ספירת העומר בקרוב</Text>
              <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.95, marginTop: spacing.sm }]}>
                הספירה תתחיל במוצאי יום ראשון של פסח, בעוד <Text style={{ fontWeight: '700' }}>{omerInfo.daysUntil} ימים</Text>
                {' '}({omerInfo.start.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}).
              </Text>
            </Card>
          )}

          {!day && omerInfo.status === 'after' && (
            <Card variant="accent">
              <Text style={[typography.h2, { color: colors.primaryDark }]}>✓ סיימנו את ספירת העומר השנה</Text>
              <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9, marginTop: spacing.sm }]}>
                הספירה השנה הייתה {omerInfo.start.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })} – {omerInfo.end.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}.
              </Text>
              <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
                הספירה הבאה תתחיל ב-{omerInfo.nextStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' '}(בעוד {omerInfo.daysUntilNext} ימים).
              </Text>
            </Card>
          )}

          {/* Browsable day picker */}
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              עיון ב-49 הימים
            </Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              לחץ על יום כדי לראות את המידה והנוסח שלו.
            </Text>
            <View style={styles.grid}>
              {Array.from({ length: 49 }, (_, i) => i + 1).map((n) => {
                const isToday = n === day;
                const isSelected = n === viewDay;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setSelectedDay(n)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellActive,
                      isToday && styles.dayCellToday,
                    ]}
                  >
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: isSelected ? colors.textInverse : isToday ? '#8B3A62' : colors.textPrimary },
                      ]}
                    >
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {day && (
              <Text style={[typography.caption, { color: '#8B3A62', marginTop: spacing.sm, textAlign: 'center' }]}>
                ✦ יום {day} = היום
              </Text>
            )}
          </Card>

          {/* Display the selected day's text */}
          {(selectedDay && selectedDay !== day) || !day ? (
            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>
                יום {viewDay} ({hebrewNumeral(viewDay)})
              </Text>
              <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.sm }]}>
                {omerText(viewDay)}
              </Text>
              <Text style={[typography.body, { color: colors.primaryDark, marginTop: spacing.sm }]}>
                ✦ מידת היום: {sefira.combined}
              </Text>
            </Card>
          ) : null}

          {/* Bracha + format - shown only in season */}
          {day && (
            <>
              {/* לשם יחוד — kabbalistic introduction said before the bracha, per Rabbi Dvir's review (comment 182). */}
              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>לשם יחוד</Text>
                <Text style={[typography.sacred, { color: colors.textPrimary, marginTop: spacing.sm }]}>
                  לְשֵׁם יִחוּד קֻדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּיהּ, בִּדְחִילוּ וּרְחִימוּ, וּרְחִימוּ וּדְחִילוּ, לְיַחֲדָא שֵׁם י״ה בְּו״ה בְּיִחוּדָא שְׁלִים בְּשֵׁם כָּל יִשְׂרָאֵל. הִנְנִי מוּכָן וּמְזֻמָּן לְקַיֵּם מִצְוַת עֲשֵׂה שֶׁל סְפִירַת הָעֹמֶר, כְּמוֹ שֶׁכָּתוּב בַּתּוֹרָה: "וּסְפַרְתֶּם לָכֶם מִמָּחֳרַת הַשַּׁבָּת מִיּוֹם הֲבִיאֲכֶם אֶת עֹמֶר הַתְּנוּפָה, שֶׁבַע שַׁבָּתוֹת תְּמִימֹת תִּהְיֶינָה. עַד מִמָּחֳרַת הַשַּׁבָּת הַשְּׁבִיעִית תִּסְפְּרוּ חֲמִשִּׁים יוֹם, וְהִקְרַבְתֶּם מִנְחָה חֲדָשָׁה לַה'". וִיהִי נֹעַם ה' אֱלֹהֵינוּ עָלֵינוּ, וּמַעֲשֵׂה יָדֵינוּ כּוֹנְנָה עָלֵינוּ, וּמַעֲשֵׂה יָדֵינוּ כּוֹנְנֵהוּ.
                </Text>
              </Card>

              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>ברכה</Text>
                <Text style={[typography.sacred, { color: colors.textPrimary, marginTop: spacing.sm }]}>
                  בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל סְפִירַת הָעֹמֶר.
                </Text>
              </Card>

              {/* "Ribono shel olam" — the standard kabbalistic prayer recited after counting the omer. */}
              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>רבונו של עולם (נאמר אחרי הספירה)</Text>
                <Text style={[typography.sacred, { color: colors.textPrimary, marginTop: spacing.sm }]}>
                  {`רִבּוֹנוֹ שֶׁל עוֹלָם, אַתָּה צִוִּיתָנוּ עַל יְדֵי מֹשֶׁה עַבְדֶּךָ לִסְפֹּר סְפִירַת הָעֹמֶר, כְּדֵי לְטַהֲרֵנוּ מִקְּלִפּוֹתֵינוּ וּמִטֻּמְאוֹתֵינוּ, כְּמוֹ שֶׁכָּתַבְתָּ בְּתוֹרָתֶךָ: "וּסְפַרְתֶּם לָכֶם מִמָּחֳרַת הַשַּׁבָּת... שֶׁבַע שַׁבָּתוֹת תְּמִימֹת תִּהְיֶינָה". כְּדֵי שֶׁיִּטָּהֲרוּ נַפְשׁוֹת עַמְּךָ יִשְׂרָאֵל מִזֻּהֲמָתָם. וּבְכֵן יְהִי רָצוֹן מִלְּפָנֶיךָ ה' אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁבִּזְכוּת סְפִירַת הָעֹמֶר שֶׁסָּפַרְתִּי הַיּוֹם (${sefira.combined}), יְתֻקַּן מַה שֶּׁפָּגַמְתִּי בִּסְפִירָה זוֹ, וְאֶטָּהֵר וְאֶתְקַדֵּשׁ בִּקְדֻשָּׁה שֶׁל מַעְלָה, וְעַל יְדֵי זֶה יֻשְׁפַּע שֶׁפַע רַב בְּכָל הָעוֹלָמוֹת, וּלְתַקֵּן אֶת נַפְשׁוֹתֵינוּ וְרוּחוֹתֵינוּ וְנִשְׁמוֹתֵינוּ מִכָּל סִיג וּפְגָם, וּלְטַהֲרֵנוּ וּלְקַדְּשֵׁנוּ בִּקְדֻשָּׁתְךָ הָעֶלְיוֹנָה, אָמֵן סֶלָה.`}
                </Text>
              </Card>

              <Card variant="accent">
                <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>הרחמן - אחרי הספירה</Text>
                <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
                  הָרַחֲמָן הוּא יַחֲזִיר לָנוּ עֲבוֹדַת בֵּית הַמִּקְדָּשׁ לִמְקוֹמָהּ בִּמְהֵרָה בְּיָמֵינוּ, אָמֵן סֶלָה.
                </Text>
              </Card>
            </>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הלכות יסוד</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              ⊙ ספירת העומר משעת צאת הכוכבים (אחרי שקיעה).{'\n'}
              ⊙ שכח לספור בלילה - יספור ביום בלי ברכה, וימשיך בברכה בלילה הבא.{'\n'}
              ⊙ שכח יום שלם - ימשיך לספור בלי ברכה.{'\n'}
              ⊙ ספרדים: סופרים בעמידה. אשכנזים: אפשר גם בישיבה.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>ל"ג בעומר</Text> = יום 33. {day === 33 ? '⭐ זה היום!' : ''}
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
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 3,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  dayCellToday: { borderColor: '#8B3A62', borderWidth: 2 },
});
