import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { Keys } from '../../src/storage/storage';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Entry = { id: string; date: string; amount: number; type: 'income' | 'given'; note: string };

export default function MaaserScreen() {
  const router = useRouter();
  const [entries, setEntries] = useStoredJSON<Entry[]>(Keys.maaserKesafim, []);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const totalIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalGiven = entries.filter((e) => e.type === 'given').reduce((s, e) => s + e.amount, 0);
  const obligation = totalIncome / 10;
  const remaining = obligation - totalGiven;

  function add(type: 'income' | 'given') {
    const v = parseFloat(amount);
    if (!v || v <= 0) return;
    const entry: Entry = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      amount: v,
      type,
      note: note.trim(),
    };
    setEntries((list) => [entry, ...list]);
    setAmount('');
    setNote('');
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
        <ScreenHeader title="מעשר כספים" subtitle="עוקב הכנסות וצדקה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
            <View style={[styles.stat, { backgroundColor: colors.surface }]}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>חובה למעשר</Text>
              <Text style={[typography.h2, { color: colors.primary }]}>₪ {obligation.toFixed(0)}</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.surface }]}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>נתת</Text>
              <Text style={[typography.h2, { color: colors.success }]}>₪ {totalGiven.toFixed(0)}</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.surface }]}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>נשאר</Text>
              <Text style={[typography.h2, { color: remaining > 0 ? colors.warning : colors.success }]}>
                ₪ {Math.max(remaining, 0).toFixed(0)}
              </Text>
            </View>
          </View>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>סכום (₪):</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md }]}>
              הערה (אופציונלי):
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="לדוגמא: משכורת חודש כסלו"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
              <Button label="הכנסה" onPress={() => add('income')} fullWidth style={{ flex: 1 }} />
              <Button label="צדקה ניתנת" onPress={() => add('given')} variant="secondary" fullWidth style={{ flex: 1 }} />
            </View>
          </Card>

          {entries.length > 0 ? (
            <View>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>היסטוריה</Text>
              {entries.slice(0, 20).map((e) => (
                <Card key={e.id} style={{ marginBottom: spacing.xs }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                        {e.type === 'income' ? '+ הכנסה' : '- צדקה'}
                      </Text>
                      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                        {new Date(e.date).toLocaleDateString('he-IL')} {e.note ? `· ${e.note}` : ''}
                      </Text>
                    </View>
                    <Text
                      style={[
                        typography.h3,
                        { color: e.type === 'income' ? colors.primary : colors.success },
                      ]}
                    >
                      ₪{e.amount}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  stat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
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
});
