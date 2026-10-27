import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

/** Toggle chip like the web's `.chip` / `.chip.on`. */
export function Chip({ label, on, onPress }: Readonly<{ label: string; on: boolean; onPress: () => void }>) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[styles.chip, { borderColor: on ? colors.accentText : colors.border, backgroundColor: on ? colors.accentTag : colors.surface2 }]}>
      <Text variant="label" style={{ color: on ? colors.accentText : colors.text2 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({ chip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, minHeight: 36, justifyContent: 'center' } });
