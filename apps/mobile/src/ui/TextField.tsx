import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useLocale } from '@/i18n/IntlProvider';
import { radius, uiFont } from '@/theme/tokens';
import { Text } from './Text';

/** `invalid` marks the field red without a message of its own, for a rule shown once under several fields. */
type Props = TextInputProps & { label: string; error?: string | null; hint?: string; invalid?: boolean; aside?: ReactNode };

/** Labelled input like the web's Field + `.input.on-page`. `hint` shows under it, replaced by `error` while that applies. */
export function TextField({ label, error, hint, invalid, aside, style, ...input }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [focused, setFocused] = useState(false);
  let borderColor = colors.border;
  if (error || invalid) borderColor = colors.warn;
  else if (focused) borderColor = colors.focusBorder;
  return (
    <View style={styles.field}>
      <View style={styles.head}>
        <Text variant="label">{label}</Text>
        {aside}
      </View>
      <TextInput
        placeholderTextColor={colors.text3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            fontFamily: uiFont(isRTL),
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor,
          },
          style,
        ]}
        {...input}
      />
      {!!error && <Text style={[styles.error, { color: colors.warn }]}>{error}</Text>}
      {!error && !!hint && <Text variant="label">{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { minHeight: 46, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: 14, fontSize: 15 },
  error: { fontSize: 13 },
});
