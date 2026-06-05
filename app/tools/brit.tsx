import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { HebrewDatePicker } from '../../src/components/HebrewDatePicker';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { HDate } from '@hebcal/core';
import { getString, setString } from '../../src/storage/storage';
import { colors, radius, spacing } from '../../src/theme/colors';

// Brit-local nusach key — separate from the global Keys.nusach which supports
// 4 values (ashkenazi/sephardi/edot-mizrach/chabad). Brit currently has only
// 2 nuschot, so we don't want to overwrite the user's global setting.
const BRIT_NUSACH_KEY = '@yahadut/brit-nusach';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/brit-tracker';

type BritEntry = {
  id: string;
  babyName: string;
  birthDate: string;
  birthAfterSunset: boolean;
};

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calcBritDay(birth: Date, afterSunset: boolean): Date {
  const start = new Date(birth);
  if (afterSunset) start.setDate(start.getDate() + 1);
  const britDate = new Date(start);
  britDate.setDate(britDate.getDate() + 7);
  return britDate;
}

// ============ נוסח ברית מילה מלא ============
const BRACHA_MOHEL = `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל הַמִּילָה.`;

const BRACHA_FATHER = `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לְהַכְנִיסוֹ בִּבְרִיתוֹ שֶׁל אַבְרָהָם אָבִינוּ.`;

// ברכת שהחיינו - הספרדים מברכים אותה חובה בכל ברית של בן, חלק מהאשכנזים נוהגים
// לומר אותה רק בברית של בן ראשון או על-פי מנהג קהילה ספציפית.
const BRACHA_SHEHECHEYANU = `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.`;

const BARUCH_HABA = `בָּרוּךְ הַבָּא בְּשֵׁם ה׳.`;

const ZEH_HAKISE = `זֶה הַכִּסֵּא שֶׁל אֵלִיָּהוּ הַנָּבִיא, זָכוּר לַטּוֹב.

לִישׁוּעָתְךָ קִוִּיתִי ה׳.

שִׂבַּרְתִּי לִישׁוּעָתְךָ ה׳, וּמִצְוֺתֶיךָ עָשִׂיתִי.

אֵלִיָּהוּ מַלְאַךְ הַבְּרִית, הִנֵּה שֶׁלְּךָ לְפָנֶיךָ, עֲמֹד עַל יְמִינִי וְסָמְכֵנִי.

שִׂבַּרְתִּי לִישׁוּעָתְךָ ה׳.

שָׂשׂ אָנֹכִי עַל אִמְרָתֶךָ, כְּמוֹצֵא שָׁלָל רָב.

שָׁלוֹם רָב לְאֹהֲבֵי תוֹרָתֶךָ, וְאֵין לָמוֹ מִכְשׁוֹל.

אַשְׁרֵי תִּבְחַר וּתְקָרֵב יִשְׁכֹּן חֲצֵרֶיךָ.`;

const RESPONSE_CONGREGATION = `כְּשֵׁם שֶׁנִּכְנַס לַבְּרִית, כֵּן יִכָּנֵס לְתוֹרָה וּלְחֻפָּה וּלְמַעֲשִׂים טוֹבִים.`;

// ברכת אבי הבן הארוכה - "אשר קידש ידיד מבטן" (אחרי בורא פרי הגפן)
const BRACHA_YEDID_MIBETEN = `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדֵּשׁ יְדִיד מִבֶּטֶן, וְחֹק בִּשְׁאֵרוֹ שָׂם, וְצֶאֱצָאָיו חָתַם בְּאוֹת בְּרִית קֹדֶשׁ.

עַל כֵּן בִּשְׂכַר זֹאת, אֵל חַי חֶלְקֵנוּ צוּרֵנוּ, צַוֵּה לְהַצִּיל יְדִידוּת שְׁאֵרֵנוּ מִשַּׁחַת, לְמַעַן בְּרִיתוֹ אֲשֶׁר שָׂם בִּבְשָׂרֵנוּ.

בָּרוּךְ אַתָּה ה׳, כּוֹרֵת הַבְּרִית.`;

// קריאת השם - נוסח אשכנז
const NAMING_ASHKENAZI = `אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, קַיֵּם אֶת הַיֶּלֶד הַזֶּה לְאָבִיו וּלְאִמּוֹ, וְיִקָּרֵא שְׁמוֹ בְּיִשְׂרָאֵל ___ בֶּן ___.

יִשְׂמַח הָאָב בְּיוֹצֵא חֲלָצָיו, וְתָגֵל אִמּוֹ בִּפְרִי בִטְנָהּ, כַּכָּתוּב: יִשְׂמַח אָבִיךָ וְאִמֶּךָ וְתָגֵל יוֹלַדְתֶּךָ.

וְנֶאֱמַר: וָאֶעֱבֹר עָלַיִךְ וָאֶרְאֵךְ מִתְבּוֹסֶסֶת בְּדָמָיִךְ, וָאֹמַר לָךְ בְּדָמַיִךְ חֲיִי, וָאֹמַר לָךְ בְּדָמַיִךְ חֲיִי.

וְנֶאֱמַר: זָכַר לְעוֹלָם בְּרִיתוֹ, דָּבָר צִוָּה לְאֶלֶף דּוֹר. אֲשֶׁר כָּרַת אֶת אַבְרָהָם, וּשְׁבוּעָתוֹ לְיִשְׂחָק, וַיַּעֲמִידֶהָ לְיַעֲקֹב לְחֹק, לְיִשְׂרָאֵל בְּרִית עוֹלָם.

וְנֶאֱמַר: וַיָּמָל אַבְרָהָם אֶת יִצְחָק בְּנוֹ בֶּן שְׁמוֹנַת יָמִים, כַּאֲשֶׁר צִוָּה אֹתוֹ אֱלֹהִים.

הוֹדוּ לַה' כִּי טוֹב, כִּי לְעוֹלָם חַסְדּוֹ.

___ זֶה הַקָּטָן, גָּדוֹל יִהְיֶה. כְּשֵׁם שֶׁנִּכְנַס לַבְּרִית, כֵּן יִכָּנֵס לְתוֹרָה וּלְחֻפָּה וּלְמַעֲשִׂים טוֹבִים. אָמֵן.`;

// קריאת השם - נוסח ספרדי / עדות מזרח
const NAMING_SEPHARDI = `אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, קַיֵּם אֶת הַיֶּלֶד הַזֶּה לְאָבִיו וּלְאִמּוֹ, וְיִקָּרֵא שְׁמוֹ בְּיִשְׂרָאֵל ___ בֶּן ___.

יִשְׂמַח הָאָב בְּיוֹצֵא חֲלָצָיו, וְתָגֵל אִמּוֹ בִּפְרִי בִטְנָהּ, שֶׁנֶּאֱמַר: יִשְׂמַח אָבִיךָ וְאִמֶּךָ וְתָגֵל יוֹלַדְתֶּךָ.

וְנֶאֱמַר: הוֹדוּ לַה׳ כִּי טוֹב, כִּי לְעוֹלָם חַסְדּוֹ.

___ זֶה הַקָּטָן, ה' יַגְדִּילֵהוּ וּיכוֹנְנֵהוּ וִיגַדְּלֵהוּ לְתוֹרָה וּלְמִצְוֺת, לְחֻפָּה וּלְמַעֲשִׂים טוֹבִים, וְיִתֵּן לוֹ לְבַב טוֹב וְיֵצֵר טוֹב לַעֲבוֹדָתוֹ יִתְבָּרַךְ.

ה׳ שׁוֹמְרוֹ וּמַצִּילוֹ מִכָּל צָרָה וְצוּקָה, וְיִשְׂמַח בּוֹ אָבִיו וְאִמּוֹ.

אֲדוֹן הָעוֹלָמִים, יְהִי רָצוֹן מִלְּפָנֶיךָ שֶׁיִּהְיֶה זֶה הַיֶּלֶד גָּדוֹל וְחָשׁוּב לְבֵית יִשְׂרָאֵל, וְיִזְכֶּה לְבָנִים וְלִבְנֵי בָנִים עוֹסְקִים בְּתוֹרָה וּבְמִצְוֺת, אָמֵן כֵּן יְהִי רָצוֹן.`;

// ====== Mi Sheberach for the baby (אחרי הברית) ======
const MI_SHEBERACH = `מִי שֶׁבֵּרַךְ אֲבוֹתֵינוּ אַבְרָהָם יִצְחָק וְיַעֲקֹב, הוּא יְבָרֵךְ אֶת הַיֶּלֶד הָרַךְ הַנִּמּוֹל, ___ בֶּן ___, וִיהִי ה׳ אֱלֹהָיו עִמּוֹ, וּתְהִי בְּרִיתוֹ קַיֶּמֶת, וְיִזְכֶּה הוּא וְהוֹרָיו לְגַדְּלוֹ לְתוֹרָה לְחֻפָּה וּלְמַעֲשִׂים טוֹבִים, וְנֹאמַר אָמֵן.`;

type Nusach = 'ashkenazi' | 'sephardi';

export default function BritScreen() {
  const router = useRouter();
  const [entries, setEntries] = useStoredJSON<BritEntry[]>(KEY, []);
  const [nusach, setNusachState] = useState<Nusach>('ashkenazi');

  useEffect(() => {
    (async () => {
      const v = await getString(BRIT_NUSACH_KEY, 'ashkenazi');
      setNusachState((v === 'sephardi' ? 'sephardi' : 'ashkenazi') as Nusach);
    })();
  }, []);

  async function setNusach(n: Nusach) {
    setNusachState(n);
    await setString(BRIT_NUSACH_KEY, n);
  }

  // ===== שם התינוק והאב לקריאת השם =====
  // הסטוריה: בשמירת המשתנים האלה כאן ולא במאגר, התינוק שנשמר ברשימה לא יקבל את השם.
  // התינוק שבוחר בקלקולטור מקבל את השם רק לחזות הנוסח.
  const [babyName, setBabyName] = useState('');
  const [fatherName, setFatherName] = useState('');

  function substituteName(template: string): string {
    if (!babyName && !fatherName) return template;
    // המקור משתמש ב"___" כפלייסהולדר. הראשון = שם התינוק, השני = שם האב.
    let idx = 0;
    return template.replace(/___/g, () => {
      idx += 1;
      if (idx === 1) return babyName || '___';
      if (idx === 2) return fatherName || '___';
      // אם יש ___ נוסף (למשל בסוף הברכה), חוזר על שם התינוק
      return babyName || '___';
    });
  }

  const namingText = substituteName(nusach === 'sephardi' ? NAMING_SEPHARDI : NAMING_ASHKENAZI);
  const miSheberachText = substituteName(MI_SHEBERACH);

  // Quick calculator (always shown)
  const [calcBirth, setCalcBirth] = useState<Date>(new Date());
  const [calcAfterSunset, setCalcAfterSunset] = useState(false);
  const calcBrit = useMemo(() => calcBritDay(calcBirth, calcAfterSunset), [calcBirth, calcAfterSunset]);
  const calcDays = Math.ceil((calcBrit.getTime() - Date.now()) / 86_400_000);

  const [form, setForm] = useState({ babyName: '', birth: new Date(), birthAfterSunset: false });
  const [showForm, setShowForm] = useState(false);

  function add() {
    if (!form.babyName.trim()) {
      Alert.alert('חסר שם', 'נא להזין את שם התינוק');
      return;
    }
    const entry: BritEntry = {
      id: String(Date.now()),
      babyName: form.babyName.trim(),
      birthDate: dateToISO(form.birth),
      birthAfterSunset: form.birthAfterSunset,
    };
    setEntries((arr) => [...arr, entry]);
    setForm({ babyName: '', birth: new Date(), birthAfterSunset: false });
    setShowForm(false);
  }

  function remove(id: string) {
    setEntries((arr) => arr.filter((e) => e.id !== id));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="ברית מילה" subtitle="חישוב + ברכות + הכנה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* ⭐ Main: Brit date calculator */}
          <Card variant="primary">
            <Text style={[typography.h2, { color: colors.textPrimary }]}>📅 מחשבון תאריך ברית</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              בחר תאריך לידה - תקבל מיד את תאריך הברית (יום 8):
            </Text>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>תאריך לידה:</Text>
            <HebrewDatePicker value={calcBirth} onChange={setCalcBirth} defaultMode="hebrew" />
            <Pressable onPress={() => setCalcAfterSunset(!calcAfterSunset)} style={styles.checkRow}>
              <View style={[styles.cb, calcAfterSunset && styles.cbDone]}>
                {calcAfterSunset && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>נולד אחרי שקיעת החמה</Text>
            </Pressable>
          </Card>

          <Card variant="accent">
            <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85 }]}>תאריך הברית (יום 8)</Text>
            <Text style={[typography.display, { color: colors.primaryDark, marginTop: 4 }]}>
              {new HDate(calcBrit).renderGematriya()}
            </Text>
            <Text style={[typography.body, { color: colors.primaryDark, marginTop: 4 }]}>
              {calcBrit.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm, fontWeight: '700' }]}>
              {calcDays > 0 ? `⏳ עוד ${calcDays} ימים` : calcDays === 0 ? '💒 היום!' : `📜 לפני ${-calcDays} ימים`}
            </Text>
          </Card>

          <Pressable onPress={() => setShowForm(!showForm)}>
            <Text style={[typography.bodyBold, { color: colors.primary, textAlign: 'center', paddingVertical: spacing.sm }]}>
              {showForm ? '✕ בטל הוספה' : '➕ שמור תינוק חדש לרשימה'}
            </Text>
          </Pressable>

          {showForm && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שם התינוק:</Text>
              <TextInput value={form.babyName} onChangeText={(v) => setForm({ ...form, babyName: v })} placeholder="יוסף" placeholderTextColor={colors.textMuted} style={styles.input} />
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>תאריך לידה:</Text>
              <HebrewDatePicker value={form.birth} onChange={(d) => setForm({ ...form, birth: d })} defaultMode="hebrew" />
              <Pressable onPress={() => setForm({ ...form, birthAfterSunset: !form.birthAfterSunset })} style={styles.checkRow}>
                <View style={[styles.cb, form.birthAfterSunset && styles.cbDone]}>
                  {form.birthAfterSunset && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>נולד אחרי שקיעת החמה</Text>
              </Pressable>
              <View style={{ marginTop: spacing.md }}>
                <Pressable onPress={add} style={styles.btn}>
                  <Text style={[typography.bodyBold, { color: colors.textInverse }]}>שמור</Text>
                </Pressable>
              </View>
            </Card>
          )}

          {entries.length > 0 && (
            <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>
              תינוקות שמורים
            </Text>
          )}

          {entries.map((e) => {
            const birth = new Date(e.birthDate);
            const britDay = calcBritDay(birth, e.birthAfterSunset);
            const daysUntil = Math.ceil((britDay.getTime() - Date.now()) / 86_400_000);
            const variant = daysUntil >= 0 && daysUntil < 8 ? 'primary' : 'default';
            return (
              <Card key={e.id} variant={variant}>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: variant === 'primary' ? colors.textInverse : colors.textPrimary }]}>{e.babyName || '(טרם נקרא)'}</Text>
                    <Text style={[typography.small, { color: variant === 'primary' ? colors.textInverse : colors.textMuted, opacity: 0.85, marginTop: 2 }]}>
                      נולד: {new HDate(birth).renderGematriya()} {e.birthAfterSunset && '(אחרי שקיעה)'}
                    </Text>
                    <Text style={[typography.h2, { color: variant === 'primary' ? colors.textInverse : colors.primary, marginTop: spacing.sm }]}>
                      ברית: {new HDate(britDay).renderGematriya()}
                    </Text>
                    <Text style={[typography.body, { color: variant === 'primary' ? colors.textInverse : colors.textSecondary, opacity: 0.9, marginTop: 4 }]}>
                      {daysUntil > 0 ? `עוד ${daysUntil} ימים` : daysUntil === 0 ? '💒 היום!' : `הברית הייתה לפני ${-daysUntil} ימים`}
                    </Text>
                  </View>
                  <Pressable onPress={() => remove(e.id)} hitSlop={10}>
                    <Text style={[typography.small, { color: variant === 'primary' ? colors.textInverse : colors.danger }]}>הסר</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>📋 מה צריך להביא</Text>
            <View style={{ marginTop: spacing.sm, gap: 4 }}>
              {[
                'כיסא אליהו (כסא נוסף ומעוטר ליד כסא הסנדק)',
                'תינוק לבוש בבגד יפה ונקי',
                'תחבושת סטרילית, גזה, פלסטר',
                'משחה / שמן זית לטיפול אחרי הברית',
                'כוס + יין / מיץ ענבים לקידוש (לפחות רביעית)',
                'חיתולים נוספים (החתלות בכל שלב)',
                'תרופת הרגעה / מתוק (סוכר על אצבע - לתינוק)',
                'כיסוי לתינוק (לאחר הברית)',
                'מפה לבנה / כיסוי לכסא אליהו',
                'נרות (יש מנהג להדליק 2 נרות)',
                'תוכנית לסעודת ברית - חלות, יין, מנה ראשונה',
                'תשלום למוהל ולסנדק (כסף או צ׳ק)',
              ].map((s, i) => (
                <View key={i} style={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'flex-start' }}>
                  <Text style={[typography.body, { color: colors.primary }]}>⊙</Text>
                  <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>{s}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>סדר הברית המלא</Text>
            <View style={{ marginTop: spacing.sm, gap: 8 }}>
              {[
                { step: 'הבאת התינוק', detail: 'אביו של התינוק מביא אותו מהאם. הקהל קם והמוהל קורא "בָּרוּךְ הַבָּא".' },
                { step: 'כיסא אליהו', detail: 'מניחים את התינוק על כסא אליהו ואומרים "זֶה הַכִּסֵּא שֶׁל אֵלִיָּהוּ הַנָּבִיא זָכוּר לַטּוֹב".' },
                { step: 'העברה לסנדק', detail: 'מעבירים את התינוק לסנדק שיושב על כסאו והוא מחזיק את התינוק בזרועותיו.' },
                { step: 'ברכת המוהל', detail: 'המוהל מברך "אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֺתָיו וְצִוָּנוּ עַל הַמִּילָה". הקהל עונה אמן.' },
                { step: 'המילה', detail: 'המוהל מל את התינוק.' },
                { step: 'ברכת האב', detail: 'אבי הבן מברך "אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֺתָיו וְצִוָּנוּ לְהַכְנִיסוֹ בִּבְרִיתוֹ שֶׁל אַבְרָהָם אָבִינוּ".' },
                { step: 'תגובת הקהל', detail: 'הקהל עונה: "כְּשֵׁם שֶׁנִּכְנַס לַבְּרִית, כֵּן יִכָּנֵס לְתוֹרָה וּלְחוּפָּה וּלְמַעֲשִׂים טוֹבִים".' },
                { step: 'כוס יין', detail: 'מברכים על היין "בּוֹרֵא פְּרִי הַגָּפֶן" ואחריו ברכת "אֲשֶׁר קִדֵּשׁ יְדִיד מִבֶּטֶן" (ברכת אבי הבן הארוכה).' },
                { step: 'קריאת השם', detail: 'מכניסים את השם של התינוק: "אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, קַיֵּם אֶת הַיֶּלֶד הַזֶּה... וְיִקָּרֵא שְׁמוֹ בְּיִשְׂרָאֵל ___ בֶּן ___".' },
                { step: 'טיפת יין לתינוק', detail: 'נותנים טיפה מהיין לתינוק (טבילת אצבע בכוס + מעבר על השפתיים).' },
                { step: 'תיקון הברית', detail: 'המוהל / אבי הבן שותה רביעית מהיין.' },
                { step: 'סעודת ברית מצוה', detail: 'סעודה במקום הברית או אחריה. מצוה רבה להשתתף בה. אומרים הרחמן בברכת המזון.' },
              ].map((s, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={[typography.bodyBold, { color: colors.textInverse }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{s.step}</Text>
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{s.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>נוסח התפילה:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
              <Pressable
                onPress={() => setNusach('ashkenazi')}
                style={[styles.nusachBtn, nusach === 'ashkenazi' && styles.nusachBtnActive]}
              >
                <Text style={[typography.bodyBold, { color: nusach === 'ashkenazi' ? colors.textInverse : colors.textPrimary }]}>
                  אשכנז
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNusach('sephardi')}
                style={[styles.nusachBtn, nusach === 'sephardi' && styles.nusachBtnActive]}
              >
                <Text style={[typography.bodyBold, { color: nusach === 'sephardi' ? colors.textInverse : colors.textPrimary }]}>
                  ספרד / עדות מזרח
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* שדות למילוי שם התינוק והאב - יוטמעו בנוסח קריאת השם */}
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>שמות לחיים (יוטמעו בנוסח):</Text>
            <TextInput
              value={babyName}
              onChangeText={setBabyName}
              placeholder="שם התינוק (למשל: יוסף)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <TextInput
              value={fatherName}
              onChangeText={setFatherName}
              placeholder="שם האב (למשל: יצחק)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              💡 אם לא מולא - יישאר ___ במקום השם בנוסח.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>1. ברוך הבא</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>הקהל קם כשהתינוק מובא</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary, fontSize: 22 }]}>{BARUCH_HABA}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>2. זה הכסא של אליהו</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>אומרים בעת הנחת התינוק על כסא אליהו</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{ZEH_HAKISE}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>3. ברכת המוהל</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>לפני המילה</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA_MOHEL}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>4. ברכת האב</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>מיד אחרי המילה</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA_FATHER}</Text>
            </View>
          </Card>

          {/* שהחיינו — descriptive text and minhag notes removed per Rabbi Dvir's review. */}
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              5. ברכת שהחיינו
            </Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
              אבי הבן מברך מיד אחרי ברכת המילה
            </Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA_SHEHECHEYANU}</Text>
            </View>
          </Card>

          {/* "כשם שנכנס" — האחרון בסדר הברית עצמה: אחרי שאבי הבן בירך
              את שתי הברכות (אשר קדשנו + שהחיינו), הקהל עונה את האיחול */}
          <Card variant="accent">
            <Text style={[typography.h3, { color: colors.primaryDark }]}>6. תגובת הקהל אחרי ברכות האב</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
              לאחר שאבי הבן סיים לברך
            </Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{RESPONSE_CONGREGATION}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>7. אשר קידש ידיד מבטן</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>על כוס יין (אחרי בורא פרי הגפן)</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA_YEDID_MIBETEN}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>8. קריאת השם ({nusach === 'sephardi' ? 'נוסח ספרד' : 'נוסח אשכנז'})</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{namingText}</Text>
            </View>
          </Card>

          <Card variant="accent">
            <Text style={[typography.h3, { color: colors.primaryDark }]}>9. מי שברך לתינוק</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{miSheberachText}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הלכות בקיצור</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              • הברית ביום 8 (כולל יום הלידה אם נולד לפני שקיעה){'\n'}
              • דוחים רק במקרה של חולשת התינוק{'\n'}
              • אסור לדחות אם אפשר - ברית מילה דוחה שבת ויום טוב{'\n'}
              • לא דוחה תענית ציבור{'\n'}
              • הסעודה היא מצוה - יש להזמין רבים
            </Text>
          </Card>
        </View>
        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md,
    fontSize: 16, color: colors.textPrimary, textAlign: 'right', backgroundColor: colors.bg,
  },
  checkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  cb: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cbDone: { backgroundColor: colors.success, borderColor: colors.success },
  btn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  brachaBox: {
    marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  stepRow: { flexDirection: 'row-reverse', gap: spacing.md, alignItems: 'flex-start' },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  nusachBtn: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  nusachBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
});
