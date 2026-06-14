import React, { useEffect, useMemo } from 'react';
import { AppState, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import { Gyroscope } from 'expo-sensors';
import { TOOLS, Tool } from '../data/tools';
import { Icon, IconName } from './Icon';
import { colors } from '../theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');

type Props = {
  /** Height of the cluster area inside the home scroll. */
  height: number;
  /** Called when a user taps an icon. The host opens a detail modal. */
  onPick: (tool: Tool) => void;
};

const ICON_SIZE = 44;
const FOCAL = 500;
const CAM_Z = 700;

type Vec3 = { x: number; y: number; z: number };

/**
 * Distribute `count` points evenly on a sphere of `radius` using a
 * Fibonacci spiral. Gives the visually-balanced "icon cluster" look.
 */
function fibonacciSphere(count: number, radius: number): Vec3[] {
  const pts: Vec3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    pts.push({
      x: Math.cos(theta) * r * radius,
      y: y * radius,
      z: Math.sin(theta) * r * radius,
    });
  }
  return pts;
}

export function IconCluster({ height, onPick }: Props) {
  const radius = useMemo(() => Math.min(SCREEN_W, height) * 0.38, [height]);
  const positions = useMemo(() => fibonacciSphere(TOOLS.length, radius), [radius]);
  const centerX = SCREEN_W / 2;
  const centerY = height / 2;

  // Continuous rotation around the Y axis (yaw) — slow + steady.
  const spin = useSharedValue(0);
  // Pitch + extra yaw driven by the gyroscope, smoothed with springs.
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  // Pause when the app is in background or the prop changes (e.g. settings).
  const paused = useSharedValue(false);

  // ── UI-thread tick: advance the spin angle every frame ──
  useFrameCallback((info) => {
    'worklet';
    if (paused.value) return;
    const dt = (info.timeSincePreviousFrame ?? 16) / 1000;
    // 30 s per full rotation → 0.2094 rad/s
    spin.value = spin.value + dt * 0.2094;
  });

  // ── Gyroscope: tilt the whole cluster ──
  useEffect(() => {
    Gyroscope.setUpdateInterval(80);
    const sub = Gyroscope.addListener(({ x, y }) => {
      const cx = Math.max(-1, Math.min(1, x));
      const cy = Math.max(-1, Math.min(1, y));
      tiltX.value = withSpring(cx * 0.45, { damping: 14 });
      tiltY.value = withSpring(cy * 0.45, { damping: 14 });
    });
    return () => sub.remove();
  }, []);

  // ── Pause spin when the app is backgrounded ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      paused.value = state !== 'active';
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={[styles.container, { width: SCREEN_W, height }]} pointerEvents="box-none">
      {TOOLS.map((tool, i) => (
        <IconBubble
          key={tool.id}
          tool={tool}
          base={positions[i]}
          radius={radius}
          centerX={centerX}
          centerY={centerY}
          spin={spin}
          tiltX={tiltX}
          tiltY={tiltY}
          onTap={() => onPick(tool)}
        />
      ))}
    </View>
  );
}

type BubbleProps = {
  tool: Tool;
  base: Vec3;
  radius: number;
  centerX: number;
  centerY: number;
  spin: SharedValue<number>;
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
  onTap: () => void;
};

function IconBubble({ tool, base, radius, centerX, centerY, spin, tiltX, tiltY, onTap }: BubbleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const yaw = spin.value + tiltY.value;
    const pitch = tiltX.value;

    // Rotate (base.x, base.y, base.z) around Y axis by yaw, then X axis by pitch.
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const x1 = base.x * cosY + base.z * sinY;
    const z1 = -base.x * sinY + base.z * cosY;

    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);
    const y2 = base.y * cosX - z1 * sinX;
    const z2 = base.y * sinX + z1 * cosX;

    // Perspective project to 2D.
    const z = CAM_Z + z2;
    const projScale = FOCAL / z;

    // Depth fade: front icons sharp + bigger, back icons faded + smaller.
    const depth01 = (z2 + radius) / (2 * radius); // 0..1, clamped below
    const safe = depth01 < 0 ? 0 : depth01 > 1 ? 1 : depth01;
    const opacity = 0.35 + safe * 0.65;
    const scale = Math.max(0.5, Math.min(1.2, projScale * 0.95));

    return {
      transform: [
        { translateX: x1 * projScale },
        { translateY: y2 * projScale },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        { left: centerX - ICON_SIZE / 2, top: centerY - ICON_SIZE / 2 },
        animatedStyle,
      ]}
    >
      <Pressable onPress={onTap} hitSlop={6} style={styles.iconChip}>
        {tool.iconName ? (
          <Icon name={tool.iconName as IconName} size={22} color={colors.primary} strokeWidth={1.7} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  iconWrap: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconChip: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,164,55,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
});

/**
 * Simple grid fallback used on low-end devices or when the user disables
 * the cluster in settings.
 */
export function IconGrid({ onPick }: { onPick: (tool: Tool) => void }) {
  return (
    <View style={gridStyles.grid}>
      {TOOLS.map((t) => (
        <Pressable key={t.id} onPress={() => onPick(t)} style={gridStyles.tile}>
          {t.iconName ? (
            <Icon name={t.iconName as IconName} size={22} color={colors.primary} strokeWidth={1.7} />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,164,55,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
