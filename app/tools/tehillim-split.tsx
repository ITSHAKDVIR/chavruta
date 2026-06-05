import React, { useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, View, Pressable, Share, ActivityIndicator } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Person = { id: string; name: string; from: number; to: number };

const KEY = '@yahadut/tehillim-split';

function splitTehillim(numPeople: number, totalChapters = 150): { from: number; to: number }[] {
  const per = Math.floor(totalChapters / numPeople);
  const remainder = totalChapters % numPeople;
  const out: { from: number; to: number }[] = [];
  let cursor = 1;
  for (let i = 0; i < numPeople; i++) {
    const count = per + (i < remainder ? 1 : 0);
    out.push({ from: cursor, to: cursor + count - 1 });
    cursor += count;
  }
  return out;
}

/**
 * Create a shared Tehillim distribution on the kosharot server. The user's
 * `refuah` (dedication name) is sent as the group's dedication, so the
 * shared page shows "לרפואת ..." or "לעילוי נשמת ..." at the top for every
 * participant. */
async function createSharedDistribution(refuah: string) {
  const dedication = refuah.trim();
  try {
    const r = await fetch('https://www.kosharot.co.il/BIMD/tehillim-groups.php?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: dedication ? `חלוקת תהילים — ${dedication}` : 'חלוקת תהילים',
        dedication,
      }),
    });
    const data = await r.json();
    if (data.link) {
      await Share.share({
        message: dedication
          ? `הצטרף לחלוקת תהילים שיתופית לרפואת/לעילוי נשמת ${dedication}: ${data.link}`
          : `הצטרף לחלוקת תהילים שיתופית: ${data.link}`,
        url: data.link,
      });
    } else {
      Alert.alert('שגיאה', 'לא ניתן ליצור חלוקה כעת');
    }
  } catch (e: any) {
    Alert.alert('שגיאה', e?.message || 'בעיה');
  }
}

export default function TehillimSplitScreen() {
  const router = useRouter();
  const [names, setNames] = useState<string[]>(['', '', '']);
  const [assigned, setAssigned] = useStoredJSON<Person[]>(KEY, []);
  const [completed, setCompleted] = useStoredJSON<Record<string, boolean>>(`${KEY}-done`, {});
  const [refuah, setRefuah] = useState('');

  const cleanNames = names.map((n) => n.trim()).filter(Boolean);

  function assignAll() {
    if (cleanNames.length === 0) return;
    const ranges = splitTehillim(cleanNames.length, 150);
    const list: Person[] = cleanNames.map((n, i) => ({
      id: Date.now().toString(36) + '-' + i,
      name: n,
      from: ranges[i].from,
      to: ranges[i].to,
    }));
    setAssigned(list);
    setCompleted({});
  }

  function resetAll() {
    setAssigned([]);
    setCompleted({});
    setNames(['', '', '']);
  }

  function toggleDone(id: string) {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function shareAssignments() {
    const lines = assigned.map(
      (p) => `${p.name}: פרקים ${hebrewNumeral(p.from)} - ${hebrewNumeral(p.to)}`,
    );
    const text = `📖 חלוקת ספר תהילים${refuah ? ` לרפואת ${refuah}` : ''}\n\n${lines.join('\n')}\n\nמתוך אפליקציית חברותא`;
    Share.share({ message: text });
  }

  function addNameSlot() {
    setNames((n) => [...n, '']);
  }
  function setName(i: number, val: string) {
    setNames((arr) => arr.map((n, idx) => (idx === i ? val : n)));
  }

  const totalDone = assigned.filter((p) => completed[p.id]).length;
  const allDone = assigned.length > 0 && totalDone === assigned.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="חלוקת תהילים" subtitle="150 פרקים בין מספר אנשים" />

        {/* Shared distribution — opens our PHP server which generates a
            shareable link so multiple people can claim chapters in real-time */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <Button
            label="🌐 חלוקה שיתופית באינטרנט"
            onPress={() => createSharedDistribution(refuah)}
            variant="primary"
            fullWidth
          />
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4, textAlign: 'center', fontStyle: 'italic' }]}>
            יוצר קישור לחלוקה חיה — כל אחד יבחר פרקים בעצמו
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="default">
            <Text style={[typography.body, { color: colors.textPrimary }]}>
              מנהג ישראל לחלק את ספר תהילים בין כמה אנשים לכבוד יום השנה, רפואה שלמה, או בשעת מצוקה.
              {'\n\n'}
              הזן את שמות המשתתפים והכלי יחלק את הפרקים בצורה שווה.
            </Text>
          </Card>

          {assigned.length === 0 && (
            <>
              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  לעילוי נשמת / לרפואת (לא חובה)
                </Text>
                <TextInput
                  style={styles.input}
                  value={refuah}
                  onChangeText={setRefuah}
                  placeholder="למשל: יעקב בן שרה"
                  placeholderTextColor={colors.textMuted}
                />
              </Card>

              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  שמות המשתתפים ({cleanNames.length})
                </Text>
                {names.map((n, i) => (
                  <TextInput
                    key={i}
                    style={[styles.input, { marginTop: spacing.xs }]}
                    value={n}
                    onChangeText={(v) => setName(i, v)}
                    placeholder={`משתתף ${i + 1}`}
                    placeholderTextColor={colors.textMuted}
                  />
                ))}
                <Pressable onPress={addNameSlot} style={{ marginTop: spacing.sm }}>
                  <Text style={[typography.bodyBold, { color: colors.primary, textAlign: 'center' }]}>
                    + הוסף משתתף
                  </Text>
                </Pressable>
              </Card>

              <Button label="📖 חלק את הפרקים" onPress={assignAll} variant="primary" />
            </>
          )}

          {assigned.length > 0 && (
            <>
              <Card variant={allDone ? 'primary' : 'accent'}>
                <Text
                  style={[
                    typography.h2,
                    { color: allDone ? colors.textInverse : colors.primaryDark, textAlign: 'center' },
                  ]}
                >
                  {allDone ? '✨ סיום ספר תהילים!' : `${totalDone} / ${assigned.length} סיימו`}
                </Text>
                {refuah && !allDone && (
                  <Text
                    style={[
                      typography.body,
                      { color: colors.primaryDark, textAlign: 'center', marginTop: 4 },
                    ]}
                  >
                    לרפואת {refuah}
                  </Text>
                )}
              </Card>

              {assigned.map((p) => {
                const done = !!completed[p.id];
                return (
                  <Pressable key={p.id} onPress={() => toggleDone(p.id)}>
                    <Card variant={done ? 'primary' : 'default'}>
                      <View style={styles.row}>
                        <Text style={[typography.body, { color: done ? colors.textInverse : colors.textPrimary }]}>
                          {done ? '✓ ' : '○ '}
                          <Text style={{ fontWeight: '700' }}>{p.name}</Text>
                        </Text>
                        <Text
                          style={[
                            typography.bodyBold,
                            { color: done ? colors.textInverse : colors.primary },
                          ]}
                        >
                          {hebrewNumeral(p.from)} - {hebrewNumeral(p.to)}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}

              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
                <Button label="📤 שתף חלוקה" onPress={shareAssignments} variant="primary" style={{ flex: 1 }} />
                <Button label="התחל חדש" onPress={resetAll} variant="secondary" style={{ flex: 1 }} />
              </View>
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
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
});
