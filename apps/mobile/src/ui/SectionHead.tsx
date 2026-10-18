import { StyleSheet, View } from 'react-native';
import { LinkText } from './LinkText';
import { Text } from './Text';

/** The web's SectionHead: a heading with an optional link on the other side. */
export function SectionHead({ title, link, onPress }: { title: string; link?: string; onPress?: () => void }) {
  return (
    <View style={styles.row}>
      <Text variant="title">{title}</Text>
      {link && onPress && <LinkText label={link} onPress={onPress} />}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 } });
