import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { HebrewDatePicker } from '../../src/components/HebrewDatePicker';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/pidyon';

type Entry = {
  id: string;
  babyName: string;
  birthDateISO: string;
  firstborn: boolean;
  motherFamilyKohen: boolean;
  motherFamilyLevi: boolean;
};

const BRACHA_FATHER = `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל פִּדְיוֹן הַבֵּן.`;
const BRACHA_SHEHECHIANU = `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.`;
const DIALOG_FATHER = `זֶה בְּנִי בְּכוֹרִי, הוּא פֶּטֶר רֶחֶם לְאִמּוֹ, וְהַקָּדוֹשׁ בָּרוּךְ הוּא צִוָּה לִפְדּוֹתוֹ. שֶׁנֶּאֱמַר: "וּפְדוּיָו מִבֶּן חֹדֶשׁ תִּפְדֶּה בְּעֶרְכְּךָ כֶּסֶף חֲמֵשֶׁת שְׁקָלִים בְּשֶׁקֶל הַקֹּדֶשׁ".`;
const DIALOG_KOHEN = `מַאי בָּעֵית טְפֵי - בִּנְךָ בְּכוֹרְךָ אוֹ חֲמֵשׁ סְלָעִים שֶׁאַתָּה חַיָּב לִפְדּוֹתוֹ?`;
const DIALOG_FATHER_RESPONSE = `הֲרֵי חֲמֵשׁ סְלָעִים שֶׁאַתָּה חַיָּב לִפְדּוֹתוֹ בָּהֶם.`;
const FINAL = `יְהִי רָצוֹן שֶׁכְּשֵׁם שֶׁנִּכְנַס לְפִדְיוֹן, כֵּן יִכָּנֵס לְתוֹרָה וּלְחוּפָּה וּלְמַעֲשִׂים טוֹבִים.`;

function calcPidyonDate(birth: Date): Date {
  const d = new Date(birth);
  d.setDate(d.getDate() + 30);
  return d;
}

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function PidyonScreen() {
  const router = useRouter();
  const [entries, setEntries] = useStoredJSON<Entry[]>(KEY, []);

  // Quick calculator state (no need to save)
  const [calcBirth, setCalcBirth] = useState<Date>(new Date());
  const calcPidyon = useMemo(() => calcPidyonDate(calcBirth), [calcBirth]);
  const daysUntil = Math.ceil((calcPidyon.getTime() - Date.now()) / 86_400_000);

  // Save-form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    babyName: '',
    birth: new Date(),
    firstborn: true,
    motherFamilyKohen: false,
    motherFamilyLevi: false,
  });

  function add() {
    if (!form.babyName.trim()) {
      Alert.alert('חסר שם', 'נא להזין את שם הבכור');
      return;
    }
    setEntries((arr) => [
      ...arr,
      {
        id: String(Date.now()),
        babyName: form.babyName.trim(),
        birthDateISO: dateToISO(form.birth),
        firstborn: form.firstborn,
        motherFamilyKohen: form.motherFamilyKohen,
        motherFamilyLevi: form.motherFamilyLevi,
      },
    ]);
    setForm({ babyName: '', birth: new Date(), firstborn: true, motherFamilyKohen: false, motherFamilyLevi: false });
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
        <ScreenHeader title="פדיון הבן" subtitle="יום 31 מהלידה - לאם ישראלית שיולדת בכור" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* ⭐ MAIN: Date calculator - prominent at top */}
          <Card variant="primary">
            <Text style={[typography.h2, { color: colors.textPrimary }]}>📅 מחשבון תאריך פדיון</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              בחר את תאריך הלידה (עברי או לועזי) וקבל מיד את תאריך הפדיון:
            </Text>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              תאריך הלידה:
            </Text>
            <HebrewDatePicker value={calcBirth} onChange={setCalcBirth} defaultMode="hebrew" />
          </Card>

          <Card variant="accent">
            <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85 }]}>
              תאריך הפדיון (יום 31)
            </Text>
            <Text style={[typography.display, { color: colors.primaryDark, marginTop: 4 }]}>
              {new HDate(calcPidyon).renderGematriya()}
            </Text>
            <Text style={[typography.body, { color: colors.primaryDark, marginTop: 4 }]}>
              {calcPidyon.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm, fontWeight: '700' }]}>
              {daysUntil > 0
                ? `⏳ עוד ${daysUntil} ימים`
                : daysUntil === 0
                  ? '✓ היום!'
                  : `📜 לפני ${-daysUntil} ימים`}
            </Text>
            <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.7, marginTop: spacing.sm }]}>
              שים לב: אם נופל בשבת או יום טוב - דוחים ליום שאחריו.
            </Text>
          </Card>

          {/* Save to list */}
          <Pressable onPress={() => setShowForm(!showForm)}>
            <Text style={[typography.bodyBold, { color: colors.primary, textAlign: 'center', paddingVertical: spacing.sm }]}>
              {showForm ? '✕ בטל הוספה' : '➕ שמור בכור חדש לרשימה (עם תזכורת)'}
            </Text>
          </Pressable>

          {showForm && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שם הבכור:</Text>
              <TextInput
                value={form.babyName}
                onChangeText={(v) => setForm({ ...form, babyName: v })}
                placeholder="שם פרטי"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>
                תאריך לידה:
              </Text>
              <HebrewDatePicker
                value={form.birth}
                onChange={(d) => setForm({ ...form, birth: d })}
                defaultMode="hebrew"
              />

              <Pressable
                onPress={() => setForm({ ...form, firstborn: !form.firstborn })}
                style={styles.checkRow}
              >
                <View style={[styles.cb, form.firstborn && styles.cbDone]}>
                  {form.firstborn && <Text style={{ color: colors.textInverse }}>✓</Text>}
                </View>
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                  פטר רחם לאם (בכור)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setForm({ ...form, motherFamilyKohen: !form.motherFamilyKohen })}
                style={styles.checkRow}
              >
                <View style={[styles.cb, form.motherFamilyKohen && styles.cbDone]}>
                  {form.motherFamilyKohen && <Text style={{ color: colors.textInverse }}>✓</Text>}
                </View>
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>אם בת כהן</Text>
              </Pressable>
              <Pressable
                onPress={() => setForm({ ...form, motherFamilyLevi: !form.motherFamilyLevi })}
                style={styles.checkRow}
              >
                <View style={[styles.cb, form.motherFamilyLevi && styles.cbDone]}>
                  {form.motherFamilyLevi && <Text style={{ color: colors.textInverse }}>✓</Text>}
                </View>
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>אם בת לוי</Text>
              </Pressable>

              {!form.firstborn && (
                <Card variant="accent" style={{ marginTop: spacing.md }}>
                  <Text style={[typography.body, { color: colors.primaryDark }]}>
                    אם אינו בכור - פטור מפדיון
                  </Text>
                </Card>
              )}
              {(form.motherFamilyKohen || form.motherFamilyLevi) && form.firstborn && (
                <Card variant="accent" style={{ marginTop: spacing.md }}>
                  <Text style={[typography.body, { color: colors.primaryDark }]}>
                    אם בת כהן או בת לוי - הבכור פטור מפדיון (מקודש כבר)
                  </Text>
                </Card>
              )}

              <View style={{ marginTop: spacing.md }}>
                <Pressable onPress={add} style={styles.btn}>
                  <Text style={[typography.bodyBold, { color: colors.textInverse }]}>שמור</Text>
                </Pressable>
              </View>
            </Card>
          )}

          {entries.length > 0 && (
            <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>
              בכורות שמורים
            </Text>
          )}

          {entries.map((e) => {
            const required = e.firstborn && !e.motherFamilyKohen && !e.motherFamilyLevi;
            const birth = new Date(e.birthDateISO);
            if (!required) {
              return (
                <Card key={e.id}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.h3, { color: colors.textPrimary }]}>{e.babyName}</Text>
                      <Pill label="פטור מפדיון" tone="success" />
                    </View>
                    <Pressable onPress={() => remove(e.id)} hitSlop={10}>
                      <Text style={[typography.small, { color: colors.danger }]}>הסר</Text>
                    </Pressable>
                  </View>
                </Card>
              );
            }
            const pidyonDate = calcPidyonDate(birth);
            const days = Math.ceil((pidyonDate.getTime() - Date.now()) / 86_400_000);
            const variant = days >= 0 && days < 7 ? 'primary' : 'default';
            return (
              <Card key={e.id} variant={variant}>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: variant === 'primary' ? colors.textInverse : colors.textPrimary }]}>
                      {e.babyName}
                    </Text>
                    <Text style={[typography.body, { color: variant === 'primary' ? colors.textInverse : colors.primary, marginTop: spacing.sm }]}>
                      תאריך פדיון: {new HDate(pidyonDate).renderGematriya()}
                    </Text>
                    <Text style={[typography.small, { color: variant === 'primary' ? colors.textInverse : colors.textMuted, opacity: 0.85, marginTop: 4 }]}>
                      {days > 0 ? `עוד ${days} ימים` : days === 0 ? 'היום!' : `הפדיון היה לפני ${-days} ימים`}
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
            <Text style={[typography.h3, { color: colors.textPrimary }]}>סדר הפדיון</Text>
            <View style={{ marginTop: spacing.sm, gap: 6 }}>
              {[
                'מזמינים כהן (לא קרוב משפחה)',
                'אבא מביא את הבן עם 5 סלעים (כיום: 5 מטבעות כסף שווי הלכתי)',
                'אבא מציג: "זה בני בכורי..."',
                'הכהן שואל: "מה אתה רוצה - הבן או הכסף?"',
                'אבא: "5 סלעים..." נותן לכהן',
                'הכהן מקבל ומחזיר את הבן',
                'אבא מברך - "על פדיון הבן" + "שהחיינו"',
                'סעודת מצוה',
              ].map((s, i) => (
                <View key={i} style={{ flexDirection: 'row-reverse', gap: 6 }}>
                  <Text style={[typography.body, { color: colors.primary, width: 22 }]}>{i + 1}.</Text>
                  <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>{s}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>מילים של האב</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{DIALOG_FATHER}</Text>
            </View>
          </Card>
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>שאלת הכהן</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{DIALOG_KOHEN}</Text>
            </View>
          </Card>
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>תשובת האב</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{DIALOG_FATHER_RESPONSE}</Text>
            </View>
          </Card>
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>ברכת הפדיון</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA_FATHER}</Text>
            </View>
            <View style={[styles.brachaBox, { marginTop: spacing.sm }]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA_SHEHECHIANU}</Text>
            </View>
          </Card>
          <Card variant="accent">
            <Text style={[typography.h3, { color: colors.primaryDark }]}>סיום</Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{FINAL}</Text>
            </View>
          </Card>
        </View>
        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    backgroundColor: colors.bg,
  },
  checkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  cb: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cbDone: { backgroundColor: colors.success, borderColor: colors.success },
  btn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  brachaBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
