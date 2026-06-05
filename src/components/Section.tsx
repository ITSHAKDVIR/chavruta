import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children?: ReactNode;
};

export function Section({ title, subtitle, actionLabel, onActionPress, children }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          {/* numberOfLines + adjustsFontSizeToFit so longer Hebrew titles like
              "זמני היום" don't truncate to "זמני" when an action link is shown
              next to them. */}
          <Text
            style={[typography.h2, styles.title]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {title}
          </Text>
          {subtitle ? <Text style={[typography.small, styles.subtitle]} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {actionLabel ? (
          <Pressable onPress={onActionPress} hitSlop={8} style={{ flexShrink: 0 }}>
            <Text style={[typography.bodyBold, styles.action]} numberOfLines={1}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  titleWrap: { flexShrink: 1, flexGrow: 1, minWidth: 0 },
  title: { color: colors.textPrimary },
  subtitle: { color: colors.textMuted, marginTop: 2 },
  action: { color: colors.primary, paddingTop: 4 },
});
