import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { useTheme } from '@/theme/ThemeProvider';
import type { Tab } from './tabs';

/** Space the floating bar takes from the bottom of the screen; screens pad their content by this much. */
export const TAB_BAR_HEIGHT = 62;
export const TAB_BAR_GAP = 12;

/**
 * Full-width floating pill with icons only. The active tab sits in a faint accent circle.
 * Row order follows the layout direction, so it mirrors in Arabic.
 */
export function FloatingTabBar({ state, navigation, tabs }: BottomTabBarProps & { tabs: Tab[] }) {
  const { colors } = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.bar, { bottom: insets.bottom + TAB_BAR_GAP, backgroundColor: colors.barBg, borderColor: colors.border }]}
      accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const tab = tabs.find((x) => x.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        const Icon = tab.icon;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
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
