import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, shadows } from '../theme/colors';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /**
   * Visual variant.
   *  - 'default'   : glass surface on navy bg (most common)
   *  - 'featured'  : gold-tinted glass with gold border (for emphasis / Shabbat)
   *  - 'primary'   : solid gold background (legacy CTAs — text must use textInverse)
   *  - 'accent'    : alias of primary, kept for back-compat
   *  - 'outline'   : transparent with gold border
   *  - 'solid'     : opaque navy (use on screens where blur isn't available)
   */
  variant?: 'default' | 'featured' | 'primary' | 'accent' | 'outline' | 'solid';
  padding?: keyof typeof spacing | number;
};

export function Card({
  children,
  onPress,
  onLongPress,
  style,
  variant = 'default',
  padding = 'lg',
}: Props) {
  const pad = typeof padding === 'number' ? padding : spacing[padding];

  // Per user feedback: NO solid-gold-filled card backgrounds anywhere.
  // The old "primary" and "accent" variants used a solid gold background
  // with primary-dark text — illegible on most screens. We now route all
  // four glassy variants through GLASS surfaces with a gold border accent,
  // so call sites that pass variant="accent" / "primary" still get visual
  // emphasis without the gold blob. This is the single-place fix that
  // propagates to every screen.
  // Subtle 1px outline restored on user request. Drop shadow stays OFF
  // (it created the gold "inner frame glow" on Android), but a thin border
  // helps cards read as distinct surfaces on the gradient background.
  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.glass,
      borderColor: colors.glassBorder,
      borderWidth: 1,
    },
    featured: {
      backgroundColor: colors.glassFeatured,
      borderColor: colors.glassBorderGold,
      borderWidth: 1,
    },
    primary: {
      backgroundColor: colors.glassFeatured,
      borderColor: colors.glassBorderGold,
      borderWidth: 1,
    },
    accent: {
      backgroundColor: colors.glassFeatured,
      borderColor: colors.glassBorderGold,
      borderWidth: 1,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    solid: {
      backgroundColor: colors.surfaceSolid,
      borderColor: colors.glassBorder,
      borderWidth: 1,
    },
  };

  const cardStyle = [styles.card, variantStyles[variant], { padding: pad }, style];

  if (!onPress && !onLongPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={cardStyle}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    // Removed shadows.subtle (elevation: 2). On Android the elevation drop
    // shadow + translucent glass background combined to render as a darker
    // inner rectangle around the card content (visible as an "inner frame").
    // The glass surface alone is enough to distinguish cards.
  },
});
