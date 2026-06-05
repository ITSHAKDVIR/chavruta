/**
 * חברותא theme — "deep navy + gold" direction.
 *
 * Design principles:
 *  - One dominant color family (navy/blue) rather than rainbow accents
 *  - Single warm accent (#d4a437 gold) for highlights and CTAs
 *  - Glass / frosted surfaces over the navy gradient
 *  - Light text on dark backgrounds (legible)
 *
 * NOTE: The keys (`primary`, `bg`, etc.) match the prior brown-theme palette so
 * existing screens import the same names and only the values change. New
 * additions get fresh keys (gradients, glass*, glow*).
 */
export const colors = {
  // ─── App surfaces ────────────────────────────────────────────────
  bg: '#0a1f3d',            // deepest navy — full-screen backgrounds
  bgMid: '#1e3a5f',         // mid stop for gradients
  bgLight: '#2c5282',       // lightest navy — top of gradient
  surface: 'rgba(255,255,255,0.08)',     // glass card primary
  surfaceAlt: 'rgba(255,255,255,0.04)',  // glass card secondary (sub-rows)
  surfaceSolid: '#0f274d',  // when blur isn't available (fallback)
  border: 'rgba(255,255,255,0.12)',

  // ─── Text ────────────────────────────────────────────────────────
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.78)',
  textMuted: 'rgba(255,255,255,0.55)',
  textInverse: '#0a1f3d',   // for use on gold backgrounds

  // ─── Brand ───────────────────────────────────────────────────────
  primary: '#d4a437',       // gold — primary CTA, highlights
  // primaryDark was #b8862a (dark gold designed for text on gold-fill cards).
  // Since we no longer use gold-fill backgrounds (per user feedback that
  // gold-on-gold is illegible), this token now denotes "emphasized gold
  // text on glass/navy surfaces" — brighter warm gold for legibility.
  primaryDark: '#e6c068',
  primaryLight: '#f0c75e',
  accent: '#d4a437',
  accentDark: '#e6c068',

  // ─── Status ──────────────────────────────────────────────────────
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  info: '#60a5fa',

  // ─── Gradients (use with expo-linear-gradient or CSS in web/HTML) ─
  gradientStart: '#0a1f3d',
  gradientEnd: '#2c5282',
  gradientGold: ['#f0c75e', '#d4a437', '#b8862a'],
  gradientNavy: ['#0a1f3d', '#1e3a5f', '#2c5282'],
  gradientNavyHero: ['#0a1f3d', '#2c5282'],

  // ─── Glass surfaces ──────────────────────────────────────────────
  glass: 'rgba(255,255,255,0.08)',
  glassStrong: 'rgba(255,255,255,0.14)',
  // Lower opacity so white/light text reads well on top — old 0.18 made the
  // surface too gold and washed out anything except dark text.
  glassFeatured: 'rgba(212,164,55,0.12)',  // gold-tinted glass for emphasis
  glassBorder: 'rgba(255,255,255,0.15)',
  glassBorderGold: 'rgba(212,164,55,0.4)',

  // ─── Effects ─────────────────────────────────────────────────────
  shadow: 'rgba(0,0,0,0.4)',
  shadowGold: 'rgba(212,164,55,0.25)',
  glowGold: 'rgba(212,164,55,0.3)',
  glowNavy: 'rgba(30,58,138,0.4)',
};

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
