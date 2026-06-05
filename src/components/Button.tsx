import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, fullWidth, style }: Props) {
  const variants: Record<string, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.textInverse, border: colors.primaryDark },
    secondary: { bg: colors.surfaceAlt, fg: colors.textPrimary, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.danger, fg: colors.textInverse, border: '#7C2920' },
  };
  const v = variants[variant];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      <Text style={[typography.bodyBold, { color: v.fg, textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
