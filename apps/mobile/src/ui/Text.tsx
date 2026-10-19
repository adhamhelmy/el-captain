import { Text as RNText, type TextProps } from 'react-native';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, uiFont } from '@/theme/tokens';

type Variant = 'display' | 'title' | 'body' | 'label' | 'eyebrow';
type Props = TextProps & { variant?: Variant; muted?: boolean };

/** Bebas Neue for display text, Space Grotesk for UI; Cairo for both in Arabic (neither has Arabic glyphs). */
export function Text({ variant = 'body', muted, style, ...rest }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const ar = isRTL;

  const base = {
    display: { fontFamily: ar ? fonts.arabicBold : fonts.display, fontSize: 48, lineHeight: 50, letterSpacing: ar ? 0 : 1, color: colors.text },
    title: { fontFamily: ar ? fonts.arabicBold : fonts.display, fontSize: 24, letterSpacing: ar ? 0 : 1, color: colors.text },
    body: { fontFamily: uiFont(ar), fontSize: 15, lineHeight: 24, color: colors.text },
    label: { fontFamily: uiFont(ar, 'medium'), fontSize: 13, color: colors.text2 },
    eyebrow: { fontFamily: uiFont(ar, 'semibold'), fontSize: 14, letterSpacing: ar ? 0 : 1.5, color: colors.accentText, textTransform: 'uppercase' as const },
  }[variant];

  return <RNText style={[base, muted && { color: colors.text2 }, style]} {...rest} />;
}
