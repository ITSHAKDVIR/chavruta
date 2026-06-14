import React, { useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native';
import { Icon, IconName } from './Icon';
import { Tool } from '../data/tools';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  tool: Tool | null;
  onClose: () => void;
  onOpen: (tool: Tool) => void;
};

/**
 * Pop-up sheet shown when an icon in the 3D cluster is tapped.
 * Centered card with: icon, title, description, gold "Open" button + Close.
 */
export function ToolDetailModal({ tool, onClose, onOpen }: Props) {
  const visible = !!tool;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      ]).start();
    } else {
      fade.setValue(0);
      scale.setValue(0.88);
    }
  }, [visible]);

  if (!tool) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity: fade }]}>
          <View style={styles.iconWrap}>
            {tool.iconName ? (
              <Icon name={tool.iconName as IconName} size={36} color={colors.primary} strokeWidth={1.8} />
            ) : (
              <Text style={styles.iconEmoji}>{tool.emoji}</Text>
            )}
          </View>

          <Text style={styles.title}>{tool.title}</Text>
          {tool.description ? (
            <Text style={styles.description}>{tool.description}</Text>
          ) : (
            <View style={{ height: spacing.md }} />
          )}

          <Pressable
            onPress={() => onOpen(tool)}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryBtnText}>פתח כלי</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.secondaryBtnText}>סגור</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,31,61,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#142850',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,164,55,0.4)',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 16,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(212,164,55,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212,164,55,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconEmoji: { fontSize: 36 },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...typography.bodyBold,
    color: '#0a1f3d',
    fontSize: 16,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 10,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
