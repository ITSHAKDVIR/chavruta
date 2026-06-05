import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { HolidayCountdown } from '../../src/components/HolidayCountdown';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const LESHEM_YICHUD = `לְשֵׁם יִחוּד קֻדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּיהּ, בִּדְחִילוּ וּרְחִימוּ, לְיַחֵד שֵׁם י"ה בְּו"ה בְּיִחוּדָא שְׁלִים בְּשֵׁם כָּל יִשְׂרָאֵל.

הִנְנִי מוּכָן וּמְזֻמָּן לְקַיֵּם מִצְוַת עֲשֵׂה שֶׁל נְטִילַת לוּלָב, אֶתְרוֹג, הֲדַסִּים וַעֲרָבוֹת, כְּמוֹ שֶׁכָּתוּב בַּתּוֹרָה: "וּלְקַחְתֶּם לָכֶם בַּיּוֹם הָרִאשׁוֹן פְּרִי עֵץ הָדָר כַּפֹּת תְּמָרִים וַעֲנַף עֵץ עָבֹת וְעַרְבֵי נָחַל, וּשְׂמַחְתֶּם לִפְנֵי ה' אֱלֹהֵיכֶם שִׁבְעַת יָמִים".

וִיהִי נֹעַם ה' אֱלֹהֵינוּ עָלֵינוּ, וּמַעֲשֵׂה יָדֵינוּ כּוֹנְנָה עָלֵינוּ, וּמַעֲשֵׂה יָדֵינוּ כּוֹנְנֵהוּ.`;

const BIRKAT_LULAV = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֺתָיו וְצִוָּנוּ עַל נְטִילַת לוּלָב.`;

const SHEHECHEYANU = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.`;

export default function NetilatArbaMinimScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="נטילת ארבעת המינים" subtitle="לשם יחוד, ברכה, ניענוע" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <HolidayCountdown holiday="sukkot" inIsrael={inIsrael} />

          <Card variant="primary">
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הכנה</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              מהדקים את הלולב עם 3 הדסים מימינו ו-2 ערבות משמאלו ביד ימין. את האתרוג מחזיקים ביד שמאל, בתחילה כשהפיטם <Text style={{ fontWeight: '700' }}>כלפי מטה</Text> (כדי שהברכה לא תחול עליו עוד לפני שמחברים).
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h2, { color: colors.primary, marginBottom: 4 }]}>1. לשם יחוד</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              לפני הברכה. אומרים בעמידה.
            </Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{LESHEM_YICHUD}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h2, { color: colors.primary, marginBottom: 4 }]}>2. ברכת הנטילה</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              אוחזים בלולב ביד ימין כשפיטם האתרוג כלפי מטה, ומברכים:
            </Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary, fontSize: 21 }]}>{BIRKAT_LULAV}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h2, { color: colors.primary, marginBottom: 4 }]}>3. ברכת שהחיינו</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              נאמרת רק <Text style={{ fontWeight: '700' }}>בפעם הראשונה בכל החג</Text> (יום ראשון של סוכות, ובחו"ל גם ביו"ט שני). מי שלא בירך ביום הראשון - מברך כשלוקח בפעם הראשונה.
            </Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary, fontSize: 21 }]}>{SHEHECHEYANU}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h2, { color: colors.primary, marginBottom: 4 }]}>4. הפיכת האתרוג וניענוע</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
              לאחר הברכה, הופכים את האתרוג כך שהפיטם כלפי מעלה, ומחברים אותו ללולב.{'\n\n'}
              <Text style={{ fontWeight: '700' }}>סדר הניענוע (מנהג ספרד/חב"ד):</Text>{'\n'}
              דרום (ימין) → צפון (שמאל) → מזרח (קדימה) → מעלה → מטה → מערב (חזרה לחזה).{'\n\n'}
              <Text style={{ fontWeight: '700' }}>מנהג אשכנז:</Text>{'\n'}
              מזרח → דרום → מערב → צפון → מעלה → מטה.{'\n\n'}
              בכל כיוון - 3 ניענועים. סך הכל 18 ניענועים. בכל ניענוע: דוחפים את הלולב לכיוון, רועדים את העלים, ומחזירים לחזה.
            </Text>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>מתי מנענעים</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>בשעת הנטילה</Text> (אחרי הברכה){'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>בהלל</Text> - ב"הודו" (בהתחלה ובסוף) וב"אנא ה' הושיעה נא"{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>בהושענות</Text> - בכל הקפה
            </Text>
          </Card>

          <Card>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>הערות:</Text>{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>בשבת</Text> - אין נוטלים ארבעת המינים גם בחג.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>ביום הראשון</Text> מצוות הנטילה מן התורה. בשאר הימים - מדרבנן.
            </Text>
          </Card>

          <Pressable onPress={() => router.push('/tools/arba-minim' as any)} style={styles.linkBox}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>← מעבר לבדיקת ארבעת המינים</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  sacredBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkBox: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
