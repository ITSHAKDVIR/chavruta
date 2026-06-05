import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
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

type Choleh = { id: string; name: string; mothersName: string; note: string; addedAt: number };

function buildMiSheberach(names: { name: string; mothersName: string }[]): string {
  if (names.length === 0) return '';
  const namesText = names.map((n) => `${n.name} בן/בת ${n.mothersName}`).join(' וְ');
  return `מִי שֶׁבֵּרַךְ אֲבוֹתֵינוּ, אַבְרָהָם יִצְחָק וְיַעֲקֹב, מֹשֶׁה אַהֲרֹן דָּוִד וּשְׁלֹמֹה, הוּא יְבָרֵךְ וִירַפֵּא אֶת ${namesText}.

בַּעֲבוּר שֶׁאֲנַחְנוּ מִתְפַּלְּלִים עֲבוּרָם, וּבִשְׂכַר זֶה, הַקָּדוֹשׁ בָּרוּךְ הוּא יִמָּלֵא רַחֲמִים עֲלֵיהֶם, לְהַחֲלִימָם וּלְרַפֹּאתָם וּלְהַחֲזִיקָם וּלְהַחֲיוֹתָם, וְיִשְׁלַח לָהֶם מְהֵרָה רְפוּאָה שְׁלֵמָה מִן הַשָּׁמַיִם, רְפוּאַת הַנֶּפֶשׁ וּרְפוּאַת הַגּוּף.

בְּתוֹךְ שְׁאָר חוֹלֵי יִשְׂרָאֵל, הַשְׁתָּא, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְנֹאמַר אָמֵן.`;
}

function buildRefaeinuInsertion(names: { name: string; mothersName: string }[]): string {
  if (names.length === 0) return '';
  const namesText = names.map((n) => `${n.name} בֶּן/בַּת ${n.mothersName}`).join(' וְאֶת ');
  return `יְהִי רָצוֹן מִלְּפָנֶיךָ ה' אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתִּשְׁלַח מְהֵרָה רְפוּאָה שְׁלֵמָה מִן הַשָּׁמַיִם, רְפוּאַת הַנֶּפֶשׁ וּרְפוּאַת הַגּוּף, לְחוֹלֶה ${namesText} בְּתוֹךְ שְׁאָר חוֹלֵי יִשְׂרָאֵל.`;
}

export default function CholimScreen() {
  const router = useRouter();
  const [list, setList] = useStoredJSON<Choleh[]>(Keys.cholimList, []);
  const [name, setName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  function add() {
    if (!name.trim() || !motherName.trim()) {
      const msg = 'יש להזין שם ושם האם';
      if (Platform.OS === 'web' && typeof (window as any).alert === 'function') (window as any).alert(msg);
      else Alert.alert('שגיאה', msg);
      return;
    }
    const entry: Choleh = {
      id: String(Date.now()),
      name: name.trim(),
      mothersName: motherName.trim(),
      note: note.trim(),
      addedAt: Date.now(),
    };
    setList((l) => [entry, ...l]);
    setSelected((s) => new Set([...s, entry.id]));
    setName('');
    setMotherName('');
    setNote('');
  }

  function remove(id: string) {
    const doRemove = () => {
      setList((l) => l.filter((c) => c.id !== id));
      setSelected((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    };
    if (Platform.OS === 'web' && typeof (window as any).confirm === 'function') {
      if ((window as any).confirm('להסיר מהרשימה?')) doRemove();
      return;
    }
    Alert.alert('הסרה', 'להסיר מהרשימה?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'הסר', style: 'destructive', onPress: doRemove },
    ]);
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  // Select all by default when list changes
  React.useEffect(() => {
    if (list.length > 0 && selected.size === 0) {
      setSelected(new Set(list.map((c) => c.id)));
    }
  }, [list.length]);

  const selectedNames = list.filter((c) => selected.has(c.id));
  const miSheberach = buildMiSheberach(selectedNames);
  const refaeinu = buildRefaeinuInsertion(selectedNames);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="תפילה לחולים" subtitle="רשימה אישית + מי שברך + יהי רצון לרפאינו" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>הוסף חולה</Text>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שם החולה:</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} textAlign="right" />
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>שם האם:</Text>
            <TextInput value={motherName} onChangeText={setMotherName} style={styles.input} textAlign="right" />
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>הערה (אופציונלי):</Text>
            <TextInput value={note} onChangeText={setNote} style={styles.input} textAlign="right" />
            <View style={{ marginTop: spacing.md }}>
              <Button label="+ הוסף לרשימה" onPress={add} fullWidth />
            </View>
          </Card>

          {list.length > 0 ? (
            <>
              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  הרשימה ({selectedNames.length} / {list.length} נבחרו)
                </Text>
                <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md }]}>
                  לחיצה לבחירה / ביטול. רק שמות שנבחרו יופיעו בתפילות למטה.
                </Text>
                {list.map((c) => {
                  const isSel = selected.has(c.id);
                  return (
                    <View key={c.id} style={styles.cholehRow}>
                      <Pressable onPress={() => toggleSelect(c.id)} style={[styles.cb, isSel && styles.cbDone]}>
                        {isSel && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
                      </Pressable>
                      <Pressable onPress={() => toggleSelect(c.id)} style={{ flex: 1 }}>
                        <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                          {c.name} בן/בת {c.mothersName}
                        </Text>
                        {c.note ? (
                          <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                            {c.note}
                          </Text>
                        ) : null}
                      </Pressable>
                      <Pressable onPress={() => remove(c.id)} hitSlop={10}>
                        <Text style={{ color: colors.danger, fontSize: 20 }}>✕</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </Card>

              {selectedNames.length > 0 && (
                <>
                  <Card padding="xl">
                    <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: 4, textAlign: 'center' }]}>
                      מי שברך לחולים
                    </Text>
                    <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center' }]}>
                      לאמירה בקריאת התורה / במניין
                    </Text>
                    <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 32 }]}>{miSheberach}</Text>
                  </Card>

                  <Card variant="accent" padding="xl">
                    <Text style={[typography.h3, { color: colors.primaryDark, marginBottom: 4, textAlign: 'center' }]}>
                      תוספת לברכת רפאינו בעמידה
                    </Text>
                    <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85, textAlign: 'center', marginBottom: spacing.md }]}>
                      נוסף בברכת רפאינו (אחרי "רוֹפֵא חוֹלֵי עַמּוֹ יִשְׂרָאֵל", לפני "כִּי אֵל מֶלֶךְ")
                    </Text>
                    <Text style={[typography.sacred, { color: colors.primaryDark, lineHeight: 32 }]}>{refaeinu}</Text>
                  </Card>
                </>
              )}
            </>
          ) : (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <Text style={{ fontSize: 56 }}>🩹</Text>
                <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }]}>
                  הוסף שמות לרשימה כדי לראות את התפילות
                </Text>
              </View>
            </Card>
          )}
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
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  cholehRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
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
});
