import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type FlourKind = 'white-wheat' | 'whole-wheat' | 'other';

const BRACHA = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֺתָיו וְצִוָּנוּ לְהַפְרִישׁ חַלָּה.`;

const NUSACH = `הֲרֵי זוֹ חַלָּה.`;

// שיעורי החיוב — מבוססים על מכון כושרות:
const WHITE_WHEAT_OPINIONS = [
  { name: 'חזון איש', min: 2250, withBracha: 2250, note: 'שיעור החזון איש - חיוב והברכה מ-2.25 ק"ג.' },
  { name: 'ר׳ חיים נאה', min: 1200, withBracha: 1666, note: 'חיוב מ-1.2 ק"ג, ברכה מ-1.666 ק"ג.' },
  { name: 'הרב עובדיה יוסף', min: 1200, withBracha: 1580, note: 'שיעור הרב עובדיה - ברכה מ-1.58 ק"ג.' },
];

// קמחים אחרים: חישוב לפי נפח 2.5 ליטר
const OTHER_FLOUR_NOTE = `בקמחים אחרים (כוסמין, שיפון, שעורה, שיבולת שועל, או קמח לבן מנופה דק) - השיעור נמדד לפי נפח של 2.5 ליטר ולא לפי משקל. המשקל משתנה לפי סוג הקמח (קמח אווירי שוקל פחות).`;

/** טבלת מאפים — מבוססת על אתר כושרות, מדריך "עיסות הפרשת חלה". */
type BakedStatus = 'with-bracha' | 'no-bracha' | 'exempt' | 'depends';
type BakedItem = {
  id: string;
  label: string;
  status: BakedStatus;
  note?: string;
};

const BAKED_ITEMS: BakedItem[] = [
  { id: 'lechem', label: 'לחם', status: 'with-bracha' },
  { id: 'challah', label: 'חלה / חלה מתוקה', status: 'with-bracha' },
  { id: 'pita', label: 'פיתה', status: 'with-bracha', note: 'גם בטאבון או במחבת.' },
  { id: 'matza', label: 'מצה', status: 'with-bracha' },
  { id: 'lachma-ajin', label: 'לחוח', status: 'no-bracha', note: 'יש לצרף לאחר האפייה.' },
  { id: 'kubaneh', label: 'כובאנה', status: 'with-bracha', note: 'תימנים מסוימים נוהגים בלי ברכה.' },
  { id: 'jachnun', label: 'ג׳חנון', status: 'with-bracha', note: 'תימנים מסוימים נוהגים בלי ברכה.' },
  { id: 'malawach', label: 'מלאווח', status: 'depends', note: 'מעט שמן - בברכה. שמן עמוק - בלי ברכה.' },
  { id: 'mufleta', label: 'מופלטה', status: 'depends', note: 'אפויה/מטוגנת במעט שמן - בברכה. שמן עמוק - בלי ברכה.' },
  { id: 'pizza', label: 'פיצה', status: 'with-bracha' },
  { id: 'borekas', label: 'בורקס', status: 'with-bracha' },
  { id: 'bagel', label: 'בייגל', status: 'with-bracha' },
  { id: 'bagela', label: 'בקלאווה', status: 'with-bracha' },
  { id: 'rugelach', label: 'רוגלאך', status: 'with-bracha' },
  { id: 'croissant', label: 'קרואסון', status: 'with-bracha' },
  { id: 'strudel', label: 'שטרודל', status: 'with-bracha' },
  { id: 'chachapuri', label: 'חצ׳פורי', status: 'with-bracha' },
  { id: 'pachzaniyot', label: 'פחזניות', status: 'with-bracha' },
  { id: 'kaltita', label: 'קלתית', status: 'with-bracha' },
  { id: 'cookies', label: 'עוגיות', status: 'with-bracha' },
  { id: 'cake-thick', label: 'עוגה מעיסה עבה', status: 'with-bracha' },
  { id: 'cake-liquid', label: 'עוגה מעיסה נוזלית', status: 'with-bracha', note: 'יש לצרף לאחר האפייה.' },
  { id: 'waffle', label: 'וופל בלגי', status: 'with-bracha', note: 'יש לצרף הכל לאחר האפייה.' },
  { id: 'pancake', label: 'פנקייק', status: 'depends', note: 'בלילה רכה - פטור. בלילה עבה - בברכה.' },
  { id: 'blintzes', label: 'בלינצ׳ס', status: 'exempt' },
  { id: 'shpatzle', label: 'שפצלה', status: 'exempt' },
  { id: 'dayssa', label: 'דייסה', status: 'exempt' },
  { id: 'sufganiyot', label: 'סופגניות', status: 'no-bracha' },
  { id: 'sping', label: 'ספינג׳', status: 'no-bracha' },
  { id: 'levivot-kemach', label: 'לביבות מקמח', status: 'depends', note: 'אפויות - בברכה. מטוגנות בשמן עמוק - בלי ברכה.' },
  { id: 'sambusak', label: 'סמבוסק', status: 'depends', note: 'אפוי - בברכה. מטוגן בשמן עמוק - בלי ברכה.' },
  { id: 'agrol', label: 'אגרול', status: 'depends', note: 'אפוי/מטוגן מעט - בברכה. שמן עמוק - בלי ברכה.' },
  { id: 'zalabiya', label: 'זלאביה', status: 'depends', note: 'שמן מועט - בברכה. טיגון רגיל - בלי ברכה.' },
  { id: 'fricasse', label: 'פריקסה', status: 'depends', note: 'אפויה בתנור - בברכה. מטוגנת - בלי ברכה.' },
  { id: 'pie', label: 'פאי', status: 'depends', note: 'פטור אם הבסיס מפירורי בצק קנויים.' },
  { id: 'quiche', label: 'קיש', status: 'with-bracha', note: 'רק אם הבסיס בצק.' },
  { id: 'pashtida', label: 'פשטידה', status: 'with-bracha', note: 'רק אם הבסיס בצק.' },
  { id: 'noodles', label: 'איטריות ביתיות', status: 'no-bracha' },
  { id: 'lasagna', label: 'לזניה ביתית', status: 'with-bracha' },
  { id: 'ravioli', label: 'רביולי', status: 'no-bracha' },
  { id: 'kreplach', label: 'קרפלאך', status: 'no-bracha' },
  { id: 'kishke', label: 'קישקה', status: 'no-bracha' },
  { id: 'kuba', label: 'קובה', status: 'no-bracha' },
  { id: 'kneidlach', label: 'קניידלך', status: 'no-bracha', note: 'המצה כבר הופרשה.' },
];

const STATUS_LABEL: Record<BakedStatus, string> = {
  'with-bracha': '✓ חייבת בברכה',
  'no-bracha': '⚠ חייבת בלי ברכה',
  'exempt': '✗ פטורה',
  'depends': '❓ תלוי באופן ההכנה',
};

const STATUS_COLOR: Record<BakedStatus, string> = {
  'with-bracha': colors.success,
  'no-bracha': '#B4791D',
  'exempt': colors.textMuted,
  'depends': colors.primary,
};

export default function ChallahScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [flourKind, setFlourKind] = useState<FlourKind>('white-wheat');
  const [volume, setVolume] = useState('');
  const [selectedBaked, setSelectedBaked] = useState<string | null>(null);
  const selectedItem = selectedBaked ? BAKED_ITEMS.find((b) => b.id === selectedBaked) : null;

  const grams = parseFloat(amount) || 0;
  const liters = parseFloat(volume) || 0;

  function statusByGrams(g: number): {
    status: 'none' | 'noBracha' | 'withBracha';
    /** The most-lenient opinion that obligates at this weight (the one that "triggers" first). */
    opinion?: string;
    /** All opinions whose threshold this weight passes — useful for context. */
    triggeringOpinions?: string[];
  } {
    if (g <= 0) return { status: 'none' };
    // For "withBracha" - find the LEAST strict opinion the weight passes.
    // i.e. the smallest withBracha threshold that g >= it.
    const withBrachaTriggers = WHITE_WHEAT_OPINIONS
      .filter((op) => g >= op.withBracha)
      .sort((a, b) => a.withBracha - b.withBracha); // ascending - leniencies first
    if (withBrachaTriggers.length > 0) {
      return {
        status: 'withBracha',
        opinion: withBrachaTriggers[0].name,
        triggeringOpinions: withBrachaTriggers.map((o) => o.name),
      };
    }
    // For "noBracha" - same: smallest min that g >= it.
    const minTriggers = WHITE_WHEAT_OPINIONS
      .filter((op) => g >= op.min)
      .sort((a, b) => a.min - b.min);
    if (minTriggers.length > 0) {
      return {
        status: 'noBracha',
        opinion: minTriggers[0].name,
        triggeringOpinions: minTriggers.map((o) => o.name),
      };
    }
    return { status: 'none' };
  }

  const statusG = statusByGrams(grams);
  const statusV = liters >= 2.5 ? 'withBracha' : liters >= 1.8 ? 'noBracha' : 'none';

  function openKosharot() {
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
        <ScreenHeader title="הפרשת חלה" subtitle="שיעורים, נוסח, מאפים חייבים" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
              מצוות התורה להפריש חלק מהבצק לפני אפייה. השיעור משתנה לפי סוג הקמח ופי הפוסקים.
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <Button label="↗ מדריך כושרות המלא" onPress={openKosharot} variant="primary" />
            </View>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>סוג הקמח:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Pressable
                onPress={() => setFlourKind('white-wheat')}
                style={[styles.kindBtn, flourKind === 'white-wheat' && styles.kindBtnActive]}
              >
                <Text style={[typography.body, { color: flourKind === 'white-wheat' ? colors.textInverse : colors.textPrimary }]}>
                  קמח לבן (חיטה)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFlourKind('other')}
                style={[styles.kindBtn, flourKind === 'other' && styles.kindBtnActive]}
              >
                <Text style={[typography.body, { color: flourKind === 'other' ? colors.textInverse : colors.textPrimary }]}>
                  קמח אחר / מלא / כוסמין / שיפון
                </Text>
              </Pressable>
            </View>
          </Card>

          {flourKind === 'white-wheat' && (
            <>
              <Card>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>כמות הקמח (גרם):</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="לדוגמא: 2000"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  textAlign="right"
                />
              </Card>

              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  שיעורי החיוב לקמח לבן
                </Text>
                {WHITE_WHEAT_OPINIONS.map((op) => (
                  <View key={op.name} style={styles.opinionRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{op.name}</Text>
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{op.note}</Text>
                    </View>
                    <Pill label={`${op.withBracha}g`} tone="default" />
                  </View>
                ))}
              </Card>

              {grams > 0 && (
                <Card variant={statusG.status === 'withBracha' ? 'accent' : statusG.status === 'noBracha' ? 'primary' : 'default'}>
                  <Text style={[typography.h3, { color: statusG.status === 'none' ? colors.textPrimary : statusG.status === 'withBracha' ? colors.primaryDark : colors.textInverse }]}>
                    {statusG.status === 'withBracha'
                      ? '✓ הפרשה בברכה'
                      : statusG.status === 'noBracha'
                      ? '⚠ הפרשה בלי ברכה'
                      : '✗ פחות משיעור החיוב - פטור'}
                  </Text>
                  <Text style={[typography.body, { color: statusG.status === 'none' ? colors.textMuted : statusG.status === 'withBracha' ? colors.primaryDark : colors.textInverse, opacity: 0.9, marginTop: 4 }]}>
                    {grams} גרם קמח
                  </Text>
                  {statusG.triggeringOpinions && statusG.triggeringOpinions.length > 0 && (
                    <Text style={[typography.caption, { color: statusG.status === 'withBracha' ? colors.primaryDark : colors.textInverse, opacity: 0.85, marginTop: spacing.sm }]}>
                      לפי {statusG.triggeringOpinions.join(' ו')}
                    </Text>
                  )}
                </Card>
              )}
            </>
          )}

          {flourKind === 'other' && (
            <>
              <Card>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>נפח הקמח (ליטר):</Text>
                <TextInput
                  value={volume}
                  onChangeText={setVolume}
                  keyboardType="numeric"
                  placeholder="לדוגמא: 2.5"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  textAlign="right"
                />
                <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
                  {OTHER_FLOUR_NOTE}
                </Text>
              </Card>

              <Card>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שיעורי החיוב לפי נפח</Text>
                <View style={styles.opinionRow}>
                  <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>חיוב בלי ברכה</Text>
                  <Pill label="1.8 ליטר" tone="warning" />
                </View>
                <View style={styles.opinionRow}>
                  <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>חיוב עם ברכה</Text>
                  <Pill label="2.5 ליטר" tone="success" />
                </View>
              </Card>

              {liters > 0 && (
                <Card variant={statusV === 'withBracha' ? 'accent' : statusV === 'noBracha' ? 'primary' : 'default'}>
                  <Text style={[typography.h3, { color: statusV === 'none' ? colors.textPrimary : statusV === 'withBracha' ? colors.primaryDark : colors.textInverse }]}>
                    {statusV === 'withBracha'
                      ? '✓ הפרשה בברכה'
                      : statusV === 'noBracha'
                      ? '⚠ הפרשה בלי ברכה'
                      : '✗ פטור'}
                  </Text>
                  <Text style={[typography.body, { color: statusV === 'none' ? colors.textMuted : statusV === 'withBracha' ? colors.primaryDark : colors.textInverse, opacity: 0.9, marginTop: 4 }]}>
                    {liters} ליטר
                  </Text>
                </Card>
              )}
            </>
          )}

          {/* הנוסח תמיד מוצג, לא מותנה במילוי */}
          <Card>
            <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>ברכה (כשמפרישים עם ברכה)</Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>נוסח ההפרשה</Text>
            <View style={styles.sacredBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary, fontSize: 22 }]}>{NUSACH}</Text>
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
              מפרישים <Text style={{ fontWeight: '700' }}>כזית</Text> (כ-27 גרם) מהבצק לפני אפייה. אומרים את הברכה (אם חייבים בה) ואחר כך את הנוסח.
            </Text>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>מה עושים עם החלה המופרשת</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              החלה קדושה ואסורה באכילה. בארץ ישראל אין כהן טהור היום שיכול לאכול אותה. הסדר עפ"י מכון כושרות:{'\n\n'}
              <Text style={{ fontWeight: '700' }}>1. לכתחילה — לשרוף.</Text> בתנור על תבנית נפרדת.{'\n\n'}
              <Text style={{ fontWeight: '700' }}>2. חלופה טובה — לעטוף בנייר כסף</Text> ולהניח בתחתית התנור (לא על תבנית האפייה ולא על הסבכה הראשית).{'\n\n'}
              <Text style={{ fontWeight: '700' }}>3. אם אי אפשר —</Text> עוטפים בשתי שקיות נפרדות וזורקים לאשפה.{'\n\n'}
              ⚠ אסור להניח על תבנית האפייה הרגילה (כי אחר כך אופים עליה).
            </Text>
          </Card>

          {/* בוחר המאפה - תוצאה הלכתית פר־פריט */}
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              איזה מאפה אתה מכין?
            </Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md }]}>
              סמן את המאפה - ותראה אם יש חיוב הפרשה ובאיזה אופן.
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
              {BAKED_ITEMS.map((item) => {
                const active = selectedBaked === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedBaked(active ? null : item.id)}
                    style={[styles.bakedChip, active && styles.bakedChipActive]}
                  >
                    <Text style={[typography.small, { color: active ? colors.textInverse : colors.textPrimary }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {selectedItem && (
            <Card variant="accent">
              <Text style={[typography.h3, { color: STATUS_COLOR[selectedItem.status] }]}>
                {STATUS_LABEL[selectedItem.status]}
              </Text>
              <Text style={[typography.body, { color: colors.primaryDark, marginTop: 4 }]}>
                {selectedItem.label}
              </Text>
              {selectedItem.note && (
                <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
                  {selectedItem.note}
                </Text>
              )}
              <Text
                style={[
                  typography.caption,
                  { color: colors.primaryDark, opacity: 0.7, marginTop: spacing.sm, fontStyle: 'italic' },
                ]}
              >
                המקור: מדריך כושרות "עיסות הפרשת חלה" (kosharot.co.il).
              </Text>
            </Card>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              טבלה מלאה
            </Text>
            {(['with-bracha', 'no-bracha', 'depends', 'exempt'] as BakedStatus[]).map((st) => {
              const items = BAKED_ITEMS.filter((b) => b.status === st);
              if (items.length === 0) return null;
              return (
                <View key={st} style={{ marginTop: spacing.sm }}>
                  <Text style={[typography.bodyBold, { color: STATUS_COLOR[st] }]}>{STATUS_LABEL[st]}</Text>
                  <View style={{ gap: 4, marginTop: 4 }}>
                    {items.map((b) => (
                      <Text key={b.id} style={[typography.body, { color: colors.textSecondary }]}>
                        ⊙ {b.label}
                        {b.note ? <Text style={{ fontSize: 12, color: colors.textMuted }}>{` — ${b.note}`}</Text> : null}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md, fontStyle: 'italic' }]}>
              למקרי גבול / שאלות ספציפיות - מדריך כושרות "עיסות הפרשת חלה".
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
  topBar: { padding: spacing.lg },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  kindBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    flexGrow: 1,
    minWidth: 140,
    alignItems: 'center',
  },
  kindBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  bakedChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bakedChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  opinionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sacredBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
