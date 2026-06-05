import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { Icon } from './Icon';

/**
 * Top bar shown on every primary tab.
 * Style: glass over the navy background with a gold-tinted wordmark in the
 * center, bell icon (notifications) on right, menu icon on left.
 */
export function BrandBar() {
  const router = useRouter();

  return (
    <View style={styles.bar}>
      <Pressable hitSlop={10} onPress={() => router.push('/app-menu')}>
        <View style={styles.iconCircle}>
          <Icon name="menu" size={18} color={colors.textPrimary} />
        </View>
      </Pressable>

      {/* SINGLE Text node — splitting Hebrew word across two Text components
          breaks letter joining/rendering on Android (caused "חבר ת" bug).
          Use inline nested Text for the gold accent. */}
      <Text style={styles.brandWord}>
        חברו<Text style={styles.brandAccent}>תא</Text>
      </Text>

      <Pressable hitSlop={10} onPress={() => router.push('/settings/notifications')}>
        <View style={styles.iconCircle}>
          <Icon name="bell" size={18} color={colors.textPrimary} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWord: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 20,
    // No letterSpacing — caused Hebrew letters to clip on Android.
  },
  brandAccent: {
    color: colors.primary, // gold accent on the trailing syllable
  },
});
