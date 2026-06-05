import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, Share } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { PSALM_119_BY_LETTER, PSALM_119_RANGES, nameToLetters } from '../../src/data/psalm119';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

/**
 * Minhag at the grave: recite the Psalm 119 sections corresponding to the
 * letters of the deceased's name, followed by the letters of the word "נשמה".
 */
const NESHAMA = ['נ', 'ש', 'מ', 'ה'];

function normalizeLetters(name: string): string[] {
  return nameToLetters(name);
}

const TEFILA_ENTRY = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר יָצַר אֶתְכֶם בַּדִּין, וְזָן אֶתְכֶם בַּדִּין, וְכִלְכֵּל אֶתְכֶם בַּדִּין, וְהֵמִית אֶתְכֶם בַּדִּין, וְיוֹדֵעַ מִסְפַּר כֻּלְּכֶם בַּדִּין, וְהוּא עָתִיד לְהַחֲיוֹתְכֶם וּלְקַיֵּם אֶתְכֶם בַּדִּין. בָּרוּךְ אַתָּה ה', מְחַיֵּה הַמֵּתִים.`;

const ANA_BEKOACH = `אָנָּא בְּכֹחַ גְּדֻלַּת יְמִינְךָ תַּתִּיר צְרוּרָה. (אב"ג ית"ץ)
קַבֵּל רִנַּת עַמְּךָ שַׂגְּבֵנוּ טַהֲרֵנוּ נוֹרָא. (קר"ע שט"ן)
נָא גִבּוֹר דּוֹרְשֵׁי יִחוּדְךָ כְּבָבַת שָׁמְרֵם. (נג"ד יכ"ש)
בָּרְכֵם טַהֲרֵם רַחֲמֵם צִדְקָתְךָ תָּמִיד גָּמְלֵם. (בט"ר צת"ג)
חֲסִין קָדוֹשׁ בְּרֹב טוּבְךָ נַהֵל עֲדָתֶךָ. (חק"ב טנ"ע)
יָחִיד גֵּאֶה לְעַמְּךָ פְּנֵה, זוֹכְרֵי קְדֻשָּׁתֶךָ. (יג"ל פז"ק)
שַׁוְעָתֵנוּ קַבֵּל וּשְׁמַע צַעֲקָתֵנוּ, יוֹדֵעַ תַּעֲלוּמוֹת. (שק"ו צי"ת)
(בלחש:) בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד.`;

function kelMaleRachamim(name: string, parentName: string, gender: 'm' | 'f'): string {
  const heShe = gender === 'm' ? 'שֶׁהָלַךְ לְעוֹלָמוֹ' : 'שֶׁהָלְכָה לְעוֹלָמָהּ';
  const benBat = gender === 'm' ? 'בֶּן' : 'בַּת';
  const ofNiftar = gender === 'm' ? 'נִשְׁמַת' : 'נִשְׁמַת';
  const concluded = gender === 'm' ? 'תְּהֵא נִשְׁמָתוֹ צְרוּרָה בִּצְרוֹר הַחַיִּים' : 'תְּהֵא נִשְׁמָתָהּ צְרוּרָה בִּצְרוֹר הַחַיִּים';
  const namePart = name.trim() || '____';
  const parentPart = parentName.trim() || '____';
  return `אֵל מָלֵא רַחֲמִים שׁוֹכֵן בַּמְּרוֹמִים, הַמְצֵא מְנוּחָה נְכוֹנָה תַּחַת כַּנְפֵי הַשְּׁכִינָה, בְּמַעֲלוֹת קְדוֹשִׁים וּטְהוֹרִים כְּזוֹהַר הָרָקִיעַ מַזְהִירִים, ${ofNiftar} ${namePart} ${benBat} ${parentPart} ${heShe}, בַּעֲבוּר שֶׁאֲנִי נוֹדֵר צְדָקָה בְּעַד הַזְכָּרַת נִשְׁמָתוֹ, בְּגַן עֵדֶן תְּהֵא מְנוּחָתוֹ, לָכֵן בַּעַל הָרַחֲמִים יַסְתִּירֵהוּ בְּסֵתֶר כְּנָפָיו לְעוֹלָמִים, וְיִצְרֹר בִּצְרוֹר הַחַיִּים אֶת נִשְׁמָתוֹ, ה' הוּא נַחֲלָתוֹ, וְיָנוּחַ בְּשָׁלוֹם עַל מִשְׁכָּבוֹ, וְנֹאמַר אָמֵן. ${concluded}.`;
}

const HASHKAVA_AFTER = `הַשּׁוֹכֵן בְּגָבְהֵי מְרוֹמִים, הוּא יִתֵּן מְנוּחָה נְכוֹנָה תַּחַת כַּנְפֵי הַשְּׁכִינָה, בְּמַעֲלוֹת קְדוֹשִׁים וּטְהוֹרִים בְּזֹהַר הָרָקִיעַ מַזְהִירִים וּמְזִיוִים, וְחַיִּים וְשָׁלוֹם לְכָל יִשְׂרָאֵל.`;

export default function KeverVisitScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [gender, setGender] = useState<'m' | 'f'>('m');
  const [showResult, setShowResult] = useState(false);

  const lettersFromName = useMemo(() => normalizeLetters(name), [name]);
  const lettersFromNeshama = NESHAMA;

  function generate() {
    if (!name.trim()) return;
    setShowResult(true);
  }

  function shareAll() {
    const nameLines = lettersFromName.map((l) => {
      const r = PSALM_119_RANGES[l];
      return `${l}: תהילים קי״ט פסוקים ${r.from}-${r.to}`;
    });
    const neshamaLines = lettersFromNeshama.map((l) => {
      const r = PSALM_119_RANGES[l];
      return `${l}: תהילים קי״ט פסוקים ${r.from}-${r.to}`;
    });
    const text = `🕯️ עליה לקבר${name ? ` - ${name}${parentName ? ` ${gender === 'm' ? 'בן' : 'בת'} ${parentName}` : ''}` : ''}

📖 פרקי קי״ט לפי אותיות השם:
${nameLines.join('\n')}

📖 אותיות נשמה (נ-ש-מ-ה):
${neshamaLines.join('\n')}

🙏 אל מלא רחמים, ת.נ.צ.ב.ה.

מתוך אפליקציית חברותא`;
    Share.share({ message: text });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="עליה לקבר" subtitle="נוסח + תהילים לפי אותיות השם" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
              <Text style={{ fontWeight: '700' }}>מנהג העליה לקבר:</Text> אומרים פרקי תהילים, ובפרט פרקי קי״ט לפי אותיות שם הנפטר, ובסוף לפי אותיות המילה "נשמה". מבקשים מהנפטר מחילה ומתפללים אל מלא רחמים.
            </Text>
          </Card>

          {/* Entry blessing */}
          <Card>
            <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
              נוסח כניסה לבית הקברות
            </Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{TEFILA_ENTRY}</Text>
            </View>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' }]}>
              נאמר בעמידה לפני הכניסה. אם לא היה בבית קברות 30 יום - אומרים בברכה.
            </Text>
          </Card>

          {/* Name input */}
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              שם הנפטר/ת
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => {
                setName(t);
                setShowResult(false);
              }}
              placeholder="לדוגמה: יצחק"
              placeholderTextColor={colors.textMuted}
            />

            <Text
              style={[
                typography.bodyBold,
                { color: colors.textPrimary, marginTop: spacing.sm, marginBottom: spacing.xs },
              ]}
            >
              שם האב (לאל מלא רחמים)
            </Text>
            <TextInput
              style={styles.input}
              value={parentName}
              onChangeText={(t) => {
                setParentName(t);
                setShowResult(false);
              }}
              placeholder="לא חובה"
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
              <Pressable
                onPress={() => setGender('m')}
                style={[styles.genderBtn, gender === 'm' && styles.genderActive]}
              >
                <Text
                  style={[
                    typography.bodyBold,
                    { color: gender === 'm' ? colors.textInverse : colors.textPrimary },
                  ]}
                >
                  ♂ זכר
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setGender('f')}
                style={[styles.genderBtn, gender === 'f' && styles.genderActive]}
              >
                <Text
                  style={[
                    typography.bodyBold,
                    { color: gender === 'f' ? colors.textInverse : colors.textPrimary },
                  ]}
                >
                  ♀ נקבה
                </Text>
              </Pressable>
            </View>
          </Card>

          {name.trim() && !showResult && (
            <Button label="📖 הצג סדר אמירה" onPress={generate} variant="primary" />
          )}

          {showResult && (
            <>
              <Card variant="primary">
                <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center' }]}>
                  🕯️ לעילוי נשמת
                </Text>
                <Text
                  style={[
                    typography.h2,
                    { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.xs },
                  ]}
                >
                  {name}
                  {parentName ? ` ${gender === 'm' ? 'בן' : 'בת'} ${parentName}` : ''}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textPrimary, opacity: 0.85, textAlign: 'center', marginTop: 4 },
                  ]}
                >
                  {lettersFromName.length + lettersFromNeshama.length} חלקי תהילים קי״ט · {(lettersFromName.length + lettersFromNeshama.length) * 8} פסוקים
                </Text>
              </Card>

              {/* Letters of name - WITH FULL TEXT */}
              <Card>
                <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
                  📖 אותיות השם ({lettersFromName.join('')})
                </Text>
                {lettersFromName.length === 0 && (
                  <Text style={[typography.caption, { color: colors.textMuted, fontStyle: 'italic' }]}>
                    לא זוהו אותיות עבריות בשם.
                  </Text>
                )}
                {lettersFromName.map((l, i) => {
                  const r = PSALM_119_RANGES[l];
                  const text = PSALM_119_BY_LETTER[l];
                  return (
                    <View key={i} style={styles.psalmBlock}>
                      <View style={styles.psalmHeader}>
                        <Text style={[typography.h2, { color: colors.primary }]}>{l}</Text>
                        <Text style={[typography.caption, { color: colors.textMuted, marginRight: spacing.sm }]}>
                          תהילים קי״ט · פסוקים {r.from}-{r.to}
                        </Text>
                      </View>
                      <Text style={[typography.sacred, styles.psalmText]}>{text}</Text>
                    </View>
                  );
                })}
              </Card>

              {/* Letters of NESHAMA - WITH FULL TEXT */}
              <Card>
                <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
                  📖 אותיות נ-ש-מ-ה
                </Text>
                {lettersFromNeshama.map((l, i) => {
                  const r = PSALM_119_RANGES[l];
                  const text = PSALM_119_BY_LETTER[l];
                  return (
                    <View key={i} style={styles.psalmBlock}>
                      <View style={styles.psalmHeader}>
                        <Text style={[typography.h2, { color: colors.primary }]}>{l}</Text>
                        <Text style={[typography.caption, { color: colors.textMuted, marginRight: spacing.sm }]}>
                          תהילים קי״ט · פסוקים {r.from}-{r.to}
                        </Text>
                      </View>
                      <Text style={[typography.sacred, styles.psalmText]}>{text}</Text>
                    </View>
                  );
                })}
              </Card>

              {/* Kel Maleh */}
              <Card>
                <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
                  אל מלא רחמים
                </Text>
                <View style={styles.sacredBox}>
                  <Text style={[typography.sacred, { color: colors.textPrimary }]}>
                    {kelMaleRachamim(name, parentName, gender)}
                  </Text>
                </View>
              </Card>

              {/* Anna B'Koach */}
              <Card>
                <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
                  אנא בכח
                </Text>
                <View style={styles.sacredBox}>
                  <Text style={[typography.sacred, { color: colors.textPrimary }]}>{ANA_BEKOACH}</Text>
                </View>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
                  ]}
                >
                  שם בן מ"ב - שמותיו של ה' המסודרים באותיות הראשונות של כל שורה.
                </Text>
              </Card>

              {/* Hashkava */}
              <Card>
                <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
                  השכבה (סיום)
                </Text>
                <View style={styles.sacredBox}>
                  <Text style={[typography.sacred, { color: colors.textPrimary }]}>{HASHKAVA_AFTER}</Text>
                </View>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
                  ]}
                >
                  אומרים לסיום, ולאחר מכן: ת.נ.צ.ב.ה. (תהי נשמתו צרורה בצרור החיים).
                </Text>
              </Card>

              <Button label="📤 שתף את הסדר" onPress={shareAll} variant="primary" />

              <Card variant="accent">
                <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>
                  💡 הנהגות חשובות בעליה לקבר
                </Text>
                <Text
                  style={[
                    typography.body,
                    { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm },
                  ]}
                >
                  ⊙ לא לעבור על הקברים. ללכת בין השורות.
                  {'\n'}⊙ לא לאכול ולשתות בבית הקברות.
                  {'\n'}⊙ ביציאה - נטילת ידיים בלי לנגב.
                  {'\n'}⊙ כהן - לא נכנס לבית קברות אלא לשבעה קרובים בלבד.
                  {'\n'}⊙ אישה נדה - יש מנהגים שונים, ראוי להתייעץ עם רב.
                </Text>
              </Card>
            </>
          )}
        </View>
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  sacredBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  letterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  psalmBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  psalmHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  psalmText: {
    color: colors.textPrimary,
    fontSize: 17,
    lineHeight: 30,
    textAlign: 'right',
  },
});
