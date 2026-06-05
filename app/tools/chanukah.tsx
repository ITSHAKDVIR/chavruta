import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, months } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { HolidayCountdown } from '../../src/components/HolidayCountdown';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const BRACHOT = [
  'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לְהַדְלִיק נֵר שֶׁל חֲנֻכָּה.',
  'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁעָשָׂה נִסִּים לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה.',
  'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.',
];

const HANEROT = `הַנֵּרוֹת הַלָּלוּ אָנוּ מַדְלִיקִין עַל הַנִּסִּים וְעַל הַנִּפְלָאוֹת וְעַל הַתְּשׁוּעוֹת וְעַל הַמִּלְחָמוֹת שֶׁעָשִׂיתָ לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה, עַל יְדֵי כֹּהֲנֶיךָ הַקְּדוֹשִׁים. וְכָל שְׁמוֹנַת יְמֵי חֲנֻכָּה, הַנֵּרוֹת הַלָּלוּ קֹדֶשׁ הֵם, וְאֵין לָנוּ רְשׁוּת לְהִשְׁתַּמֵּשׁ בָּהֶם אֶלָּא לִרְאוֹתָם בִּלְבַד, כְּדֵי לְהוֹדוֹת וּלְהַלֵּל לְשִׁמְךָ הַגָּדוֹל עַל נִסֶּיךָ וְעַל נִפְלְאוֹתֶיךָ וְעַל יְשׁוּעוֹתֶיךָ.`;

function chanukahDay(date: Date): number | null {
  const hd = new HDate(date);
  if (hd.getMonth() === months.KISLEV && hd.getDate() >= 25) return hd.getDate() - 24;
  if (hd.getMonth() === months.TEVET && hd.getDate() <= 3) return hd.getDate() + 5;
  if (hd.getMonth() === months.KISLEV && hd.getDate() === 30) return 6;
  return null;
}

export default function ChanukahScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const day = useMemo(() => chanukahDay(new Date()), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="חנוכה" subtitle="הדלקת נרות + ברכות" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {day ? (
            <Card variant="primary">
              <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>היום</Text>
              <Text style={[typography.display, { color: colors.textPrimary, marginTop: 4 }]}>🕎 יום {day}</Text>
              <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
                מדליקים {day} נרות (בנוסף לשמש)
              </Text>
            </Card>
          ) : (
            <HolidayCountdown holiday="chanukah" inIsrael={inIsrael} />
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>סדר ההדלקה</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              1. ממקמים את הנרות מימין לשמאל - יום ראשון נר אחד מימין.{'\n'}
              2. מדליקים מהנר השמאלי ביותר (החדש) וממשיכים ימינה.{'\n'}
              3. אומרים את הברכות לפני ההדלקה (בלילה ראשון - 3 ברכות, בשאר הלילות - 2).{'\n'}
              4. אחרי ההדלקה - "הנרות הללו".{'\n'}
              5. נשארים על-יד הנרות לפחות חצי שעה.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>הברכות</Text>
            {BRACHOT.slice(0, day === 1 ? 3 : 2).map((b, i) => (
              <View key={i} style={[styles.brachaBox, { marginBottom: spacing.sm }]}>
                <Text style={[typography.caption, { color: colors.primary }]}>ברכה {i + 1}</Text>
                <Text style={[typography.sacred, { color: colors.textPrimary, marginTop: 4 }]}>{b}</Text>
              </View>
            ))}
            {day === 1 && (
              <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
                ברכה 3 (שהחיינו) רק בלילה הראשון
              </Text>
            )}
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>הנרות הללו</Text>
            <View style={[styles.brachaBox]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{HANEROT}</Text>
            </View>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>זמן ההדלקה</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              <Text style={{ fontWeight: '700' }}>אשכנזים</Text>: בצאת הכוכבים (כ-18 דק׳ אחרי שקיעה).{'\n'}
              <Text style={{ fontWeight: '700' }}>ספרדים / חסידים</Text>: בשקיעה.{'\n'}
              <Text style={{ fontWeight: '700' }}>ערב שבת</Text>: לפני הדלקת נרות שבת (כ-20 דק׳ לפני שקיעה).{'\n'}
              <Text style={{ fontWeight: '700' }}>מוצאי שבת</Text>: אחרי הבדלה.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>על הניסים (בתפילה ובברכת המזון)</Text>
            <View style={[styles.brachaBox, { marginTop: spacing.sm }]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>
                עַל הַנִּסִּים וְעַל הַפֻּרְקָן וְעַל הַגְּבוּרוֹת וְעַל הַתְּשׁוּעוֹת וְעַל הַמִּלְחָמוֹת שֶׁעָשִׂיתָ לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה. בִּימֵי מַתִּתְיָהוּ בֶּן יוֹחָנָן כֹּהֵן גָּדוֹל חַשְׁמוֹנָאִי וּבָנָיו...
              </Text>
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
  brachaBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
