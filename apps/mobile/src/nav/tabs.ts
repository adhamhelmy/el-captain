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
