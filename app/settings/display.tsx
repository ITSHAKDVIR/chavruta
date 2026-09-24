/**
 * Display settings — theme (dark/light) + prayer text size.
 * Changes apply immediately: theme swap forces a full app remount via the root
 * key trick in _layout.tsx, and font-size is read at every render of the siddur.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { useAppPrefs, FONT_SCALE_STEPS, FONT_SCALE_LABELS } from '../../src/storage/appPrefs';

export default function DisplaySettings() {
  const router = useRouter();
  const [prefs, update] = useAppPrefs();

  // Theme switch: save + reload the JS bundle. Every module reruns and rebuilds
  // its StyleSheet.create blocks with the new palette — needed because those
  // blocks capture `colors.X` at module-load time and can't be swapped in place.
  // A reload is ~1s of splash and looks like a normal app reopen to the user.
  async function setTheme(mode: 'dark' | 'light'): Promise<void> {
    if (prefs.theme === mode) return;
    await update({ theme: mode });
    try {
      const Updates: any = await import('expo-updates');
      if (Updates.reloadAsync) await Updates.reloadAsync();
    } catch { /* dev/web: no-op */ }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ padding: spacing.lg }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="תצוגה" subtitle="עיצוב וגודל טקסט" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* Theme */}
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              עיצוב
            </Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              כהה — הרקע הכחול/זהב המקורי · בהיר — רקע קלף חם עם כתב כהה
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
              {(['dark', 'light'] as const).map((mode) => {
                const on = prefs.theme === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setTheme(mode)}
                    style={[styles.toggle, on && styles.toggleOn, { flex: 1 }]}
                  >
                    <Text style={[typography.body, { color: on ? colors.textInverse : colors.textPrimary, textAlign: 'center' }]}>
                      {mode === 'dark' ? '🌙 כהה' : '☀ בהיר'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Font scale */}
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              גודל טקסט התפילה
            </Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              משפיע על כל טקסטי התפילה בסידור. אפשר גם ללחוץ על "אא" בסרגל העליון של הסידור.
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
              {FONT_SCALE_STEPS.map((s) => {
                const on = prefs.fontScale === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => update({ fontScale: s })}
                    style={[styles.toggle, on && styles.toggleOn, { flexGrow: 1, flexBasis: 70, minWidth: 70 }]}
                  >
                    <Text style={[typography.body, { color: on ? colors.textInverse : colors.textPrimary, textAlign: 'center' }]}>
                      {FONT_SCALE_LABELS[s] ?? `${Math.round(s * 100)}%`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {/* Live preview so the user sees the size before leaving the screen. */}
            <View style={{ marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md }}>
              <Text
                style={{
                  fontFamily: 'FrankRuhlLibre-Medium',
                  color: colors.textPrimary,
                  textAlign: 'right',
                  writingDirection: 'rtl',
                  fontSize: Math.round(21 * prefs.fontScale),
                  lineHeight: Math.round(34 * prefs.fontScale),
                }}
              >
                בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
