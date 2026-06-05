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

const KRA_SATAN = 'קרעשטן';

function normalizeLetters(name: string): string[] {
  return nameToLetters(name);
}

export default function RefuahAcrosticScreen() {
  const router = useRouter();
  const [patientName, setPatientName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [showResult, setShowResult] = useState(false);

  const lettersFromName = useMemo(() => normalizeLetters(patientName), [patientName]);
  const lettersFromMother = useMemo(() => normalizeLetters(motherName), [motherName]);
  const lettersFromKra = useMemo(() => KRA_SATAN.split(''), []);

  const allLetters = [...lettersFromName, ...lettersFromMother, ...lettersFromKra];

  function generate() {
    if (!patientName.trim()) return;
    setShowResult(true);
  }

  function shareResult() {
    const sections = allLetters.map((ל) => {
      const range = PSALM_119_RANGES[ל];
      if (!range) return null;
      return `${ל}: תהילים קי״ט פסוקים ${range.from}-${range.to}`;
    }).filter(Boolean);
    const text = `🙏 תהילים לרפואת ${patientName}${motherName ? ` בן/בת ${motherName}` : ''}\n\n${sections.join('\n')}\n\n(קרע שטן - בנוסף לאותיות השם)\n\nמתוך אפליקציית חברותא`;
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
        <ScreenHeader title="תהילים לרפואה לפי שם" subtitle="פרקי תהילים קי״ט לפי אותיות השם" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
              <Text style={{ fontWeight: '700' }}>מנהג ישראל:</Text> אומרים את פרקי תהילים קי״ט (פרק עם 22 חלקים לפי אותיות א-ת) לפי אותיות שם החולה ושם אמו, ובסוף את האותיות של "קרע שטן".
              כל "חלק" הוא 8 פסוקים.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              שם החולה
            </Text>
            <TextInput
              style={styles.input}
              value={patientName}
              onChangeText={(t) => {
                setPatientName(t);
                setShowResult(false);
              }}
              placeholder="לדוגמה: שרה"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm, marginBottom: spacing.xs }]}>
              שם האם (לא חובה)
            </Text>
            <TextInput
              style={styles.input}
              value={motherName}
              onChangeText={(t) => {
                setMotherName(t);
                setShowResult(false);
              }}
              placeholder="לדוגמה: רבקה"
              placeholderTextColor={colors.textMuted}
            />
          </Card>

          {patientName.trim() && !showResult && (
            <Button label="📖 חשב פרקים" onPress={generate} variant="primary" />
          )}

          {showResult && (
            <>
              <Card variant="primary">
                <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center' }]}>
                  🙏 לרפואת {patientName}
                  {motherName ? ` בן/בת ${motherName}` : ''}
                </Text>
                <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.85, textAlign: 'center', marginTop: 4 }]}>
                  {allLetters.length} חלקים · {allLetters.length * 8} פסוקים
                </Text>
              </Card>

              {lettersFromName.length > 0 && (
                <Card>
                  <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
                    📖 שם החולה ({lettersFromName.join('')})
                  </Text>
                  {lettersFromName.map((l, i) => {
                    const range = PSALM_119_RANGES[l];
                    const text = PSALM_119_BY_LETTER[l];
                    return (
                      <View key={i} style={styles.psalmBlock}>
                        <View style={styles.psalmHeader}>
                          <Text style={[typography.h2, { color: colors.primary }]}>{l}</Text>
                          <Text style={[typography.caption, { color: colors.textMuted, marginRight: spacing.sm }]}>
                            תהילים קי״ט · פסוקים {range.from}-{range.to}
                          </Text>
                        </View>
                        <Text style={styles.psalmText}>{text}</Text>
                      </View>
                    );
                  })}
                </Card>
              )}
              {lettersFromMother.length > 0 && (
                <Card>
                  <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
                    📖 שם האם ({lettersFromMother.join('')})
                  </Text>
                  {lettersFromMother.map((l, i) => {
                    const range = PSALM_119_RANGES[l];
                    const text = PSALM_119_BY_LETTER[l];
                    return (
                      <View key={i} style={styles.psalmBlock}>
                        <View style={styles.psalmHeader}>
                          <Text style={[typography.h2, { color: colors.primary }]}>{l}</Text>
                          <Text style={[typography.caption, { color: colors.textMuted, marginRight: spacing.sm }]}>
                            תהילים קי״ט · פסוקים {range.from}-{range.to}
                          </Text>
                        </View>
                        <Text style={styles.psalmText}>{text}</Text>
                      </View>
                    );
                  })}
                </Card>
              )}
              <Card>
                <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.sm }]}>
                  📖 קר"ע שט"ן
                </Text>
                {lettersFromKra.map((l, i) => {
                  const range = PSALM_119_RANGES[l];
                  const text = PSALM_119_BY_LETTER[l];
                  if (!range) return null;
                  return (
                    <View key={i} style={styles.psalmBlock}>
                      <View style={styles.psalmHeader}>
                        <Text style={[typography.h2, { color: colors.primary }]}>{l}</Text>
                        <Text style={[typography.caption, { color: colors.textMuted, marginRight: spacing.sm }]}>
                          תהילים קי״ט · פסוקים {range.from}-{range.to}
                        </Text>
                      </View>
                      <Text style={styles.psalmText}>{text}</Text>
                    </View>
                  );
                })}
              </Card>

              <Button label="📤 שתף ברשימה" onPress={shareResult} variant="primary" />
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
