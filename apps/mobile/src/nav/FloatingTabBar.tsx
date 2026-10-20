import { router, usePathname, type Href } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { useAuth } from '@/auth/AuthProvider';
import { homeFor } from '@/auth/home';
import { useTheme } from '@/theme/ThemeProvider';
import { barFor, TABS, type Tab } from './tabs';

/** Space the floating bar takes from the bottom of the screen; screens pad their content by this much. */
export const TAB_BAR_HEIGHT = 62;
export const TAB_BAR_GAP = 12;

/** The tab navigator's bar. */
export function FloatingTabBar({ state, navigation, tabs }: BottomTabBarProps & { tabs: Tab[] }) {
  const active = state.routes[state.index]?.name ?? null;
  const select = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (name !== active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };
  return <TabBarView tabs={tabs} active={active} onSelect={select} />;
}

/** The same bar on a page outside the tab groups (a session, a coach): tapping a tab goes back to that tab. */
export function DetailTabBar() {
  const { user } = useAuth();
  const bar = barFor(usePathname(), homeFor(user));
  const typing = useKeyboardShown();
  // Hidden while typing, as the tab navigator's own bar is, so it never sits on top of a form's field or button.
  if (!bar || typing) return null;
  return <TabBarView tabs={TABS[bar.audience]} active={bar.active} onSelect={(name) => router.navigate(`/${bar.audience}/${name}` as Href)} />;
}

function useKeyboardShown() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    // iOS announces the keyboard before it moves; Android only after.
    const [show, hide] = Platform.OS === 'ios' ? (['keyboardWillShow', 'keyboardWillHide'] as const) : (['keyboardDidShow', 'keyboardDidHide'] as const);
    const subs = [Keyboard.addListener(show, () => setShown(true)), Keyboard.addListener(hide, () => setShown(false))];
    return () => subs.forEach((sub) => sub.remove());
  }, []);
  return shown;
}

/**
 * Full-width floating pill with icons only. The active tab sits in a faint accent circle.
 * Row order follows the layout direction, so it mirrors in Arabic.
 */
function TabBarView({ tabs, active, onSelect }: Readonly<{ tabs: Tab[]; active: string | null; onSelect: (name: string) => void }>) {
  const { colors } = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.bar, { bottom: insets.bottom + TAB_BAR_GAP, backgroundColor: colors.barBg, borderColor: colors.border }]}
      accessibilityRole="tablist">
      {tabs.map((tab) => {
        const focused = tab.name === active;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.name}
            onPress={() => onSelect(tab.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t(tab.labelKey)}
            hitSlop={6}
            style={[styles.item, focused && { backgroundColor: colors.accentTint }]}>
            <Icon size={22} strokeWidth={2} color={focused ? colors.accentText : colors.text3} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: TAB_BAR_HEIGHT,
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  item: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
