import { Redirect, type Href } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useAuth } from '@/auth/AuthProvider';
import { afterSignIn, homeFor } from '@/auth/home';
import { useTheme } from '@/theme/ThemeProvider';
import { FloatingTabBar } from './FloatingTabBar';
import { TABS, type Audience, type Tab } from './tabs';

function tabBarOf(tabs: Tab[]) {
  return function TabBar(props: BottomTabBarProps) {
    return <FloatingTabBar {...props} tabs={tabs} />;
  };
}

/** Each audience's tab bar, made once so the navigator keeps the same component across renders. */
const TAB_BARS = Object.fromEntries(Object.entries(TABS).map(([audience, tabs]) => [audience, tabBarOf(tabs)])) as Record<Audience, ReturnType<typeof tabBarOf>>;

/** The tab navigator for one audience; each group's _layout renders this. Anyone else is sent to their own home. */
export function TabsLayout({ audience }: Readonly<{ audience: Audience }>) {
  const { colors } = useTheme();
  const { user, returnTo } = useAuth();
  const home = homeFor(user);
  // A guest who just signed in goes back to the page that sent them to log in, if it had one.
  if (!home.startsWith(`/${audience}/`)) return <Redirect href={(user ? afterSignIn(user, returnTo) : home) as Href} />;

  const tabs = TABS[audience];
  return (
    <Tabs
      // Back goes to the page you came from, so pages without a tab (Locations, a member's My sessions) return there.
      backBehavior="history"
      tabBar={TAB_BARS[audience]}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}
