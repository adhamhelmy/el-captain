import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { Text } from './Text';

/** Mark + wordmark, as the web's <Logo> (apps/web/components/ui.tsx). */
export function Logo() {
  const t = useTranslations('brand');
  return (
    <View style={styles.row}>
      <Image source={require('@/assets/images/logo.png')} style={styles.mark} accessibilityIgnoresInvertColors />
      <Text variant="title" style={styles.text}>
        {t('name')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 28, height: 28, borderRadius: 7 },
  text: { fontSize: 24, letterSpacing: 2 },
});
