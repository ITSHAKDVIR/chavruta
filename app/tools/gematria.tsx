import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const STANDARD: Record<string, number> = { א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10, כ: 20, ל: 30, מ: 40, נ: 50, ס: 60, ע: 70, פ: 80, צ: 90, ק: 100, ר: 200, ש: 300, ת: 400, ך: 20, ם: 40, ן: 50, ף: 80, ץ: 90 };
const SOFIT: Record<string, number> = { ך: 500, ם: 600, ן: 700, ף: 800, ץ: 900 };

function calc(text: string, method: string): number {
  const chars = Array.from(text);
  let sum = 0;
  switch (method) {
    case 'standard':
      for (const c of chars) sum += STANDARD[c] ?? 0;
      return sum;
    case 'mispar-katan':
      for (const c of chars) {
        const v = STANDARD[c] ?? 0;
        sum += v > 0 ? ((v - 1) % 9) + 1 : 0;
      }
      return sum;
    case 'mispar-gadol':
      for (const c of chars) sum += SOFIT[c] ?? STANDARD[c] ?? 0;
      return sum;
    case 'mispar-katan-mukhrah':
      const total = calc(text, 'standard');
      let n = total;
      while (n > 9) n = String(n).split('').reduce((s, d) => s + parseInt(d, 10), 0);
      return n;
    case 'atbash':
      const ATBASH: Record<string, string> = {
        א: 'ת', ב: 'ש', ג: 'ר', ד: 'ק', ה: 'צ', ו: 'פ', ז: 'ע', ח: 'ס', ט: 'נ',
        י: 'מ', כ: 'ל', ל: 'כ', מ: 'י', נ: 'ט', ס: 'ח', ע: 'ז', פ: 'ו', צ: 'ה',
        ק: 'ד', ר: 'ג', ש: 'ב', ת: 'א',
      };
      const swapped = chars.map((c) => ATBASH[c] ?? c).join('');
      return calc(swapped, 'standard');
    case 'milui':
      const MILUI: Record<string, string> = {
        א: 'אלף', ב: 'בית', ג: 'גימל', ד: 'דלת', ה: 'הא', ו: 'וו', ז: 'זין', ח: 'חית',
        ט: 'טית', י: 'יוד', כ: 'כף', ל: 'למד', מ: 'מם', נ: 'נון', ס: 'סמך', ע: 'עין',
        פ: 'פא', צ: 'צדי', ק: 'קוף', ר: 'ריש', ש: 'שין', ת: 'תו',
      };
      let total2 = 0;
      for (const c of chars) {
        const full = MILUI[c];
        if (full) total2 += calc(full, 'standard');
      }
      return total2;
    case 'kollel':
      const main = calc(text, 'standard');
      return main + chars.filter((c) => STANDARD[c]).length;
    default: return 0;
  }
}

const METHODS = [
  { id: 'standard', name: 'גימטריה רגילה', note: 'א=1, ב=2... ת=400' },
  { id: 'mispar-gadol', name: 'מספר גדול', note: 'כולל אותיות סופיות (ך=500, ם=600...)' },
  { id: 'mispar-katan', name: 'מספר קטן', note: 'יחידות בלבד (20→2, 100→1)' },
  { id: 'mispar-katan-mukhrah', name: 'קטן מוכרח', note: 'מסכמים ספרות עד 1-9' },
  { id: 'atbash', name: 'אתב"ש', note: 'מחליפים את האותיות (א↔ת, ב↔ש)' },
  { id: 'milui', name: 'מילוי', note: 'גימטריה של שם האות המלא' },
  { id: 'kollel', name: 'עם הכולל', note: 'גימטריה רגילה + מספר האותיות' },
];

export default function GematriaAdvancedScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const results = useMemo(() => METHODS.map((m) => ({ ...m, value: calc(text, m.id) })), [text]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text></Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="גימטריה מתקדמת" subtitle="7 שיטות חישוב" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>מילה / פסוק:</Text>
            <TextInput value={text} onChangeText={setText} placeholder="הזן בעברית" placeholderTextColor={colors.textMuted} style={styles.input} />
          </Card>

          {text.trim() && results.map((r) => (
            <Card key={r.id}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{r.name}</Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{r.note}</Text>
                </View>
                <Text style={[typography.display, { color: colors.primary, fontSize: 32 }]}>{r.value}</Text>
              </View>
            </Card>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  input: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 24, color: colors.textPrimary, textAlign: 'right', backgroundColor: colors.bg },
});
