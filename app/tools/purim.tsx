import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { SefariaReader } from '../../src/components/SefariaReader';
import { FloatingRaashan } from '../../src/components/FloatingRaashan';
import { useLocation } from '../../src/hooks/useLocation';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const BIRKAT_BEFORE = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֺתָיו וְצִוָּנוּ עַל מִקְרָא מְגִלָּה.

בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁעָשָׂה נִסִּים לַאֲבוֹתֵינוּ, בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה.

בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.`;

const BIRKAT_AFTER = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הָרָב אֶת רִיבֵנוּ, וְהַדָּן אֶת דִּינֵנוּ, וְהַנּוֹקֵם אֶת נִקְמָתֵנוּ, וְהַמְשַׁלֵּם גְּמוּל לְכָל אוֹיְבֵי נַפְשֵׁנוּ, וְהַנִּפְרָע לָנוּ מִצָּרֵינוּ. בָּרוּךְ אַתָּה ה', הַנִּפְרָע לְעַמּוֹ יִשְׂרָאֵל מִכָּל צָרֵיהֶם, הָאֵל הַמּוֹשִׁיעַ.`;

const SHOSHANAT_YAAKOV = `שׁוֹשַׁנַּת יַעֲקֹב צָהֲלָה וְשָׂמֵחָה, בִּרְאוֹתָם יַחַד תְּכֵלֶת מָרְדֳּכָי.
תְּשׁוּעָתָם הָיִיתָ לָנֶצַח, וְתִקְוָתָם בְּכָל דּוֹר וָדוֹר.
לְהוֹדִיעַ שֶׁכָּל קֹוֶיךָ לֹא יֵבֹשׁוּ, וְלֹא יִכָּלְמוּ לָנֶצַח כָּל הַחוֹסִים בָּךְ.
אָרוּר הָמָן אֲשֶׁר בִּקֵּשׁ לְאַבְּדִי, בָּרוּךְ מָרְדֳּכַי הַיְּהוּדִי.
אֲרוּרָה זֶרֶשׁ אֵשֶׁת מַפְחִידִי, בְּרוּכָה אֶסְתֵּר בַּעֲדִי.
וְגַם חַרְבוֹנָה זָכוּר לַטּוֹב.`;

// אשר הניא — נאמר רק בקריאת הלילה (לפני שושנת יעקב באשכנז, ולפי הספרדים אחרי).
const ASHER_HENI = `אֲשֶׁר הֵנִיא עֲצַת גּוֹיִם, וַיָּפֶר מַחְשְׁבוֹת עֲרוּמִים. בְּקוּם עָלֵינוּ אָדָם רָשָׁע, נֵצֶר זָדוֹן מִזֶּרַע עֲמָלֵק.
גָּאָה בְעָשְׁרוֹ וְכָרָה לוֹ בּוֹר, וּגְדֻלָּתוֹ יָקְשָׁה לּוֹ לָכֶד. דִּמָּה בְנַפְשׁוֹ לִלְכֹּד וְנִלְכָּד, בִּקֵּשׁ לְהַשְׁמִיד וְנִשְׁמַד מְהֵרָה.
הָמָן הוֹדִיעַ אֵיבַת אֲבוֹתָיו, וְעוֹרֵר שִׂנְאַת אַחִים לַבָּנִים. וְלֹא זָכַר רַחֲמֵי שָׁאוּל כִּי בְחֶמְלָתוֹ עַל אֲגָג נוֹלַד אוֹיֵב.
זָמַם רָשָׁע לְהַכְרִית צַדִּיק, וְנִלְכַּד טָמֵא בִּידֵי טָהוֹר. חֶסֶד גָּבַר עַל שִׁגְגַת אָב, וְרָשָׁע הוֹסִיף חֵטְא עַל חֲטָאָיו.
טָמַן בְּלִבּוֹ מַחְשְׁבוֹת עֲרוּמָיו, וַיִּתְמַכֵּר לַעֲשׂוֹת רָעָה. יָדוֹ שָׁלַח בִּקְדוֹשֵׁי אֵל, כַּסְפּוֹ נָתַן לְהַכְרִית זִכְרָם.
כִּרְאוֹת מָרְדֳּכַי כִּי יָצָא קֶצֶף וְדָתֵי הָמָן נִתְּנוּ בְשׁוּשָׁן, לָבַשׁ שַׂק וְקָשַׁר מִסְפֵּד, וְגָזַר צוֹם וַיֵּשֶׁב עַל הָאֵפֶר.
מִי זֶה יַעֲמֹד לְכַפֵּר שְׁגָגָה, וְלִמְחֹל חַטַּאת עֲוֹן אֲבוֹתֵינוּ. נֵץ פָּרַח מִלּוּלָב, הֵן הֲדַסָּה עָמְדָה לְעוֹרֵר יְשֵׁנִים.
סָרִיסֶיהָ הִבְהִילוּ לְהָמָן, לְהַשְׁקוֹתוֹ יֵין חֲמַת תַּנִּינִים. עָמַד בְּעָשְׁרוֹ וְנָפַל בְּרִשְׁעוֹ, עָשָׂה לוֹ עֵץ וְנִתְלָה עָלָיו.
פִּיהֶם פָּתְחוּ כָּל יוֹשְׁבֵי תֵבֵל, כִּי פּוּר הָמָן נֶהְפַּךְ לְפוּרֵנוּ. צַדִּיק נֶחֱלַץ מִיַּד רָשָׁע, אוֹיֵב נִתַּן תַּחַת נַפְשׁוֹ.
קִיְּמוּ עֲלֵיהֶם לַעֲשׂוֹת פּוּרִים, וְלִשְׂמֹחַ בְּכָל שָׁנָה וְשָׁנָה. רָאִיתָ אֶת תְּפִלַּת מָרְדֳּכַי וְאֶסְתֵּר, הָמָן וּבָנָיו עַל הָעֵץ תָּלִיתָ.`;

/** Purim Maariv (night reading) runs from start of 14 Adar until the next morning's daylight reading. */
function isPurimMaarivTime(date: Date): boolean {
  // Show "Asher Heni" from sunset of 13 Adar until ~6am of 14 Adar.
  // Simple heuristic: between 17:00 and 06:00 local time.
  const h = date.getHours();
  return h >= 17 || h < 6;
}

export default function PurimScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';

  const [chapter, setChapter] = useState<number>(1);
  const [showText, setShowText] = useState<boolean>(false);
  const isNight = isPurimMaarivTime(new Date());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="פורים - מגילת אסתר" subtitle="הטקסט המלא + ברכות" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="primary">
            <Text style={[typography.h2, { color: colors.textPrimary }]}>📜 מגילת אסתר</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              קוראים את המגילה פעמיים: בליל פורים ובבוקר. ארבעת פסוקי הגאולה ("איש יהודי", "מרדכי יצא", "ליהודים הייתה", "כי מרדכי") - הקהל אומר ואחריו הקורא.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
              ברכות לפני הקריאה (3 ברכות)
            </Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BIRKAT_BEFORE}</Text>
            </View>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              בקריאת הבוקר - ברכת "שהחיינו" נאמרת לפי מקצת מנהגי האשכנזים, ולא נאמרת לפי מנהג הספרדים.
            </Text>
          </Card>

          {/* Megillah text - shown on demand */}
          <Card>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>📖 הטקסט המלא</Text>
              <Pressable onPress={() => setShowText(!showText)} hitSlop={10}>
                <Text style={[typography.bodyBold, { color: colors.primary }]}>
                  {showText ? 'הסתר' : 'הצג ↓'}
                </Text>
              </Pressable>
            </View>
            {showText && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  בחר פרק:
                </Text>
                <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setChapter(c)}
                      style={[styles.chapChip, chapter === c && styles.chapChipActive]}
                    >
                      <Text
                        style={[
                          typography.bodyBold,
                          { color: chapter === c ? colors.textInverse : colors.textPrimary },
                        ]}
                      >
                        {hebrewNumeral(c)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Card>

          {showText && (
            <SefariaReader
              refs={`Esther.${chapter}`}
              showVerseNumbers
              hideToggles
              inIsrael={inIsrael}
            />
          )}

          {showText && (
            <Card>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                <Pressable
                  onPress={() => chapter > 1 && setChapter(chapter - 1)}
                  disabled={chapter <= 1}
                  style={[styles.navBtn, chapter <= 1 && styles.navBtnDisabled]}
                >
                  <Text style={[typography.bodyBold, { color: chapter <= 1 ? colors.textMuted : colors.primary }]}>
                    ‹ פרק {hebrewNumeral(chapter - 1)}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => chapter < 10 && setChapter(chapter + 1)}
                  disabled={chapter >= 10}
                  style={[styles.navBtn, chapter >= 10 && styles.navBtnDisabled]}
                >
                  <Text style={[typography.bodyBold, { color: chapter >= 10 ? colors.textMuted : colors.primary }]}>
                    פרק {hebrewNumeral(chapter + 1)} ›
                  </Text>
                </Pressable>
              </View>
            </Card>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>ברכה אחרי הקריאה</Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BIRKAT_AFTER}</Text>
            </View>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              נאמרת רק בקריאה בציבור (במניין). ביחיד - לא מברכים אחריה.
            </Text>
          </Card>

          {isNight && (
            <Card>
              <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
                אשר הניא (ערבית)
              </Text>
              <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                נאמר רק בקריאת הלילה — אחרי ברכת "הרב את ריבנו", ולפניו ואחר כך אומרים "שושנת יעקב". בקריאת הבוקר - לא אומרים.
              </Text>
              <View style={styles.sacredBox}>
                <Text style={[typography.sacred, { color: colors.textPrimary }]}>{ASHER_HENI}</Text>
              </View>
            </Card>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>שושנת יעקב</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              נאמרת בלילה אחרי "אשר הניא", וביום אחרי ברכת "הרב את ריבנו" (גם ביחיד נוהגים לאומרו).
            </Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{SHOSHANAT_YAAKOV}</Text>
            </View>
          </Card>

          <Pressable
            onPress={() => router.push('/tools/raashan' as any)}
            style={styles.raashanBtn}
          >
            <Text style={{ fontSize: 28 }}>🪅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.textInverse }]}>פתח את הרעשן</Text>
              <Text style={[typography.caption, { color: colors.textInverse, opacity: 0.85 }]}>
                להזכרות המן - הקשה / רעידה / לחיצה
              </Text>
            </View>
            <Text style={{ color: colors.textInverse, fontSize: 22 }}>‹</Text>
          </Pressable>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>4 מצוות הפורים</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>מקרא מגילה</Text> - בלילה ובבוקר{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>משלוח מנות</Text> - שני מאכלים לפחות, לאדם אחד לפחות{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>מתנות לאביונים</Text> - שני אביונים לפחות{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>סעודת פורים</Text> - בבוקר/צהריים של פורים
            </Text>
          </Card>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
      {/* Floating raashan: visible whenever the megillah text is open, so user
          can fire it during the reading without leaving the screen. */}
      {showText && <FloatingRaashan />}
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
  chapChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 44,
    alignItems: 'center',
  },
  chapChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  navBtn: { flex: 1, padding: spacing.md, alignItems: 'center' },
  navBtnDisabled: { opacity: 0.5 },
  raashanBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
});
