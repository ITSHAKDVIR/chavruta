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

const KAPAROT_OPENING = `בְּנֵי אָדָם יוֹשְׁבֵי חֹשֶׁךְ וְצַלְמָוֶת, אֲסִירֵי עֳנִי וּבַרְזֶל. יוֹצִיאֵם מֵחֹשֶׁךְ וְצַלְמָוֶת, וּמוֹסְרוֹתֵיהֶם יְנַתֵּק. אֱוִילִים מִדֶּרֶךְ פִּשְׁעָם, וּמֵעֲוֺנֹתֵיהֶם יִתְעַנּוּ. כָּל אֹכֶל תְּתַעֵב נַפְשָׁם, וַיַּגִּיעוּ עַד שַׁעֲרֵי מָוֶת. וַיִּזְעֲקוּ אֶל ה' בַּצַּר לָהֶם, מִמְּצֻקוֹתֵיהֶם יוֹשִׁיעֵם. יִשְׁלַח דְּבָרוֹ וְיִרְפָּאֵם, וִימַלֵּט מִשְּׁחִיתוֹתָם. יוֹדוּ לַה' חַסְדּוֹ, וְנִפְלְאוֹתָיו לִבְנֵי אָדָם.

אִם יֵשׁ עָלָיו מַלְאָךְ מֵלִיץ אֶחָד מִנִּי אָלֶף, לְהַגִּיד לְאָדָם יָשְׁרוֹ. וַיְחֻנֶּנּוּ וַיֹּאמֶר, פְּדָעֵהוּ מֵרֶדֶת שַׁחַת, מָצָאתִי כֹפֶר.`;

const KAPAROT_MALE = `זֶה חֲלִיפָתִי, זֶה תְּמוּרָתִי, זֶה כַּפָּרָתִי. זֶה הַתַּרְנְגוֹל יֵלֵךְ לְמִיתָה, וַאֲנִי אֵלֵךְ וְאֶכָּנֵס לְחַיִּים טוֹבִים אֲרֻכִּים וּלְשָׁלוֹם.`;

const KAPAROT_FEMALE = `זֹאת חֲלִיפָתִי, זֹאת תְּמוּרָתִי, זֹאת כַּפָּרָתִי. זֹאת הַתַּרְנְגֹלֶת תֵּלֵךְ לְמִיתָה, וַאֲנִי אֵלֵךְ וְאֶכָּנֵס לְחַיִּים טוֹבִים אֲרֻכִּים וּלְשָׁלוֹם.`;

const KAPAROT_MONEY = `זֶה הַכֶּסֶף חֲלִיפָתִי, זֶה תְּמוּרָתִי, זֶה כַּפָּרָתִי. זֶה הַכֶּסֶף יֵלֵךְ לִצְדָקָה, וַאֲנִי אֵלֵךְ וְאֶכָּנֵס לְחַיִּים טוֹבִים אֲרֻכִּים וּלְשָׁלוֹם.`;

export default function KaparotScreen() {
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="כפרות" subtitle="ערב יום הכיפורים" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <HolidayCountdown holiday="erev-yom-kippur" inIsrael={inIsrael} />

          <Card variant="primary">
            <Text style={[typography.h3, { color: colors.textPrimary }]}>מנהג הכפרות</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              ערב יום כיפור נוהגים לעשות כפרות - על תרנגול (זכר) או תרנגולת (נקבה), או על כסף שנותנים לצדקה. סובבים סביב הראש 3 פעמים ואומרים את נוסח הכפרות.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.primary, marginBottom: 4 }]}>1. הקדמה (לכל אחד)</Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{KAPAROT_OPENING}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.primary, marginBottom: 4 }]}>2. נוסח לזכר (על תרנגול)</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              סובבים את התרנגול 3 פעמים סביב הראש ואומרים:
            </Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary, fontSize: 21 }]}>{KAPAROT_MALE}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.primary, marginBottom: 4 }]}>3. נוסח לנקבה (על תרנגולת)</Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary, fontSize: 21 }]}>{KAPAROT_FEMALE}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.primary, marginBottom: 4 }]}>4. נוסח לכפרות בכסף</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              לוקחים סכום כסף שמיועד לצדקה, מסובבים אותו סביב הראש 3 פעמים ואומרים:
            </Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary, fontSize: 21 }]}>{KAPAROT_MONEY}</Text>
            </View>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>הערות</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>זמן:</Text> בליל ערב יום כיפור או בבוקר ערב יום כיפור (לפני התפילה).{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>אישה בהריון:</Text> נוהגים לעשות גם זכר וגם נקבה (לכל מקרה).{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>כסף:</Text> רבים מעדיפים היום כפרות בכסף (חשש על צער בעלי חיים) - הכסף הולך לצדקה.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>מסירת התרנגול:</Text> שוחטים והבשר נמסר לעניים, או דמיו נתנים לצדקה.
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
  sacredBox: { padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
});
