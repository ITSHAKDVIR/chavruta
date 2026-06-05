import React, { useEffect } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRaashan } from '../hooks/useRaashan';
import { colors, radius } from '../theme/colors';

// expo-sensors imports lazily to avoid web bundling issues
type AccelData = { x: number; y: number; z: number };
type Sub = { remove: () => void };
type AccelLike = {
  isAvailableAsync: () => Promise<boolean>;
  setUpdateInterval: (ms: number) => void;
  addListener: (cb: (d: AccelData) => void) => Sub;
};

function loadAccelerometer(): AccelLike | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-sensors');
    return mod?.Accelerometer ?? null;
  } catch {
    return null;
  }
}

// Shake-detection: at rest, accelerometer reports ~1g due to gravity. We
// look at the *change* in magnitude between consecutive samples — a real
// shake produces a sharp delta of 0.4g+ within ~50ms. This is robust to
// device orientation and far more sensitive than absolute-magnitude checks.
const SHAKE_DELTA_THRESHOLD = 0.35;
const COOLDOWN_MS = 350;

/**
 * A floating "noise-maker" button that hovers over the screen so the user can
 * fire the raashan while keeping the Megillah text visible. Tap or shake.
 */
export function FloatingRaashan() {
  const { fire, prefs, playing, startLoop, stopLoop } = useRaashan();
  const scale = React.useRef(new Animated.Value(1)).current;
  const lastTriggerRef = React.useRef(0);
  const lastMagRef = React.useRef<number | null>(null);

  useEffect(() => {
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
        const s = Accel.addListener((d) => {
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
  }, [prefs.shakeEnabled, fire]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: playing ? 1.15 : 1, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [playing, scale]);

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPressIn={() => startLoop()}
          onPressOut={() => stopLoop()}
          hitSlop={20}
          style={[styles.btn, playing && styles.btnActive]}
          accessibilityLabel="הפעל רעשן"
        >
          <Text style={styles.emoji}>🪅</Text>
          <Text style={styles.counter}>{prefs.count}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    zIndex: 100,
    elevation: 10,
  },
  btn: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  btnActive: {
    backgroundColor: colors.accent,
  },
  emoji: { fontSize: 32 },
  counter: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
    marginTop: -2,
  },
});
