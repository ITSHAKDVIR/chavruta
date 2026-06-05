import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { SOUND_OPTIONS, useRaashan, RaashanSound } from '../../src/hooks/useRaashan';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type AccelData = { x: number; y: number; z: number };
type Sub = { remove: () => void };

function loadAccelerometer(): any {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-sensors');
    return mod?.Accelerometer ?? null;
  } catch {
    return null;
  }
}

const SHAKE_DELTA_THRESHOLD = 0.35;
const COOLDOWN_MS = 350;

export default function RaashanScreen() {
  const router = useRouter();
  const { prefs, setPrefs, playing, fire, startLoop, stopLoop } = useRaashan();
  const lastTriggerRef = useRef(0);
  const lastMagRef = useRef<number | null>(null);

  // Shake detection — scoped to when this screen is FOCUSED.
  // useFocusEffect runs the cleanup function when the screen blurs (navigated away),
  // so the accelerometer listener never persists past leaving the raashan screen.
  // The mounted flag guards against the async-resolve-after-unmount race.
  useFocusEffect(
    useCallback(() => {
      if (!prefs.shakeEnabled) return;
      const Accel = loadAccelerometer();
      if (!Accel) return;
      let sub: Sub | null = null;
      let mounted = true;
      (async () => {
        try {
          const ok = await Accel.isAvailableAsync();
          if (!ok || !mounted) return;
          Accel.setUpdateInterval(50);
          const s = Accel.addListener((d: AccelData) => {
            const mag = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z);
            if (lastMagRef.current !== null) {
              const delta = Math.abs(mag - lastMagRef.current);
              if (delta > SHAKE_DELTA_THRESHOLD) {
                const now = Date.now();
                if (now - lastTriggerRef.current >= COOLDOWN_MS) {
                  lastTriggerRef.current = now;
                  fire();
                }
              }
            }
            lastMagRef.current = mag;
          });
          if (!mounted) {
            s.remove();
          } else {
            sub = s;
          }
        } catch {}
      })();
      return () => {
        mounted = false;
        sub?.remove();
        sub = null;
        lastMagRef.current = null;
      };
    }, [prefs.shakeEnabled, fire]),
  );

  function toggleVibration() {
    setPrefs((p) => ({ ...p, vibration: !p.vibration }));
  }
  function toggleShake() {
    setPrefs((p) => ({ ...p, shakeEnabled: !p.shakeEnabled }));
  }
  function pickSound(id: RaashanSound) {
    setPrefs((p) => ({ ...p, sound: id }));
    // Fire once so user can hear what they picked
    setTimeout(() => fire(), 50);
  }
  function reset() {
    setPrefs((p) => ({ ...p, count: 0 }));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScreenHeader title="רעשן" subtitle="הזיזו את המכשיר כמו רעשן - או הקישו" />

      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, flex: 1 }}>
        <Card variant="accent">
          <Text style={[typography.h2, { color: colors.primaryDark, textAlign: 'center' }]}>
            🎭 {prefs.count} פעמים
          </Text>
          <Text
            style={[
              typography.small,
              { color: colors.primaryDark, opacity: 0.85, textAlign: 'center', marginTop: 4 },
            ]}
          >
            מחיית עמלק
          </Text>
        </Card>

        <Pressable
          onPressIn={() => startLoop()}
          onPressOut={() => stopLoop()}
          style={[
            styles.bigBtn,
            playing && { transform: [{ scale: 0.95 }], backgroundColor: colors.accent },
          ]}
        >
          <Text style={{ fontSize: 64 }}>
            {SOUND_OPTIONS.find((o) => o.id === prefs.sound)?.emoji ?? '🪅'}
          </Text>
          <Text style={[typography.h1, { color: colors.textInverse }]}>
            {playing ? 'מרעיש...' : prefs.shakeEnabled ? 'לחיצה ארוכה / נענוע' : 'לחיצה ארוכה'}
          </Text>
          <Text style={[typography.small, { color: colors.textInverse, opacity: 0.85 }]}>
            כל עוד לוחצים — הרעש ממשיך
          </Text>
        </Pressable>

        <Card>
          <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            🔊 סוג הרעש
          </Text>
          <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
            {SOUND_OPTIONS.map((opt) => {
              const active = prefs.sound === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => pickSound(opt.id)}
                  style={[styles.soundChip, active && styles.soundChipActive]}
                >
                  <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: active ? colors.textInverse : colors.textPrimary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text
            style={[
              typography.caption,
              { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
            ]}
          >
            לחיצה על סוג רעש מנגנת אותו לדוגמה.
          </Text>
        </Card>

        <Card>
          <Pressable onPress={toggleShake} style={styles.toggleRow}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>📱 זיהוי תנועה (כמו רעשן)</Text>
            <Pill
              label={prefs.shakeEnabled ? 'פעיל' : 'כבוי'}
              tone={prefs.shakeEnabled ? 'success' : 'default'}
            />
          </Pressable>
          {Platform.OS === 'web' && (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
              זיהוי תנועה זמין רק במכשיר נייד
            </Text>
          )}
        </Card>

        <Card>
          <Pressable onPress={toggleVibration} style={styles.toggleRow}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>📳 רטט עם הצליל</Text>
            <Pill
              label={prefs.vibration ? 'פעיל' : 'כבוי'}
              tone={prefs.vibration ? 'success' : 'default'}
            />
          </Pressable>
        </Card>

        <Card variant="accent">
          <Text style={[typography.caption, { color: colors.primaryDark, fontStyle: 'italic' }]}>
            💡 אם הרעש לא נשמע - בדקו שעוצמת המדיה (לא הצלצול) במכשיר במקסימום.
          </Text>
        </Card>

        <Pressable onPress={reset}>
          <Text style={[typography.caption, { color: colors.danger, textAlign: 'center' }]}>
            איפוס מונה
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  bigBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soundChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  soundChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
});
