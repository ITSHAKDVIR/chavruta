import React, { useEffect, useMemo } from 'react';
import { AppState, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

const ICON_SIZE = 50;
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
  // Larger sphere — fills more of the area. Was 0.38, now 0.46.
  const radius = useMemo(() => Math.min(SCREEN_W, height) * 0.46, [height]);
  const positions = useMemo(() => fibonacciSphere(TOOLS.length, radius), [radius]);
  const centerX = SCREEN_W / 2;
  const centerY = height / 2;

  // Accumulated rotation: yaw around Y axis, pitch around X axis.
  // Both can be advanced by auto-spin (yaw only) and finger drag (both).
  const yaw = useSharedValue(0);
  const pitch = useSharedValue(0.15); // small tilt so cluster reads as 3D from frame 1
  const dragging = useSharedValue(false);
  const paused = useSharedValue(false);

  // ── UI-thread tick: advance yaw every frame, unless paused or dragging ──
  useFrameCallback((info) => {
    'worklet';
    if (paused.value || dragging.value) return;
    const dt = (info.timeSincePreviousFrame ?? 16) / 1000;
    // 30 s per full rotation → 0.2094 rad/s
    yaw.value = yaw.value + dt * 0.2094;
  });

  // ── Pause spin when the app is backgrounded ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      paused.value = state !== 'active';
    });
    return () => sub.remove();
  }, []);

  // ── Pan gesture: finger drag rotates the cluster manually ──
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(4)
        .onStart(() => {
          'worklet';
          dragging.value = true;
        })
        .onChange((e) => {
          'worklet';
          yaw.value = yaw.value + e.changeX * 0.012;
          pitch.value = Math.max(-1.2, Math.min(1.2, pitch.value + e.changeY * 0.012));
        })
        .onEnd(() => {
          'worklet';
          dragging.value = false;
        }),
    [],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.container, { width: SCREEN_W, height }]} pointerEvents="box-none">
        {TOOLS.map((tool, i) => (
          <IconBubble
            key={tool.id}
            tool={tool}
            base={positions[i]}
            radius={radius}
            centerX={centerX}
            centerY={centerY}
            yaw={yaw}
            pitch={pitch}
            onTap={() => onPick(tool)}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

type BubbleProps = {
  tool: Tool;
  base: Vec3;
  radius: number;
  centerX: number;
  centerY: number;
  yaw: SharedValue<number>;
  pitch: SharedValue<number>;
  onTap: () => void;
};

function IconBubble({ tool, base, radius, centerX, centerY, yaw, pitch, onTap }: BubbleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const y_ = yaw.value;
    const p_ = pitch.value;

    // Rotate (base.x, base.y, base.z) around Y axis by yaw, then X axis by pitch.
    const cosY = Math.cos(y_);
    const sinY = Math.sin(y_);
    const x1 = base.x * cosY + base.z * sinY;
    const z1 = -base.x * sinY + base.z * cosY;

    const cosX = Math.cos(p_);
    const sinX = Math.sin(p_);
    const y2 = base.y * cosX - z1 * sinX;
    const z2 = base.y * sinX + z1 * cosX;

    // Perspective projection.
    // z2 < 0 = closer to viewer (in front), z2 > 0 = further from viewer (behind).
    const z = CAM_Z + z2;
    const projScale = FOCAL / z;

    // Depth fade: FRONT icons (z2 < 0) are fully opaque + bigger.
    //             BACK icons (z2 > 0) are slightly faded + smaller.
    // depth01: 1.0 when fully in front, 0.0 when fully behind.
    const raw = (radius - z2) / (2 * radius);
    const depth01 = raw < 0 ? 0 : raw > 1 ? 1 : raw;
    const opacity = 0.55 + depth01 * 0.45; // 0.55 .. 1.0 (less harsh than before)
    const scale = Math.max(0.72, Math.min(1.15, projScale * 0.92));

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
      <Pressable onPress={onTap} hitSlop={4} style={styles.iconChip}>
        {tool.iconName ? (
          <Icon name={tool.iconName as IconName} size={26} color={colors.primary} strokeWidth={1.8} />
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
  // Solid navy chip (not glass) so the icons read crisp and the cluster
  // doesn't look like a cluttered haze.
  iconChip: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 13,
    backgroundColor: '#152a4d',
    borderWidth: 1,
    borderColor: 'rgba(212,164,55,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
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
            <Icon name={t.iconName as IconName} size={24} color={colors.primary} strokeWidth={1.8} />
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
    backgroundColor: '#152a4d',
    borderWidth: 1,
    borderColor: 'rgba(212,164,55,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
