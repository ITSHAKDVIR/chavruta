import { Platform, TextStyle } from 'react-native';

// Rubik font is loaded globally in app/_layout.tsx via expo-font.
// We declare the weight-specific font families here so typography presets
// can pick the right one without relying on `fontWeight` (which on Android
// requires multiple registered font files — what expo-font gives us).
//
// IMPORTANT: when using a weighted font family (e.g. 'Rubik-Bold'), we
// DO NOT also set fontWeight — on Android that combination can cause RN
// to look for a non-existent variant ("Rubik-Bold" + bold) and fall back
// to the system font. Only the `fontFamily` is set; the weight is baked in.
const hebrewFontFamily = 'Rubik-Regular';
const hebrewFontFamilyBold = 'Rubik-Bold';
const hebrewFontFamilyLight = 'Rubik-Light';
const hebrewFontFamilyMedium = 'Rubik-Medium';
const hebrewFontFamilySemiBold = 'Rubik-SemiBold';

const serifFontFamily = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: 'serif',
});

// Monospaced figures for time displays — keeps digits aligned across rows.
const tabularNumFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const typography = {
  hebrewFontFamily,
  serifFontFamily,

  // Display: huge, light-weight, used for hero numbers / dates.
  display: {
    fontFamily: hebrewFontFamilyLight,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  displaySerif: {
    fontFamily: serifFontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  h1: {
    fontFamily: hebrewFontFamilyBold,
    fontSize: 26,
    lineHeight: 34,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  // h1 in the light-weight variant for premium hero titles.
  h1Light: {
    fontFamily: hebrewFontFamilyLight,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  h2: {
    fontFamily: hebrewFontFamilyBold,
    fontSize: 20,
    lineHeight: 28,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  h3: {
    fontFamily: hebrewFontFamilySemiBold,
    fontSize: 17,
    lineHeight: 24,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  body: {
    fontFamily: hebrewFontFamily,
    fontSize: 16,
    lineHeight: 24,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  bodyBold: {
    fontFamily: hebrewFontFamilySemiBold,
    fontSize: 16,
    lineHeight: 24,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  small: {
    fontFamily: hebrewFontFamily,
    fontSize: 13,
    lineHeight: 18,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  caption: {
    fontFamily: hebrewFontFamilyMedium,
    fontSize: 11,
    lineHeight: 14,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  // Vocalized prayer text. Originally used the system serif font, but on
  // Android that's Noto Serif which renders some nikud combinations wrong
  // (segol can appear as kamatz). Rubik-Regular handles the full Hebrew
  // nikud range correctly.
  sacred: {
    fontFamily: hebrewFontFamily,
    fontSize: 19,
    fontWeight: '500',
    lineHeight: 32,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,

  // Time displays — tabular figures so hh:mm columns align across rows.
  timeBig: {
    fontFamily: tabularNumFamily,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: -0.5,
    writingDirection: 'ltr',  // numbers are LTR even in Hebrew layouts
    textAlign: 'left',
  } as TextStyle,

  timeHero: {
    fontFamily: tabularNumFamily,
    fontSize: 28,
    fontWeight: '200',
    letterSpacing: -1,
    writingDirection: 'ltr',
    textAlign: 'left',
  } as TextStyle,

  // Tiny all-caps eyebrow above a section title.
  eyebrow: {
    fontFamily: hebrewFontFamilyBold,
    fontSize: 11,
    letterSpacing: 3,
    lineHeight: 14,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as TextStyle,
};
