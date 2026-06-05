import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { useLocation } from '../../src/hooks/useLocation';
import { computeZmanim, formatTime, hebrewDateInfo } from '../../src/data/hebcal';
import { getString, setString, Keys } from '../../src/storage/storage';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

function nextSaturday(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(20, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + ((6 - day + 7) % 7 || 7));
  return d;
}

/** Havdalah text — two nusach versions. Ashkenazi is shorter (just פסוקי
 *  הישועה); Sephardi adds the full סדר חליצת המנעלים-style opening with
 *  ראשון לציון verses and longer introduction. */
const HAVDALAH_INTRO_ASHKENAZI = `הִנֵּה אֵ-ל יְשׁוּעָתִי, אֶבְטַח וְלֹא אֶפְחָד, כִּי עָזִּי וְזִמְרָת יָ-הּ ה', וַיְהִי לִי לִישׁוּעָה. וּשְׁאַבְתֶּם מַיִם בְּשָׂשׂוֹן, מִמַּעַיְנֵי הַיְשׁוּעָה. לַה' הַיְשׁוּעָה, עַל עַמְּךָ בִרְכָתֶךָ סֶּלָה. ה' צְבָאוֹת עִמָּנוּ, מִשְׂגָּב לָנוּ אֱלֹהֵי יַעֲקֹב סֶלָה. ה' צְבָאוֹת, אַשְׁרֵי אָדָם בֹּטֵחַ בָּךְ. ה' הוֹשִׁיעָה, הַמֶּלֶךְ יַעֲנֵנוּ בְיוֹם קָרְאֵנוּ.

לַיְּהוּדִים הָיְתָה אוֹרָה וְשִׂמְחָה וְשָׂשׂוֹן וִיקָר, כֵּן תִּהְיֶה לָּנוּ. כּוֹס יְשׁוּעוֹת אֶשָּׂא, וּבְשֵׁם ה' אֶקְרָא.

סַבְרִי מָרָנָן וְרַבָּנָן וְרַבּוֹתַי:`;

const HAVDALAH_INTRO_SEPHARDI = `רִאשׁוֹן לְצִיּוֹן הִנֵּה הִנָּם, וְלִירוּשָׁלַיִם מְבַשֵּׂר אֶתֵּן.

הִנֵּה אֵ-ל יְשׁוּעָתִי, אֶבְטַח וְלֹא אֶפְחָד, כִּי עָזִּי וְזִמְרָת יָ-הּ ה', וַיְהִי לִי לִישׁוּעָה. וּשְׁאַבְתֶּם מַיִם בְּשָׂשׂוֹן, מִמַּעַיְנֵי הַיְשׁוּעָה.

לַה' הַיְשׁוּעָה, עַל עַמְּךָ בִרְכָתֶךָ סֶּלָה. ה' צְבָאוֹת עִמָּנוּ, מִשְׂגָּב לָנוּ אֱלֹהֵי יַעֲקֹב סֶלָה. ה' צְבָאוֹת אַשְׁרֵי אָדָם בֹּטֵחַ בָּךְ. ה' הוֹשִׁיעָה, הַמֶּלֶךְ יַעֲנֵנוּ בְיוֹם קָרְאֵנוּ.

לַיְּהוּדִים הָיְתָה אוֹרָה וְשִׂמְחָה וְשָׂשׂוֹן וִיקָר. כֵּן תִּהְיֶה לָּנוּ. כּוֹס יְשׁוּעוֹת אֶשָּׂא וּבְשֵׁם ה' אֶקְרָא. אָנָּא ה' הוֹשִׁיעָה נָּא, אָנָּא ה' הַצְלִיחָה נָּא, אָנָּא ה' עֲנֵנוּ בְיוֹם קָרְאֵנוּ.

סַבְרִי מָרָנָן וְרַבָּנָן וְרַבּוֹתַי:`;

const HAVDALAH_BRACHOT = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.

[על הבשמים:]
בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא מִינֵי בְשָׂמִים.

[על הנר:]
בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא מְאוֹרֵי הָאֵשׁ.

[ברכת ההבדלה:]
בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחוֹל, בֵּין אוֹר לְחֹשֶׁךְ, בֵּין יִשְׂרָאֵל לָעַמִּים, בֵּין יוֹם הַשְּׁבִיעִי לְשֵׁשֶׁת יְמֵי הַמַּעֲשֶׂה. בָּרוּךְ אַתָּה ה' הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחוֹל.`;

export default function MotzaeiShabbatScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const saturday = useMemo(() => nextSaturday(new Date()), []);
  const z = useMemo(() => computeZmanim(saturday, location), [location, saturday.toDateString()]);

  // Nusach picker — reads/persists the global siddur nusach preference so
  // choosing here also updates the rest of the app. Sephardi gets the
  // longer havdalah intro; everyone else gets the standard Ashkenazi text.
  const [nusach, setNusachState] = useState<string>('ashkenazi');
  useEffect(() => {
    getString(Keys.nusach, 'ashkenazi').then(setNusachState);
  }, []);
  async function setNusach(n: string) {
    setNusachState(n);
    await setString(Keys.nusach, n);
  }
  const isSephardi = nusach === 'sephardi' || nusach === 'edot-mizrach';
  const havdalahIntro = isSephardi ? HAVDALAH_INTRO_SEPHARDI : HAVDALAH_INTRO_ASHKENAZI;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="מוצאי שבת" subtitle="זמני יציאת שבת + הבדלה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="primary">
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>שבת הקרובה</Text>
            <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 2 }]}>
              {hebrewDateInfo(saturday).gematria}
            </Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: 4 }]}>
              לפי {location.name}
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}>זמני יציאת שבת</Text>
            <Row
              label="צאת הכוכבים"
              time={formatTime(z.tzeitShabbat, location.timezone)}
              note="צאת 3 כוכבים קטנים (8.5° מתחת לאופק)"
            />
            <Row
              label="צאת הכוכבים (תוספת)"
              time={formatTime(z.tzeitShabbatStrict, location.timezone)}
              note="13.5° מתחת לאופק - בערך 10 דק׳ לאחר הקודם"
            />
            <Row
              label="רבנו תם"
              time={formatTime(z.tzeit72min, location.timezone)}
              note="72 דקות לאחר השקיעה"
            />
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              הזמנים מחושבים לפי המיקום והעונה - לא קבועים על 42 דקות.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>סדר הבדלה</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>1. הכנת הכוס</Text> - מוזגים יין או מיץ ענבים על גדותיו של הכוס (לפחות רביעית), עד שמעט נוזל זולג. נהוג להעמיד את הכוס על כף יד ימין.{'\n\n'}

              <Text style={{ fontWeight: '700' }}>2. בשמים ונר</Text> - מכינים בשמים (ציפורן, עלי הדס, או עציץ ריחני) ונר הבדלה בעל לפחות שני פתילים שלהבת אחת.{'\n\n'}

              <Text style={{ fontWeight: '700' }}>3. פסוקי הפתיחה</Text> - אומרים בעמידה את פסוקי "הנה א-ל ישועתי" וכו'.{'\n\n'}

              <Text style={{ fontWeight: '700' }}>4. ברכת הגפן</Text> - אוחזים את הכוס ביד ימין ומברכים "בורא פרי הגפן". לא טועמים עדיין.{'\n\n'}

              <Text style={{ fontWeight: '700' }}>5. ברכת הבשמים</Text> - מעבירים את הכוס ליד שמאל, נוטלים את הבשמים ביד ימין, מברכים "בורא מיני בשמים" ומריחים.{'\n\n'}

              <Text style={{ fontWeight: '700' }}>6. ברכת הנר</Text> - אוחזים את הנר, מברכים "בורא מאורי האש" ומסתכלים באור הנר על הציפורניים (כדי להבחין בין צל לאור).{'\n\n'}

              <Text style={{ fontWeight: '700' }}>7. ברכת ההבדלה</Text> - מחזירים את הכוס ליד ימין ומברכים "המבדיל בין קודש לחול".{'\n\n'}

              <Text style={{ fontWeight: '700' }}>8. שתיית היין</Text> - יושבים ושותים מן הכוס (לכל הפחות רוב רביעית). שאר היין שנותר - מכבים בו את הנר (מנהג רבים).{'\n\n'}

              <Text style={{ fontWeight: '700' }}>9. סיום</Text> - נהוג לטבול אצבעות ביין שנשפך ולמשוח על העיניים והכיסים לסימן ברכה. מברכים "ברכה אחרונה" (על המחיה / על הגפן) אם שתו רביעית.
            </Text>
          </Card>

          <Card>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>נוסח ההבדלה</Text>
            </View>
            {/* Nusach selector — Sephardi gets the longer intro with "ראשון
                לציון" and additional verses; Ashkenazi (default) gets the
                standard text. */}
            <View style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: spacing.md, flexWrap: 'wrap' }}>
              {[
                { id: 'ashkenazi', label: 'אשכנז' },
                { id: 'sephardi', label: 'ספרד' },
                { id: 'edot-mizrach', label: 'עדות מזרח' },
                { id: 'chabad', label: 'חב״ד' },
              ].map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => setNusach(opt.id)}
                  style={[styles.nusachBtn, nusach === opt.id && styles.nusachBtnActive]}
                >
                  <Text style={[typography.caption, { color: nusach === opt.id ? colors.textInverse : colors.textPrimary }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[typography.bodyBold, { color: colors.primary, marginBottom: 4 }]}>פסוקי הפתיחה (בעמידה):</Text>
            <View style={[styles.brachaBox]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{havdalahIntro}</Text>
            </View>
            <Text style={[typography.bodyBold, { color: colors.primary, marginTop: spacing.md, marginBottom: 4 }]}>הברכות:</Text>
            <View style={[styles.brachaBox]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{HAVDALAH_BRACHOT}</Text>
            </View>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, time, note }: { label: string; time: string; note?: string }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>{label}</Text>
        {note ? <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{note}</Text> : null}
      </View>
      <Text style={[typography.h3, { color: colors.primary }]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brachaBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nusachBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  nusachBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
