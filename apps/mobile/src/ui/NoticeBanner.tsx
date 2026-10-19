import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

/** One-off message from sign-in state (signed out, suspended, offline, admin). Tap to dismiss. */
export function NoticeBanner() {
  const { notice, clearNotice } = useAuth();
  const { colors } = useTheme();
  const t = useTranslations('errors');
  const insets = useSafeAreaInsets();
  if (!notice) return null;
  return (
    <Pressable
      onPress={clearNotice}
      accessibilityRole="alert"
      style={[styles.banner, { top: insets.top + 8, backgroundColor: colors.surface, borderColor: colors.warn }]}>
      <Text style={{ color: colors.text }}>{t(notice)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', left: 16, right: 16, padding: 14, borderRadius: 12, borderWidth: 1, zIndex: 10 },
});
