import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/nav/FloatingTabBar';
import { useTheme } from '@/theme/ThemeProvider';
import { FadeIn } from '@/ui/Skeleton';

/** A scrolling page that clears the status bar and the floating tab bar; `fade` eases it in over its placeholder. */
export function Screen({ children, tabs = true, fade = false }: { children: ReactNode; tabs?: boolean; fade?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + (tabs ? TAB_BAR_HEIGHT + TAB_BAR_GAP * 2 : 24);
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: bottom }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets>
      {fade ? <FadeIn>{children}</FadeIn> : children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 16, gap: 16 } });
