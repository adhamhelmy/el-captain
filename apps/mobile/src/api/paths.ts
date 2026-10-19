import { fromWallClock, weekDates } from '@el-captain/rules/app-time';
import type { MobileUser } from '@/auth/session';
import { exploreQuery } from '@/sessions/search';

/** GET paths the tabs open with; the same strings are prefetched, so they must match exactly. */
export const PATHS = {
  me: '/api/users/me',
  myCoaches: '/api/users/me/coaches',
  myUpcoming: '/api/sessions/me?when=upcoming&limit=50',
  myPast: '/api/sessions/me?when=past&limit=50',
  myRequests: '/api/private-requests/me',
  openSessions: '/api/sessions?limit=24',
  sports: '/api/sports',
  exploreCoaches: `/api/coaches?${exploreQuery({ sport: 'all', q: '' })}`,
  exploreSessions: `/api/sessions?${exploreQuery({ sport: 'all', q: '' })}`,
  onboarding: '/api/coaches/me/onboarding',
  myVenues: '/api/venues/me',
  coachStats: '/api/coaches/me/stats',
  clients: '/api/coaches/me/clients',
} as const;

/** A coach's sessions in one week of the schedule (0 = this week), by date range so it's complete. */
export function weekPath(week: number): string | null {
  const from = fromWallClock({ date: weekDates(week)[0], time: '00:00' });
  const to = fromWallClock({ date: weekDates(week + 1)[0], time: '00:00' });
  if (!from || !to) return null;
  return `/api/sessions/me?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
}

const EXPLORE = [PATHS.sports, PATHS.exploreCoaches, PATHS.exploreSessions];

/** What to load in the background once we know who is signed in: every tab they have. */
export function prefetchPaths(user: Pick<MobileUser, 'role' | 'coachStatus'> | null): string[] {
  if (!user) return EXPLORE;
  if (user.role === 'USER') return [PATHS.myUpcoming, PATHS.myPast, PATHS.myCoaches, PATHS.me, PATHS.openSessions, PATHS.myRequests, ...EXPLORE];
  const coach = user.role === 'STUDIO' || (user.role === 'COACH' && user.coachStatus === 'ACTIVE');
  const thisWeek = weekPath(0);
  if (coach) return [PATHS.onboarding, PATHS.myVenues, PATHS.myRequests, PATHS.coachStats, PATHS.myUpcoming, PATHS.myPast, PATHS.clients, ...(thisWeek ? [thisWeek] : [])];
  return [];
}

/** The GET paths a detail page opens with, by its route; the page reads the same strings, so a prefetch fills it. */
export const DETAIL = {
  session: (id: string) => `/api/sessions/${id}`,
  attendees: (id: string) => `/api/sessions/${id}/attendees`,
  coach: (id: string) => `/api/coaches/${id}`,
  coachSessions: (id: string) => `/api/sessions?limit=50&coach=${id}`,
  client: (id: string) => `/api/coaches/me/clients/${id}`,
} as const;

/** What to start loading when someone taps through to a page, before it has even opened. */
export function pagePaths(href: string): string[] {
  const [, page, id] = href.split('?')[0].split('/');
  if (!id) return [];
  if (page === 'session') return [DETAIL.session(id)];
  if (page === 'coach-session') return [DETAIL.session(id), DETAIL.attendees(id)];
  if (page === 'coach-profile') return [DETAIL.coach(id), DETAIL.coachSessions(id)];
  if (page === 'client') return [DETAIL.client(id)];
  return [];
}
