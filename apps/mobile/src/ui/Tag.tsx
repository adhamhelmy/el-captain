import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export type TagKind = 'accent' | 'warn' | 'pending' | 'past' | 'solid';

/** Pill tag like the web's `.tag` variants. */
export function Tag({ kind = 'accent', label }: Readonly<{ kind?: TagKind; label: string }>) {
  const { colors } = useTheme();
  const look = {
    accent: { color: colors.accentText, backgroundColor: colors.accentTag },
    warn: { color: colors.warn, backgroundColor: colors.warnTint },
    pending: { color: colors.pending, backgroundColor: colors.pendingTint },
    past: { color: colors.text2, backgroundColor: colors.pastTint },
    solid: { color: colors.onAccent, backgroundColor: colors.accent },
  }[kind];
  return (
    <View style={[styles.tag, { backgroundColor: look.backgroundColor }]}>
      <Text variant="label" style={[styles.text, { color: look.color }]}>
        {label}
      </Text>
    </View>
  );
}

/** Group or private, coloured like the web's TypeTag. */
export const typeTagKind = (type: 'GROUP' | 'PRIVATE'): TagKind => (type === 'PRIVATE' ? 'warn' : 'accent');

const styles = StyleSheet.create({ tag: { borderRadius: 100, paddingHorizontal: 11, paddingVertical: 4 }, text: { fontSize: 12 } });
