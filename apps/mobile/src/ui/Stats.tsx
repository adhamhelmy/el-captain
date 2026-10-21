import { StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Text } from './Text';

/** The web's Stats row: big numbers (with an optional small unit on the same row, like the web's <small>EGP</small>) and a label under each. */
/** `oneLineLabels` keeps each label to a single row, shrinking it a little to fit, for short labels in narrow boxes. */
export function Stats({ items, oneLineLabels }: Readonly<{ items: [number | string, string, string?][]; oneLineLabels?: boolean }>) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <View style={styles.row}>
      {items.map(([value, label, unit]) => (
        <View key={label} style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/*
            One line, shrunk to fit: a big figure like 36,600 must not break between its digits, nor push its unit to a
            second row. The unit is nested in the figure's text, not beside it in a row, so the figure keeps the box's
            full width; side by side in a row, shrink-to-fit squeezed it to nothing.
          */}
          <Text variant="display" style={[styles.value, isRTL && styles.valueArabic]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
            {value}
            {unit && <Text variant="label" style={styles.unit}>{` ${unit}`}</Text>}
          </Text>
          <Text variant="label" {...(oneLineLabels && { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: 0.75 })}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  // Labels sit on the box's bottom edge, so they line up across the row even when a figure with a unit is a little shorter.
  stat: { flex: 1, justifyContent: 'space-between', borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 4 },
  // No fixed line height: iOS shrink-to-fit also fits the height, and a line shorter than the font's own shrank the figure to a speck.
  value: { fontSize: 34, lineHeight: undefined },
  unit: { letterSpacing: 0 },
  // Arabic's font needs more room above its letters than 36pt; one line is clipped at its line height.
  valueArabic: { lineHeight: 56 },
});
