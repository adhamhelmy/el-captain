import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { useTheme } from '@/theme/ThemeProvider';
import { LinkText } from './LinkText';
import { Text } from './Text';

/** The web's Drawer as an iOS page sheet: a title with Close, then a scrolling form that clears the keyboard. */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tc = useTranslations('common');
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.head}>
          <Text variant="title">{title}</Text>
          <LinkText label={tc('close')} onPress={onClose} muted />
        </View>
        {children}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { padding: 20, gap: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
