import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { HolidayCountdown } from '../../src/components/HolidayCountdown';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const ASHKENAZI_PETITION = `שִׁמְעוּ נָא רַבּוֹתַי דַּיָּנִים מֻמְחִים, כָּל נֵדֶר אוֹ שְׁבוּעָה אוֹ אִסָּר אוֹ קוֹנָם אוֹ חֵרֶם אוֹ הַסְכָּמָה, אוֹ קַבָּלָה בְּלֵב עַל כָּל דְּבַר מִצְוָה אוֹ דָבָר אַחֵר, אוֹ הַסְכָּמָה לִנְהוֹג אֵיזֶה מִנְהָג טוֹב אוֹ אֵיזֶה הַנְהָגָה טוֹבָה, אוֹ אֲפִלּוּ דְּבַר טוֹבָה שֶׁעָשִׂיתִי שָׁלוֹשׁ פְּעָמִים וְלֹא הִתְנֵיתִי שֶׁיְּהֵא בְּלִי נֶדֶר.

בֵּין שֶׁעָשִׂיתִי בְּחָלוֹם אוֹ בְּהָקִיץ, וּבֵין שֶׁעָשִׂיתִי בְּשֵׁמוֹת הַקְּדוֹשִׁים שֶׁאֵינָם נִמְחָקִים אוֹ בְּשֵׁם הַוָיָ"ה בָּרוּךְ הוּא, אוֹ בְּכָל מִינֵי נְזִירוּת שֶׁקִּבַּלְתִּי עָלַי, וְאַף נְזִירוּת שִׁמְשׁוֹן.

עַל כֻּלָּם אֲנִי מִתְחָרֵט וְשׁוֹאֵל הַתָּרָה מֵהֶם. שֶׁאֲנִי מִתְחָרֵט עַל גּוּפָן שֶׁל נְדָרִים וְעַל גּוּפָן שֶׁל שְׁבוּעוֹת וְעַל גּוּפָן שֶׁל נְזִירוּת וְעַל גּוּפָן שֶׁל קוֹנָמוֹת וְעַל גּוּפָן שֶׁל אִסּוּרִים וְעַל גּוּפָן שֶׁל הַסְכָּמוֹת וְעַל גּוּפָן שֶׁל קַבָּלוֹת בְּלֵב.

אֵינִי מִתְחָרֵט חַס וְשָׁלוֹם עַל קִיּוּמָם, אֶלָּא מִתְחָרֵט אֲנִי שֶׁלֹּא אָמַרְתִּי "בְּלִי נֶדֶר" בִּשְׁעַת הַנְּדָרִים וְהַשְּׁבוּעוֹת וְהַנְּזִירוּת וְהָאִסּוּרִים וְהַקוֹנָמוֹת וְהַהַסְכָּמוֹת וְהַקַּבָּלוֹת בְּלֵב.

וְאִילּוּ הָיִיתִי יוֹדֵעַ שֶׁאֲנִי צָרִיךְ לְבַקֵּשׁ הַתָּרָה עֲלֵיהֶם, הָיִיתִי מַתְנֶה מֵרֹאשׁ שֶׁכָּל מַה שֶּׁאֶדּוֹר אוֹ אֶשָּׁבַע אוֹ אֶנְהֹג אוֹ אֲקַבֵּל - יִהְיוּ כֻלָּם בָּטֵלִים.

הֵן עַל מָה שֶׁאֲנִי זוֹכֵר וְהֵן עַל מָה שֶׁאֵינִי זוֹכֵר - עַל כֻּלָּם אֲנִי מִתְחָרֵט וּמְבַקֵּשׁ מִכֶּם הַתָּרָה עֲלֵיהֶם.

הֲרֵי אֲנִי מוֹסֵר מוֹדָעָה לִפְנֵיכֶם, וַאֲנִי מְבַטֵּל מִכָּאן וּלְהַבָּא כָּל הַנְּדָרִים וְכָל הַשְּׁבוּעוֹת וְכָל הַנְּזִירוּת וְכָל הָאִסּוּרִים וְכָל הַקוֹנָמוֹת וְכָל הַהַסְכָּמוֹת וְכָל הַקַּבָּלוֹת בְּלֵב שֶׁאֶדּוֹר אוֹ אֶשָּׁבַע אוֹ אֶנְהֹג אוֹ אֲקַבֵּל עָלַי מֵהַיּוֹם וְעַד עוֹלָם - כֻּלָּם יִהְיוּ בְּטֵלִים וּמְבֻטָּלִים, לֹא שְׁרִירִין וְלֹא קַיָּמִין.`;

const ASHKENAZI_RESPONSE = `הַכֹּל יִהְיוּ מֻתָּרִים לְךָ. הַכֹּל מְחוּלִים לְךָ. הַכֹּל שְׁרוּיִים לְךָ. אֵין כָּאן לֹא נֵדֶר וְלֹא שְׁבוּעָה וְלֹא נְזִירוּת וְלֹא אִסּוּר וְלֹא חֵרֶם וְלֹא נִדּוּי וְלֹא הַסְכָּמָה וְלֹא קַבָּלָה. אֲבָל יֵשׁ כָּאן מְחִילָה וּסְלִיחָה וְכַפָּרָה.

וּכְשֵׁם שֶׁמַּתִּירִים בְּבֵית דִּין שֶׁל מַטָּה, כֵּן יִהְיוּ מֻתָּרִים מִבֵּית דִּין שֶׁל מַעְלָה.`;

const SEPHARDI_PETITION = `שִׁמְעוּ נָא רַבּוֹתַי, יוֹדְעֵי דָת וָדִין שׁוֹפְטֵי הָאָרֶץ. הִנֵּה אֲנִי מַסְכִּים בַּלֵּב לְהִתְחָרֵט וּלְבַקֵּשׁ הַתָּרָה מֵרַבּוֹתַי, עַל כָּל מִינֵי נְדָרִים אוֹ שְׁבוּעוֹת אוֹ אִסּוּרִים אוֹ נְזִירוּת אוֹ חֲרָמוֹת אוֹ נִדּוּיִים אוֹ קוֹנָמוֹת אוֹ קַבָּלוֹת אוֹ הַסְכָּמוֹת שֶׁנָּדַרְתִּי אוֹ נִשְׁבַּעְתִּי בְּהָקִיץ אוֹ בַּחֲלוֹם, אוֹ בְּשַׁבָּת אוֹ בְּחוֹל, אוֹ נִשְׁבַּעְתִּי בִּתְקִיעַת כַּף אוֹ בִּלְשׁוֹן חֵרֶם, עָלַי אוֹ עַל אֲחֵרִים, בֵּין בְּפֵרוּשׁ בֵּין בְּרֶמֶז, בֵּין בְּמַחֲשָׁבָה בֵּין בְּדִבּוּר, בֵּין שֶׁאֲנִי זוֹכֵר אוֹתָם וּבֵין שֶׁאֵינִי זוֹכֵר אוֹתָם.

עַל כֻּלָּם אֲנִי מִתְחָרֵט חֲרָטָה גְמוּרָה, וְשׁוֹאֵל וּמְבַקֵּשׁ מִכְּבוֹדְכֶם הַתָּרָה עֲלֵיהֶם. כִּי יָרֵא אָנֹכִי פֶּן אֶכָּשֵׁל וְנִלְכַּדְתִּי בְּעוֹנֶשׁ שְׁבוּעוֹת וּנְדָרִים, חַס וְחָלִילָה.

וְאֵינִי מִתְחָרֵט חַס וְחָלִילָה עַל קִיּוּם הַמַּעֲשִׂים הַטּוֹבִים שֶׁעָשִׂיתִי, אֶלָּא מִתְחָרֵט עַל קַבָּלָתָם בִּלְשׁוֹן נֶדֶר אוֹ שְׁבוּעָה אוֹ קַבָּלָה בְּלֵב, וְהָיִיתִי רוֹצֶה לְקַיְּמָם בְּלִי נֶדֶר וּשְׁבוּעָה.

לָכֵן אֲנִי מְבַקֵּשׁ מִמַּעֲלָתְכֶם הַתָּרָה עֲלֵיהֶם. הֲרֵינִי מוֹסֵר מוֹדָעָה מֵעַתָּה שֶׁכָּל נְדָרִים וּשְׁבוּעוֹת וְאִסּוּרִים וְקַבָּלוֹת וְהַסְכָּמוֹת שֶׁאֶדּוֹר אוֹ אֶשָּׁבַע מֵהַיּוֹם וְעַד סוֹף עוֹלָם - יִהְיוּ כֻלָּם בְּטֵלִים וּמְבֻטָּלִים, לֹא שְׁרִירִין וְלֹא קַיָּמִין, וְאֵין בָּהֶם תְּפִיסָה כְּלָל.`;

const SEPHARDI_RESPONSE = `הַכֹּל יִהְיוּ מֻתָּרִים לָךְ. שָׁרוּי לָךְ. מָחוּל לָךְ. אֵין כָּאן לֹא נֶדֶר וְלֹא שְׁבוּעָה וְלֹא אִסּוּר וְלֹא קַבָּלָה וְלֹא הַסְכָּמָה וְלֹא חֵרֶם וְלֹא נְזִירוּת. הֲרֵינוּ מַתִּירִים אוֹתָם בֵּין בֵּינוֹ לְבֵין הַמָּקוֹם, בֵּין בֵּינוֹ לְבֵין חֲבֵרוֹ.

וְכָל הַנְּדָרִים אוֹ שְׁבוּעוֹת שֶׁיִּדּוֹר אוֹ יִשָּׁבַע מִכָּאן וְעַד שָׁנָה הַבָּאָה עָלֵינוּ לְטוֹבָה, הֲרֵי מֵעַתָּה אָנוּ מַסְכִּימִים שֶׁיִּהְיוּ כֻּלָּם בְּטֵלִים וּמְבֻטָּלִים.`;

type Nusach = 'ashkenazi' | 'sephardi';

export default function HataratNedarimScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const [nusach, setNusach] = useState<Nusach>('ashkenazi');

  const petition = nusach === 'ashkenazi' ? ASHKENAZI_PETITION : SEPHARDI_PETITION;
  const response = nusach === 'ashkenazi' ? ASHKENAZI_RESPONSE : SEPHARDI_RESPONSE;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="התרת נדרים" subtitle="ערב ראש השנה + ערב יום כיפור" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <HolidayCountdown holiday="erev-rosh-hashana" inIsrael={inIsrael} />

          <Card variant="primary">
            <Text style={[typography.h3, { color: colors.textPrimary }]}>📜 הוראות</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              1. עומדים לפני <Text style={{ fontWeight: '700' }}>שלושה אנשים</Text> (אפשר חבריך/בני משפחה).{'\n'}
              2. הם נחשבים כדיינים - אומרים בקול: "שמעו רבותי..." ומקריאים את הנוסח.{'\n'}
              3. אחרי הקריאה, השלושה אומרים יחד את התשובה: "הכל יהיו מותרים לך..." 3 פעמים.{'\n'}
              4. נשים יכולות לעשות גם הן (מנהג רווח כיום).
            </Text>
          </Card>

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Pressable
              onPress={() => setNusach('ashkenazi')}
              style={[styles.nusachBtn, nusach === 'ashkenazi' && styles.nusachBtnActive, { flexGrow: 1, minWidth: 130 }]}
            >
              <Text style={[typography.bodyBold, { color: nusach === 'ashkenazi' ? colors.textInverse : colors.textPrimary, textAlign: 'center' }]}>
                נוסח אשכנז
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setNusach('sephardi')}
              style={[styles.nusachBtn, nusach === 'sephardi' && styles.nusachBtnActive, { flexGrow: 1, minWidth: 130 }]}
            >
              <Text style={[typography.bodyBold, { color: nusach === 'sephardi' ? colors.textInverse : colors.textPrimary, textAlign: 'center' }]}>
                נוסח ספרד / עדות מזרח
              </Text>
            </Pressable>
          </View>

          <Card>
            <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>נוסח הבקשה (לקרוא בפני השלושה)</Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 30 }]}>{petition}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>תשובת הדיינים (אומרים 3 פעמים)</Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 30 }]}>{response}</Text>
            </View>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>מתי</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>ערב ראש השנה</Text> (כ"ט אלול) - המנהג הראשי.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>ערב יום הכיפורים</Text> - יש המקפידים לעשות שוב.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>בוקר ערב פסח</Text> (בכורות בלבד) - לפי מקצת המנהגים.
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
  sacredBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nusachBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  nusachBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
