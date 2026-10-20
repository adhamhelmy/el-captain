import { StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Text } from './Text';

/** The web's Stats row: big numbers (with an optional small unit, like the web's <small>EGP</small>) and a label under each. */
export function Stats({ items }: Readonly<{ items: [number | string, string, string?][] }>) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <View style={styles.row}>
      {items.map(([value, label, unit]) => (
        <View key={label} style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.figure}>
            {/* One line, shrunk to fit: a big figure like 36,600 must not break between its digits on a small phone. */}
            <Text variant="display" style={[styles.value, isRTL && styles.valueArabic]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {value}
            </Text>
            {unit && <Text variant="label">{unit}</Text>}
          </View>
          <Text variant="label">{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 4 },
  figure: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 4 },
  value: { fontSize: 34, lineHeight: 36, flexShrink: 1 },
  // Arabic's font needs more room above its letters than 36pt; one line is clipped at its line height.
  valueArabic: { lineHeight: 56 },
});
