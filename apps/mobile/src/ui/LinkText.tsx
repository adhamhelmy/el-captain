import { Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

/** Accent-coloured tappable text, for links like "Forgot password?" or "← Back to log in". */
export function LinkText({ label, onPress, muted }: Readonly<{ label: string; onPress: () => void; muted?: boolean }>) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8}>
      <Text variant="label" style={{ color: muted ? colors.text2 : colors.accentText }}>
        {label}
      </Text>
    </Pressable>
  );
}
