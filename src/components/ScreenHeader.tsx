import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[typography.h1, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});
