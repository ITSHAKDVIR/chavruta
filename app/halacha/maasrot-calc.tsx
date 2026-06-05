import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Unit = 'g' | 'kg' | 'count';

export default function MaasrotCalcScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('1000');
  const [unit, setUnit] = useState<Unit>('g');
  const [year, setYear] = useState<'maasrAni' | 'maasrSheni' | 'maasrRishon'>('maasrSheni');

  const parsed = useMemo(() => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return null;

    const total = unit === 'kg' ? n * 1000 : n;

    const terumahGedolah = Math.max(total * 0.005, 1);
    const maasrRishon = (total - terumahGedolah) * 0.1;
    const trumatMaaser = maasrRishon * 0.1;
    const remaining = total - terumahGedolah - maasrRishon;
    const maaserSheniOrAni = remaining * 0.1;

    const totalToSetAside = terumahGedolah + maaserSheniOrAni;
    const lefty = total - totalToSetAside;

    return {
      total,
      terumahGedolah,
      maasrRishon,
      trumatMaaser,
      maaserSheniOrAni,
      totalToSetAside,
      lefty,
    };
  }, [amount, unit]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="מחשבון תרו״מ בפועל" subtitle="כמה כל אחוז" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>כמות הפרי / ירק:</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="1000"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
              <Pressable onPress={() => setUnit('g')} style={[styles.btn, unit === 'g' && styles.btnActive]}>
                <Text style={[typography.body, { color: unit === 'g' ? colors.textInverse : colors.textPrimary }]}>גרם</Text>
              </Pressable>
              <Pressable onPress={() => setUnit('kg')} style={[styles.btn, unit === 'kg' && styles.btnActive]}>
                <Text style={[typography.body, { color: unit === 'kg' ? colors.textInverse : colors.textPrimary }]}>ק״ג</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שנת מעשרות:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
              <Pressable onPress={() => setYear('maasrSheni')} style={[styles.btn, year === 'maasrSheni' && styles.btnActive]}>
                <Text style={[typography.caption, { color: year === 'maasrSheni' ? colors.textInverse : colors.textPrimary }]}>
                  מעשר שני (1,2,4,5)
                </Text>
              </Pressable>
              <Pressable onPress={() => setYear('maasrAni')} style={[styles.btn, year === 'maasrAni' && styles.btnActive]}>
                <Text style={[typography.caption, { color: year === 'maasrAni' ? colors.textInverse : colors.textPrimary }]}>
                  מעשר עני (3,6)
                </Text>
              </Pressable>
            </View>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              שמיטה (7) - אין מעשר. שנות שמיטה: ה׳תשפ״ב, תשפ״ט וכו׳.
            </Text>
          </Card>

          {parsed && (
            <>
              <Card variant="primary">
                <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>סה״כ להפריש</Text>
                <Text style={[typography.display, { color: colors.textPrimary, marginTop: 4 }]}>
                  {parsed.totalToSetAside.toFixed(1)} גרם
                </Text>
                <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, marginTop: 4 }]}>
                  ({((parsed.totalToSetAside / parsed.total) * 100).toFixed(2)}% מהכמות)
                </Text>
              </Card>

              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>פירוט</Text>
                <Row label="תרומה גדולה" value={parsed.terumahGedolah} note="כל שהוא (פחות מ-1/100, אבל לא פחות ממשקל אגוז ~30ג)" highlight />
                <Row label="מעשר ראשון" value={parsed.maasrRishon} note="10% מהשאר אחרי תרומה גדולה. שייך ללוי" />
                <Row label="תרומת מעשר" value={parsed.trumatMaaser} note="10% מהמעשר ראשון - מופרש על-ידי הלוי" />
                <Row
                  label={year === 'maasrAni' ? 'מעשר עני' : 'מעשר שני'}
                  value={parsed.maaserSheniOrAni}
                  note={year === 'maasrAni' ? '10% נוספים - לעניים' : '10% נוספים - לאכילה בירושלים (היום נפדה במטבע)'}
                  highlight
                />
              </Card>

              <Card variant="accent">
                <Text style={[typography.h3, { color: colors.primaryDark }]}>מעשי</Text>
                <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
                  <Text style={{ fontWeight: '700' }}>תוליש מהפרי</Text>: לפחות {parsed.terumahGedolah.toFixed(1)} גרם + טיפה (סה״כ ~{(parsed.totalToSetAside + 1).toFixed(0)}ג){'\n'}
                  <Text style={{ fontWeight: '700' }}>תניח בצד</Text>: ליד הפרי{'\n'}
                  <Text style={{ fontWeight: '700' }}>תאמר את הנוסח</Text>: ראה ב"הפרשת תרו״מ"{'\n'}
                  <Text style={{ fontWeight: '700' }}>תזרק</Text>: במעטפה לפח (לא בידיים חשופות)
                </Text>
              </Card>
            </>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>שיעורים נוספים</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              <Text style={{ fontWeight: '700' }}>תרומה גדולה</Text>: דרבנן - 1/40 (חזון איש), 1/50 (רגיל), 1/60 (נדיב מועט). מדאורייתא: כל שהוא.{'\n\n'}
              <Text style={{ fontWeight: '700' }}>תרומת מעשר</Text>: דאורייתא - 1/10 מהמעשר ראשון.{'\n\n'}
              <Text style={{ fontWeight: '700' }}>מעשר עני</Text>: בשנים 3 ו-6 (במחזור שמיטה).
            </Text>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

function Row({ label, value, note, highlight }: { label: string; value: number; note?: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: highlight ? colors.primary : colors.textPrimary, fontWeight: highlight ? '700' : '400' }]}>{label}</Text>
        {note && <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{note}</Text>}
      </View>
      <Text style={[typography.h3, { color: colors.primary }]}>{value.toFixed(1)} ג</Text>
    </View>
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
    textAlign: 'right',
    backgroundColor: colors.bg,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  btnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
});
