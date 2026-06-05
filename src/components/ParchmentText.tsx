/**
 * ParchmentText — warm parchment-tone container for actual prayer / Torah text.
 *
 * The app shell is navy + gold (modern). When reading sacred text we switch
 * the surface to a cream/parchment background with dark serif type — feels
 * like opening a real sefer in the middle of the app. Used by Siddur,
 * Tehillim, Mishnayos, Kever, Refuah, etc.
 */
import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  /** Optional section name displayed centered at the top (e.g. "ברכות השחר") */
  sectionName?: string;
  /** Optional small italic instruction below the section name */
  instruction?: string;
  /** Main prayer text. Can include line breaks (\n\n for paragraphs) */
  children: React.ReactNode;
  /** Extra style for outer wrapper */
  style?: ViewStyle;
  /** Overrides the text font-size (default 18) */
  textSize?: number;
};

export function ParchmentText({ sectionName, instruction, children, style, textSize = 18 }: Props) {
  return (
    <View style={[styles.parchment, style]}>
      {/* Decorative top ornament — small but signals "sacred text" */}
      <Text style={styles.ornament}>✦</Text>

      {sectionName && (
        <Text style={styles.sectionName}>{sectionName}</Text>
      )}
      {instruction && (
        <Text style={styles.instruction}>{instruction}</Text>
      )}

      {typeof children === 'string' ? (
        <Text style={[styles.body, { fontSize: textSize, lineHeight: textSize * 1.85 }]}>
          {children}
        </Text>
      ) : (
        // Allow callers to pass arbitrary nested JSX (e.g. with <Text> highlights)
        <View>{children}</View>
      )}
    </View>
  );
}

/**
 * Inline highlight inside ParchmentText — use for opening words or names of God.
 */
export function ParchmentHighlight({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.highlight, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  parchment: {
    backgroundColor: '#f5ecd0',  // cream/sand
    borderRadius: radius.lg,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(180,140,80,0.45)',
    // Drop shadow + inset glow so it looks like a slightly raised piece of
    // parchment on the dark navy surface
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  ornament: {
    position: 'absolute',
    top: 8,
    left: 0, right: 0,
    textAlign: 'center',
    color: '#a37f38',
    fontSize: 12,
  },
  sectionName: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#5c2a05',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180,140,80,0.45)',
    letterSpacing: 0.5,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
    color: '#a37f38',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  body: {
    color: '#2c1810',
    textAlign: 'right',
    // serif Hebrew falls back to David / Times / system serif
    fontFamily: 'serif',
    writingDirection: 'rtl',
  },
  highlight: {
    color: '#5c2a05',
    fontWeight: '700',
  },
});
