import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

/** Up to two initials, as the web's initialsOf. */
export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Initials in a circle like the web's <Avatar accent>. */
export function Avatar({ name, size = 64 }: Readonly<{ name: string; size?: number }>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentTint }]}>
      <Text variant="title" style={{ color: colors.accentText, fontSize: size * 0.4 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ circle: { alignItems: 'center', justifyContent: 'center' } });
