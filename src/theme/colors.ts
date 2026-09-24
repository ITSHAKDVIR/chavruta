/**
 * חברותא theme — "deep navy + gold" direction (dark) with a warm ivory light
 * variant for daytime reading.
 *
 * Design principles (dark, the default):
 *  - One dominant color family (navy/blue) rather than rainbow accents
 *  - Single warm accent (#d4a437 gold) for highlights and CTAs
 *  - Glass / frosted surfaces over the navy gradient
 *  - Light text on dark backgrounds (legible)
 *
 * Light mode keeps the SAME gold accents (so the brand still reads as חברותא)
 * on a warm ivory background — parchment-inspired, easier on the eyes at
 * daytime and outdoors. Bookmarks the same shape/spacing.
 *
 * NOTE: The keys (`primary`, `bg`, etc.) match the prior brown-theme palette so
 * existing screens import the same names and only the values change. New
 * additions get fresh keys (gradients, glass*, glow*).
 *
 * `colors` is a MUTABLE reference: `applyTheme('light' | 'dark')` swaps every
 * property in place so all screens (which read `colors.X` inline in JSX) pick
 * up the new palette on the next render. The wrapping root layout swaps a key
 * to force a full remount so cached style arrays are rebuilt.
 */
export type ThemePalette = {
  bg: string; bgMid: string; bgLight: string;
  surface: string; surfaceAlt: string; surfaceSolid: string; border: string;
  textPrimary: string; textSecondary: string; textMuted: string; textInverse: string;
  primary: string; primaryDark: string; primaryLight: string; accent: string; accentDark: string;
  success: string; warning: string; danger: string; info: string;
  gradientStart: string; gradientEnd: string;
  gradientGold: string[]; gradientNavy: string[]; gradientNavyHero: string[];
  glass: string; glassStrong: string; glassFeatured: string;
  glassBorder: string; glassBorderGold: string;
  shadow: string; shadowGold: string; glowGold: string; glowNavy: string;
};

const DARK_PALETTE: ThemePalette = {
  // App surfaces
  bg: '#0a1f3d',
  bgMid: '#1e3a5f',
  bgLight: '#2c5282',
  surface: 'rgba(255,255,255,0.08)',
  surfaceAlt: 'rgba(255,255,255,0.04)',
  surfaceSolid: '#0f274d',
  border: 'rgba(255,255,255,0.12)',
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.78)',
  textMuted: 'rgba(255,255,255,0.55)',
  textInverse: '#FFFFFF',
  // Brand
  primary: '#d4a437',
  primaryDark: '#e6c068',
  primaryLight: '#f0c75e',
  accent: '#d4a437',
  accentDark: '#e6c068',
  // Status
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  info: '#60a5fa',
  // Gradients
  gradientStart: '#0a1f3d',
  gradientEnd: '#2c5282',
  gradientGold: ['#f0c75e', '#d4a437', '#b8862a'],
  gradientNavy: ['#0a1f3d', '#1e3a5f', '#2c5282'],
  gradientNavyHero: ['#0a1f3d', '#2c5282'],
  // Glass
  glass: 'rgba(255,255,255,0.08)',
  glassStrong: 'rgba(255,255,255,0.14)',
  glassFeatured: 'rgba(212,164,55,0.12)',
  glassBorder: 'rgba(255,255,255,0.15)',
  glassBorderGold: 'rgba(212,164,55,0.4)',
  // Effects
  shadow: 'rgba(0,0,0,0.4)',
  shadowGold: 'rgba(212,164,55,0.25)',
  glowGold: 'rgba(212,164,55,0.3)',
  glowNavy: 'rgba(30,58,138,0.4)',
};

const LIGHT_PALETTE: ThemePalette = {
  // App surfaces — warm ivory/parchment
  bg: '#faf6ec',
  bgMid: '#f4ecd8',
  bgLight: '#efe4c4',
  surface: 'rgba(255,255,255,0.85)',
  surfaceAlt: 'rgba(255,255,255,0.55)',
  surfaceSolid: '#ffffff',
  border: 'rgba(11,31,61,0.14)',
  // Text — navy on ivory for strong contrast
  textPrimary: '#0a1f3d',
  textSecondary: 'rgba(10,31,61,0.75)',
  textMuted: 'rgba(10,31,61,0.5)',
  textInverse: '#ffffff',
  // Brand — slightly deeper gold for readable text on light backgrounds
  primary: '#a67c15',
  primaryDark: '#8a6210',
  primaryLight: '#c69726',
  accent: '#a67c15',
  accentDark: '#8a6210',
  // Status — same hues but a touch darker so they show on ivory
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',
  // Gradients
  gradientStart: '#faf6ec',
  gradientEnd: '#e8ddc0',
  gradientGold: ['#c69726', '#a67c15', '#8a6210'],
  gradientNavy: ['#faf6ec', '#f4ecd8', '#e8ddc0'],
  gradientNavyHero: ['#faf6ec', '#e8ddc0'],
  // Glass — warm translucent overlay on ivory
  glass: 'rgba(255,255,255,0.6)',
  glassStrong: 'rgba(255,255,255,0.85)',
  glassFeatured: 'rgba(166,124,21,0.14)',
  glassBorder: 'rgba(10,31,61,0.14)',
  glassBorderGold: 'rgba(166,124,21,0.4)',
  // Effects
  shadow: 'rgba(10,31,61,0.12)',
  shadowGold: 'rgba(166,124,21,0.18)',
  glowGold: 'rgba(166,124,21,0.22)',
  glowNavy: 'rgba(10,31,61,0.12)',
};

/** The live palette. Screens `import { colors } from ...` and read `colors.X`
 *  at render time — so mutating this object swaps the theme app-wide once the
 *  root triggers a remount. Starts on dark to match the shipped default. */
export const colors: ThemePalette = { ...DARK_PALETTE };

/** Overwrite every property of `colors` in place with the target palette.
 *  Call once at boot (from _layout, before mounting screens) and again when
 *  the user toggles the theme (then remount the tree via a root key). */
export function applyTheme(mode: 'dark' | 'light'): void {
  const src = mode === 'light' ? LIGHT_PALETTE : DARK_PALETTE;
  for (const k of Object.keys(src) as Array<keyof ThemePalette>) {
    (colors as any)[k] = (src as any)[k];
  }
}

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * Reusable shadow presets matching the navy+gold theme.
 * Apply with `...shadows.card` on a View style.
 */
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  featured: {
    shadowColor: '#d4a437',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
};
