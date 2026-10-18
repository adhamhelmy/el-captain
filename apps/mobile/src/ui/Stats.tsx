import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Text } from './Text';

/** The web's Stats row: big numbers with a label under each. */
export function Stats({ items }: { items: [number | string, string][] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {items.map(([value, label]) => (
        <View key={label} style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="display" style={styles.value}>
            {value}
          </Text>
          <Text variant="label">{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 4 },
  value: { fontSize: 34, lineHeight: 36 },
});
