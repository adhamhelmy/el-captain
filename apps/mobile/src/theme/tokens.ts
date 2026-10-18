/** The web's design tokens (apps/web/app/globals.css), dark first, as React Native values. */
const dark = {
  bg: '#131417',
  surface: '#1c1e23',
  surface2: '#25272e',
  border: '#33353c',
  text: '#f4f5f0',
  text2: '#93959f',
  text3: '#5c5e68',
  accent: '#d7ff3d',
  onAccent: '#0e1200',
  accentText: '#d7ff3d',
  accentTint: 'rgba(215, 255, 61, 0.12)',
  accentTag: 'rgba(215, 255, 61, 0.14)',
  focusBorder: '#d7ff3d',
  warn: '#ff5a36',
  warnTint: 'rgba(255, 90, 54, 0.14)',
  pending: '#ffc53d',
  pendingTint: 'rgba(255, 197, 61, 0.14)',
  pastTint: 'rgba(147, 149, 159, 0.14)',
  barBg: 'rgba(28, 30, 35, 0.92)',
  stripeA: '#25272e',
  stripeB: '#2b2d34',
};

export type Palette = typeof dark;

const light: Palette = {
  ...dark,
  bg: '#f6f6f2',
  surface: '#ffffff',
  surface2: '#eeeee8',
  border: '#dcddd5',
  text: '#131417',
  text2: '#5c5e68',
  text3: '#73757e',
  accentText: '#4d6b00',
  accentTint: '#eef6cf',
  accentTag: '#e9f5c4',
  focusBorder: '#4d6b00',
  warn: '#c2330f',
  warnTint: '#fde3db',
  pending: '#8a5a00',
  pendingTint: '#fbefcf',
  pastTint: '#ebebe5',
  barBg: 'rgba(255, 255, 255, 0.92)',
  stripeA: '#eeeee8',
  stripeB: '#e4e5dd',
};

export type Scheme = 'light' | 'dark';
export const colors: Record<Scheme, Palette> = { dark, light };

/** Font family names as loaded by the root layout (@expo-google-fonts). Arabic text uses Cairo for both. */
export const fonts = {
  display: 'BebasNeue_400Regular',
  ui: 'SpaceGrotesk_500Medium',
  uiRegular: 'SpaceGrotesk_400Regular',
  uiSemibold: 'SpaceGrotesk_600SemiBold',
  uiBold: 'SpaceGrotesk_700Bold',
  arabic: 'Cairo_500Medium',
  arabicBold: 'Cairo_700Bold',
};

export const radius = { pill: 100, card: 14, row: 12, input: 10 };

/** UI text font for the current language: Cairo in Arabic, which Space Grotesk doesn't cover. */
export function uiFont(rtl: boolean, weight: 'regular' | 'medium' | 'semibold' | 'bold' = 'regular') {
  if (rtl) return weight === 'semibold' || weight === 'bold' ? fonts.arabicBold : fonts.arabic;
  return { regular: fonts.uiRegular, medium: fonts.ui, semibold: fonts.uiSemibold, bold: fonts.uiBold }[weight];
}
