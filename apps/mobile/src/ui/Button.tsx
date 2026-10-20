import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useLocale } from '@/i18n/IntlProvider';
import { radius, uiFont } from '@/theme/tokens';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerOutline';
type Props = Readonly<{ label: string; onPress: () => void; variant?: Variant; busy?: boolean; icon?: LucideIcon }>;

/** Full-width button like the web's `.btn.block`. Busy shows a spinner and ignores taps; it is never silently disabled. */
export function Button({ label, onPress, variant = 'primary', busy, icon: Icon }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  // Fill, border and text per variant; dangerOutline is the web's `.btn-ghost.danger`.
  const look = {
    primary: { bg: colors.accent, border: colors.accent, fg: colors.onAccent },
    secondary: { bg: colors.surface, border: colors.border, fg: colors.text },
    danger: { bg: colors.warn, border: colors.warn, fg: '#ffffff' },
    dangerOutline: { bg: colors.surface, border: colors.warn, fg: colors.warn },
  }[variant];
  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      style={({ pressed }) => [styles.btn, { backgroundColor: look.bg, borderColor: look.border }, pressed && { opacity: 0.85 }]}>
      {busy ? (
        <ActivityIndicator color={look.fg} />
      ) : (
        <>
          {Icon && <Icon size={18} strokeWidth={2.2} color={look.fg} />}
          <Text style={[styles.label, { fontFamily: uiFont(isRTL, 'semibold'), color: look.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: radius.input,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: { fontSize: 15 },
});
