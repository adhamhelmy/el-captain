import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Text } from './Text';

/**
 * The web's dashed `.empty` box. `rich` takes a message with a <link> part and turns it into tappable text.
 */
export function Empty({ text, link }: { text: (link: (chunks: React.ReactNode) => React.ReactNode) => React.ReactNode; link?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { borderColor: colors.border }]}>
      <Text variant="label" style={styles.center}>
        {text((chunks) => (
          <Text variant="label" style={{ color: colors.accentText }} onPress={link}>
            {chunks}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, padding: 24 },
  center: { textAlign: 'center' },
});
