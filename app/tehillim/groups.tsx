import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { createGroup, viewUrl } from '../../src/services/tehillimGroups';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/tehillim-group-state';

type GroupState = {
  myName: string;
  totalParticipants: number;
  myPosition: number;
};

const DEFAULT: GroupState = { myName: '', totalParticipants: 10, myPosition: 1 };

function chaptersFor(position: number, total: number): number[] {
  const perPerson = Math.ceil(150 / total);
  const start = (position - 1) * perPerson + 1;
  const end = Math.min(start + perPerson - 1, 150);
  const result: number[] = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}

export default function TehillimGroupScreen() {
  const router = useRouter();
  const [state, setState] = useStoredJSON<GroupState>(KEY, DEFAULT);
  const [purpose, setPurpose] = useState('');

  const myChapters = chaptersFor(state.myPosition, state.totalParticipants);

  function shareViaWhatsApp() {
    if (!state.myName.trim()) {
      Alert.alert('שגיאה', 'נא הזן את שמך');
      return;
    }
    const chaptersText = myChapters.map(hebrewNumeral).join(', ');
    const lines = [
      purpose.trim() ? `📿 תהילים לעילוי / רפואת / זכות: ${purpose.trim()}` : '📿 חלוקת תהילים',
      '',
      `אני (${state.myName}) קורא פרקים: ${chaptersText}`,
      `(מיקום ${state.myPosition} מתוך ${state.totalParticipants})`,
      '',
      'מי לוקח את שאר הפרקים? כתבו פה.',
    ];
    const text = encodeURIComponent(lines.join('\n'));
    Linking.openURL(`https://wa.me/?text=${text}`);
  }

  function copyMyAssignment() {
    const chaptersText = myChapters.map(hebrewNumeral).join(', ');
    const msg = `${state.myName || '(בלי שם)'} - פרקים: ${chaptersText}`;
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard) {
      (navigator as any).clipboard.writeText(msg);
      Alert.alert('הועתק', msg);
    } else {
      Alert.alert('הקצאה שלי', msg);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }} extraOffset={20}>
        <ScreenHeader title="תהילים בקבוצה" subtitle="חלוקה חיה דרך שרת או WhatsApp" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>

          {/* Live group section (server-backed). User creates a group on
              kosharot.co.il/BIMD/tehillim-groups.php, gets a link, shares it,
              and everyone with the link picks perakim in real time. */}
          <Card variant="primary">
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              📡 קבוצת חלוקה חיה (חדש)
            </Text>
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, marginTop: 4 }]}>
              צור קבוצה — קבל קישור לשתף בקבוצת ווצאפ. כל מי שילחץ יוכל לתפוס פרקים בזמן אמת, גם בלי האפליקציה.
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <Button
                label="צור קבוצת חלוקה חיה"
                onPress={async () => {
                  if (!state.myName.trim()) {
                    Alert.alert('שגיאה', 'הזן את שמך תחילה');
                    return;
                  }
                  try {
                    const { id, link } = await createGroup(
                      state.myName,
                      purpose.trim() || '',
                    );
                    const msg =
                      `📿 תהילים בקבוצה — ${state.myName}\n` +
                      (purpose.trim() ? `${purpose.trim()}\n\n` : '\n') +
                      `הקישור לתפיסת פרקים:\n${link}`;
                    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
                  } catch (e: any) {
                    Alert.alert('שגיאה ביצירת הקבוצה', e.message || 'נסה שוב');
                  }
                }}
                variant="primary"
                fullWidth
              />
            </View>
          </Card>

          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
              <Text style={{ fontWeight: '700' }}>איך זה עובד:</Text>{'\n'}
              1. תאמו עם הקבוצה כמה משתתפים יש (לדוגמא 10).{'\n'}
              2. כל אחד מקבל מיקום (1, 2, 3...) — אפשר לתאם בקבוצת WhatsApp.{'\n'}
              3. האפליקציה מחשבת אוטומטית באיזה פרקים אתה אחראי.{'\n'}
              4. שולחים את ההקצאה לקבוצת WhatsApp.{'\n\n'}
              <Text style={{ fontWeight: '700' }}>ללא שרת או הרשמה</Text> — הכל מתואם דרך WhatsApp.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: 4 }]}>שמך:</Text>
            <TextInput
              value={state.myName}
              onChangeText={(v) => setState((s) => ({ ...s, myName: v }))}
              placeholder="שם"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              textAlign="right"
            />

            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: 4 }]}>
              כמה משתתפים בקבוצה?
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
              {[5, 10, 15, 20, 30, 50, 75, 150].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setState((s) => ({ ...s, totalParticipants: n, myPosition: Math.min(s.myPosition, n) }))}
                  style={[styles.numBtn, state.totalParticipants === n && styles.numBtnActive]}
                >
                  <Text style={[typography.body, { color: state.totalParticipants === n ? colors.textInverse : colors.textPrimary }]}>
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: 4 }]}>
              באיזה מיקום אתה? (1-{state.totalParticipants})
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
              <Pressable
                onPress={() => setState((s) => ({ ...s, myPosition: Math.max(1, s.myPosition - 1) }))}
                style={styles.stepBtn}
              >
                <Text style={[typography.h2, { color: colors.primary }]}>−</Text>
              </Pressable>
              <View style={styles.stepValue}>
                <Text style={[typography.h2, { color: colors.textPrimary }]}>{state.myPosition}</Text>
              </View>
              <Pressable
                onPress={() => setState((s) => ({ ...s, myPosition: Math.min(s.totalParticipants, s.myPosition + 1) }))}
                style={styles.stepBtn}
              >
                <Text style={[typography.h2, { color: colors.primary }]}>+</Text>
              </Pressable>
            </View>
          </Card>

          <Card variant="primary">
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>הפרקים שלך</Text>
            <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 4 }]}>
              {myChapters.length === 1
                ? `פרק ${hebrewNumeral(myChapters[0])}`
                : `${hebrewNumeral(myChapters[0])} - ${hebrewNumeral(myChapters[myChapters.length - 1])}`}
            </Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              {myChapters.length} פרקים
            </Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: spacing.md }}>
              {myChapters.slice(0, 20).map((n) => (
                <Pressable key={n} onPress={() => router.push(`/tehillim/${n}` as any)} style={styles.chapPill}>
                  <Text style={[typography.caption, { color: colors.primaryDark, fontWeight: '700' }]}>{hebrewNumeral(n)}</Text>
                </Pressable>
              ))}
              {myChapters.length > 20 && (
                <View style={styles.chapPill}>
                  <Text style={[typography.caption, { color: colors.primaryDark, fontWeight: '700' }]}>+{myChapters.length - 20}</Text>
                </View>
              )}
            </View>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: 4 }]}>מטרת התהילים (אופציונלי):</Text>
            <TextInput
              value={purpose}
              onChangeText={setPurpose}
              placeholder="לדוגמא: רפואת... / לעילוי נשמת... / זכות..."
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              textAlign="right"
            />
          </Card>

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button
              label="💬 שתף ב-WhatsApp"
              onPress={shareViaWhatsApp}
              variant="primary"
              style={{ flexGrow: 1, minWidth: 160 }}
            />
            <Button
              label="📋 העתק הקצאה"
              onPress={copyMyAssignment}
              variant="secondary"
              style={{ flexGrow: 1, minWidth: 160 }}
            />
          </View>
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  numBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minWidth: 56,
    alignItems: 'center',
  },
  numBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  stepBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    flex: 1,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.full,
    minWidth: 36,
    alignItems: 'center',
  },
});
