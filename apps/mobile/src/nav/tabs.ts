import { CalendarCheck, Compass, House, LogIn, MapPin, UserRound, Users, type LucideIcon } from 'lucide-react-native';

/** Tabs per audience, copied from the web nav (apps/web/components/Shell.tsx). `name` is the route file in that group. */
export type Tab = { name: string; icon: LucideIcon; labelKey: string };
export type Audience = 'guest' | 'user' | 'coach';

export const TABS: Record<Audience, Tab[]> = {
  user: [
    { name: 'dashboard', icon: House, labelKey: 'nav.dashboard' },
    { name: 'explore', icon: Compass, labelKey: 'nav.explore' },
    { name: 'sessions', icon: CalendarCheck, labelKey: 'nav.mySessions' },
    { name: 'coaches', icon: Users, labelKey: 'nav.myCoaches' },
    { name: 'profile', icon: UserRound, labelKey: 'nav.profile' },
  ],
  coach: [
    { name: 'dashboard', icon: House, labelKey: 'nav.dashboard' },
    { name: 'sessions', icon: CalendarCheck, labelKey: 'nav.mySessions' },
    { name: 'clients', icon: Users, labelKey: 'nav.myClients' },
    { name: 'venues', icon: MapPin, labelKey: 'nav.venues' },
    { name: 'profile', icon: UserRound, labelKey: 'nav.profile' },
  ],
  guest: [
    { name: 'explore', icon: Compass, labelKey: 'nav.explore' },
    { name: 'sign-in', icon: LogIn, labelKey: 'common.logIn' },
  ],
};

/** Pages outside the tab groups that still show the bar: detail pages, and the guest's sign-up and reset pages. */
const DETAIL = /^\/(session|coach-profile|client|coach-session)\//;
const GUEST_PAGES: Record<string, string> = { '/register': 'sign-in', '/forgot-password': 'sign-in' };

/**
 * The tab bar a page outside the tab groups shows, so the bar never disappears: whose tabs, and which one is lit
 * (none on a detail page, which can be reached from several tabs). Null where there is no bar, such as onboarding.
 */
export function barFor(pathname: string, home: string): { audience: Audience; active: string | null } | null {
  const audience = (['user', 'coach', 'guest'] as const).find((a) => home.startsWith(`/${a}/`));
  if (!audience) return null;
  if (DETAIL.test(pathname)) return { audience, active: null };
  if (audience === 'guest' && pathname in GUEST_PAGES) return { audience, active: GUEST_PAGES[pathname] };
  return null;
}
