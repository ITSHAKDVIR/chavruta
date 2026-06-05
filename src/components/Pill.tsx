import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  label: string;
  tone?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  style?: ViewStyle;
};

/**
 * Glass-pill tokens tuned for the navy-on-glass theme:
 *  - default: subtle glass
 *  - primary: solid gold (for big "act on this" markers)
 *  - accent : gold-tinted glass with gold text (gentler highlight than primary)
 *  - status colors: glass tint + colored text + colored border
 */
const tones: Record<string, { bg: string; fg: string; border: string }> = {
  default: { bg: colors.glass, fg: colors.textPrimary, border: colors.glassBorder },
  primary: { bg: colors.primary, fg: colors.textInverse, border: colors.primaryDark },
  accent: { bg: colors.glassFeatured, fg: colors.primaryLight, border: colors.glassBorderGold },
  success: { bg: 'rgba(74,222,128,0.15)', fg: colors.success, border: 'rgba(74,222,128,0.5)' },
  warning: { bg: 'rgba(251,191,36,0.15)', fg: colors.warning, border: 'rgba(251,191,36,0.5)' },
  danger:  { bg: 'rgba(248,113,113,0.15)', fg: colors.danger,  border: 'rgba(248,113,113,0.5)' },
  info:    { bg: 'rgba(96,165,250,0.15)',  fg: colors.info,    border: 'rgba(96,165,250,0.5)' },
};

export function Pill({ label, tone = 'default', style }: Props) {
  const t = tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      <Text style={[typography.caption, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
