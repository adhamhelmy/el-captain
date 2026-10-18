import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

type Option<V extends string> = { value: V; label: string };

/** Segmented control like the web's `.seg`: one choice from a few. */
export function Segmented<V extends string>({ options, value, onChange, label }: { options: Option<V>[]; value: V; onChange: (v: V) => void; label: string }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.seg, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => !on && onChange(o.value)}
            style={[styles.item, on && { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="label" style={{ color: on ? colors.text : colors.text2 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, padding: 3, gap: 3 },
  item: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 8 },
});
