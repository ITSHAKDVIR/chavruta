import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

// נוסח לפי "מכון כושרות"
const BRACHA = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֺתָיו וְצִוָּנוּ לְהַפְרִישׁ תְּרוּמוֹת וּמַעַשְׂרוֹת.`;

const NUSACH = `יוֹתֵר מֵאֶחָד מִמֵּאָה שֶׁיֵּשׁ כָּאן בַּצַּד שֶׁל הַצָּפוֹן בַּפֵּרוֹת - יִהְיֶה תְּרוּמָה גְּדוֹלָה.

וְאוֹתוֹ הָאֶחָד מִמֵּאָה שֶׁיֵּשׁ כָּאן בַּצַּד שֶׁל הַצָּפוֹן, וְעוֹד תִּשְׁעָה חֲלָקִים כְּמוֹתוֹ בַּצַּד שֶׁל הַדָּרוֹם בַּפֵּרוֹת - הֲרֵי הֵם מַעֲשֵׂר רִאשׁוֹן.

וְאוֹתוֹ הָאֶחָד מִמֵּאָה שֶׁעָשִׂיתִי מַעֲשֵׂר רִאשׁוֹן - עָשׂוּי תְּרוּמַת מַעֲשֵׂר.

וְעוֹד תִּשְׁעָה חֲלָקִים כְּמוֹתוֹ בַּצַּד שֶׁל הַדָּרוֹם בַּפֵּרוֹת - אִם הַשָּׁנָה שָׁנָה רִאשׁוֹנָה, שְׁנִיָּה, רְבִיעִית אוֹ חֲמִישִׁית לַשְּׁמִיטָה - הֲרֵי הֵם מַעֲשֵׂר שֵׁנִי. וְהוּא וְחֻמְשׁוֹ מְחֻלָּלִים עַל פְּרוּטָה בַּמַּטְבֵּעַ הַמְּיֻחָד לְכָךְ.

וְאִם הַשָּׁנָה שָׁנָה שְׁלִישִׁית אוֹ שִׁשִּׁית לַשְּׁמִיטָה - הֲרֵי הֵם מַעֲשֵׂר עָנִי.

וְאִם יֵשׁ סָפֵק - מַעֲשֵׂר שֵׁנִי וְהוּא וְחֻמְשׁוֹ מְחֻלָּל עַל פְּרוּטָה בַּמַּטְבֵּעַ.`;

type Unit = 'g' | 'kg';
type SpeciesRow = { id: string; name: string; amount: string; unit: Unit };

const DEFAULT_ROWS: SpeciesRow[] = [
  { id: 'r1', name: '', amount: '', unit: 'kg' },
];

export default function TrumotScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<SpeciesRow[]>(DEFAULT_ROWS);

  function addRow() {
    setRows((r) => [...r, { id: `r${Date.now()}`, name: '', amount: '', unit: 'kg' }]);
  }
  function updateRow(id: string, patch: Partial<SpeciesRow>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function removeRow(id: string) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  }
  function resetCalc() {
    setRows(DEFAULT_ROWS);
  }

  function rowToGrams(row: SpeciesRow): number {
    const n = parseFloat(row.amount);
    if (!n || n <= 0) return 0;
    return row.unit === 'kg' ? n * 1000 : n;
  }

  // לכל מין יש להפריש "יותר מ-1%" — בפועל מספיק 1.01% ובד"כ מעגלים מעל.
  function calcSeparation(grams: number): { exactMin: number; recommended: number } {
    if (!grams || grams <= 0) return { exactMin: 0, recommended: 0 };
    const exactMin = grams * 0.0101; // 1.01% מינימום
    // מעגלים מעלה לחצי גרם
    const recommended = Math.ceil(exactMin * 2) / 2;
    return { exactMin: Math.round(exactMin * 10) / 10, recommended };
  }

  // סיכום: רשימה של כל המינים עם משקל הפרשה מומלץ
  const summary = rows
    .map((row) => {
      const g = rowToGrams(row);
      return { row, grams: g, calc: calcSeparation(g) };
    })
    .filter((x) => x.grams > 0);
  const totalToSeparate = summary.reduce((s, x) => s + x.calc.recommended, 0);

  function openKosharot() {
    // קבוצות WhatsApp של רבני כושרות לשאלות פרטניות
    Linking.openURL('https://www.kosharot.co.il/index2.php?id=412570&lang=HEB');
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
        <ScreenHeader title="הפרשת תרומות ומעשרות" subtitle="נוסח ושלבים" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
              מצוות התורה להפריש מן הפירות והירקות הגדלים בארץ ישראל. הנוסח זהה לכל סוגי המוצרים — פירות, ירקות, דגן וקטניות.
            </Text>
          </Card>

          {/* שלב 1: הכנות */}
          <Card>
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>הכנות</Text>
            </View>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>הניחו את הפירות/ירקות</Text> במקום מסודר על משטח / בתוך כלי, כך שיש להם <Text style={{ fontWeight: '700' }}>צד צפון</Text> וצד <Text style={{ fontWeight: '700' }}>דרום</Text>.{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>הפרישו חתיכה אחת קטנה</Text> שגודלה <Text style={{ fontWeight: '700' }}>יותר מ-1.01%</Text> מכלל הפירות (לדוגמא: מתפוח אחד או חלק ממנו). הניחו אותה בצד הצפוני של הפירות (או על גביהם).{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>מטבע מעשר שני</Text>: צריך מטבע מיוחדת (פרוטה אחת לפחות) שנקנתה לצורך זה. ניתן להשתמש במטבע משותפת של בית הכנסת. אם אין - אומרים נוסח קצר יותר.{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>ודאי טבל / ספק טבל</Text>: בודאי טבל (פירות מעץ שלי בארץ ישראל) - מברכים. בספק (פירות מחנות) - לא מברכים, אומרים את הנוסח לתנאי.
            </Text>
          </Card>

          {/* מחשבון - הפרשה מכמה מינים */}
          <Card>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNum, { backgroundColor: colors.accentDark }]}>
                <Text style={styles.stepNumText}>⚖️</Text>
              </View>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>מחשבון הפרשה</Text>
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
              לכל מין יש להפריש בנפרד <Text style={{ fontWeight: '700' }}>יותר מ-1%</Text> מכלל הכמות שלו. הזן את הכמויות בגרמים:
            </Text>

            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {rows.map((row, idx) => {
                const grams = rowToGrams(row);
                const calc = calcSeparation(grams);
                return (
                  <View key={row.id} style={styles.rowGroup}>
                    <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center' }}>
                      <TextInput
                        value={row.name}
                        onChangeText={(v) => updateRow(row.id, { name: v })}
                        placeholder={`שם המין (מלפפון, עגבניה...)`}
                        placeholderTextColor={colors.textMuted}
                        style={[styles.input, { flex: 2 }]}
                        textAlign="right"
                      />
                      <TextInput
                        value={row.amount}
                        onChangeText={(v) => updateRow(row.id, { amount: v.replace(/[^\d.]/g, '') })}
                        placeholder="כמות"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        style={[styles.input, { flex: 1 }]}
                        textAlign="right"
                      />
                      <Pressable
                        onPress={() => updateRow(row.id, { unit: row.unit === 'kg' ? 'g' : 'kg' })}
                        style={styles.unitBtn}
                      >
                        <Text style={[typography.bodyBold, { color: colors.primary }]}>
                          {row.unit === 'kg' ? 'ק"ג' : 'ג׳'}
                        </Text>
                      </Pressable>
                      {rows.length > 1 && (
                        <Pressable onPress={() => removeRow(row.id)} hitSlop={10}>
                          <Text style={{ color: colors.danger, fontSize: 20 }}>✕</Text>
                        </Pressable>
                      )}
                    </View>
                    {grams > 0 && (
                      <View style={styles.calcResult}>
                        <Text style={[typography.bodyBold, { color: colors.primary }]}>
                          להפריש מ-{row.name || `מין ${idx + 1}`}: לפחות {calc.recommended} גרם
                        </Text>
                        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                          (יותר מ-1% של {grams >= 1000 ? `${(grams / 1000).toFixed(2)} ק"ג` : `${grams} ג׳`} = יותר מ-{calc.exactMin} ג׳)
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {summary.length > 0 && (
              <View style={styles.summaryBox}>
                <Text style={[typography.bodyBold, { color: colors.textInverse, marginBottom: spacing.sm }]}>
                  📋 סיכום: כמויות להפריש
                </Text>
                {summary.map(({ row, calc }, idx) => (
                  <View key={row.id} style={styles.summaryRow}>
                    <Text style={[typography.body, { color: colors.textInverse, flex: 1 }]}>
                      {row.name || `מין ${idx + 1}`}
                    </Text>
                    <Text style={[typography.bodyBold, { color: colors.textInverse }]}>
                      {calc.recommended} ג׳
                    </Text>
                  </View>
                ))}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={[typography.bodyBold, { color: colors.textInverse, flex: 1 }]}>
                    סה"כ להפריש (מכל המינים יחד):
                  </Text>
                  <Text style={[typography.h3, { color: colors.textInverse }]}>
                    {totalToSeparate.toFixed(1)} ג׳
                  </Text>
                </View>
                <Text style={[typography.caption, { color: colors.textInverse, opacity: 0.85, marginTop: spacing.sm, fontStyle: 'italic' }]}>
                  💡 קח חתיכה מכל מין בנפרד וגדר כל החתיכות יחד בצד הצפון. אומרים את הנוסח פעם אחת.
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
              <Pressable onPress={addRow} style={[styles.btn, { backgroundColor: colors.primary, flexGrow: 1, minWidth: 140 }]}>
                <Text style={[typography.bodyBold, { color: colors.textInverse }]}>+ הוסף מין</Text>
              </Pressable>
              <Pressable onPress={resetCalc} style={[styles.btn, { backgroundColor: colors.surfaceAlt, flexGrow: 1, minWidth: 140, borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[typography.body, { color: colors.textMuted }]}>אפס</Text>
              </Pressable>
            </View>

            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' }]}>
              💡 כל הכמויות שמחושבות נלקחות בנפרד מכל מין ומונחות יחד בצפון הפירות. אומרים את הנוסח פעם אחת על כולם.
            </Text>
          </Card>

          {/* שלב 2: הברכה */}
          <Card>
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>הברכה (רק בודאי טבל)</Text>
            </View>
            <View style={[styles.sacredBox, { marginTop: spacing.md }]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA}</Text>
            </View>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              בספק טבל (פירות מחנות עם ציון כשרות חלקי) - <Text style={{ fontWeight: '700' }}>לא מברכים</Text>.
            </Text>
          </Card>

          {/* שלב 3: הנוסח */}
          <Card>
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>נוסח ההפרשה</Text>
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
              לפי "מכון כושרות"
            </Text>
            <View style={[styles.sacredBox, { marginTop: spacing.sm }]}>
              <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 30 }]}>{NUSACH}</Text>
            </View>
          </Card>

          {/* שלב 4: אחר הנוסח */}
          <Card>
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>4</Text>
              </View>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>אחרי הנוסח</Text>
            </View>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>החתיכה שהופרשה (תרומה גדולה + תרומת מעשר)</Text> - היא קדושה ואסורה באכילה. עוטפים בשני שקיות סגורות ושמים בפח (כדי שלא יתבזה).{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>שאר הפירות</Text> - מותרים באכילה.{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>המטבע</Text> - שמורה לחילול נוסף. כשמתמלאת בערך - מחללים אותה על מטבע חדשה ומשמידים את הישנה (זורקים לים / לנהר).
            </Text>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>למידע מורחב</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              ההלכה בנושא מורכבת ויש דקויות לפי סוגי הפירות, מקור הקנייה, ומצב השנה (שמיטה / שביעית).
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <Button label="↗ מדריך כושרות המלא" onPress={openKosharot} variant="primary" />
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
  stepHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: colors.textInverse, fontWeight: '700', fontSize: 18 },
  sacredBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowGroup: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    fontSize: 16,
    color: colors.textPrimary,
  },
  calcResult: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
  },
  btn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  unitBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.bg,
    minWidth: 44,
    alignItems: 'center',
  },
  summaryBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: spacing.sm,
  },
});
