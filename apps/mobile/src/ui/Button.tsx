import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useLocale } from '@/i18n/IntlProvider';
import { radius, uiFont } from '@/theme/tokens';
import { Text } from './Text';

type Props = { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; busy?: boolean };

/** Full-width button like the web's `.btn.block`. Busy shows a spinner and ignores taps; it is never silently disabled. */
export function Button({ label, onPress, variant = 'primary', busy }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const primary = variant === 'primary';
  const danger = variant === 'danger';
  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      style={({ pressed }) => [
        styles.btn,
        primary && { backgroundColor: colors.accent },
        danger && { backgroundColor: colors.warn },
        !primary && !danger && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
        pressed && { opacity: 0.85 },
      ]}>
      {busy ? (
        <ActivityIndicator color={primary ? colors.onAccent : danger ? '#ffffff' : colors.text} />
      ) : (
        <Text style={[styles.label, { fontFamily: uiFont(isRTL, 'semibold'), color: primary ? colors.onAccent : danger ? '#ffffff' : colors.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  label: { fontSize: 15 },
});
