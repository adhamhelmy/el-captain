import { Redirect, type Href } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useAuth } from '@/auth/AuthProvider';
import { afterSignIn, homeFor } from '@/auth/home';
import { useTheme } from '@/theme/ThemeProvider';
import { FloatingTabBar } from './FloatingTabBar';
import { TABS, type Audience } from './tabs';

/** The tab navigator for one audience; each group's _layout renders this. Anyone else is sent to their own home. */
export function TabsLayout({ audience }: { audience: Audience }) {
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
      tabBar={(props) => <FloatingTabBar {...props} tabs={tabs} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}
