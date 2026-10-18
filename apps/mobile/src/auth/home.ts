import type { MobileUser } from './session';

export type Home = '/guest/explore' | '/user/dashboard' | '/coach/dashboard' | '/onboarding';

/** Where a user lands, mirroring the web's homeForRole (apps/web/lib/shared/routes.ts). Admins use the web. */
export function homeFor(user: MobileUser | null): Home {
  if (user?.role === 'USER') return '/user/dashboard';
  if (user?.role === 'STUDIO') return '/coach/dashboard';
  if (user?.role === 'COACH') return user.coachStatus === 'ACTIVE' ? '/coach/dashboard' : '/onboarding';
  return '/guest/explore';
}

/** Where sign-in lands: back to the page that sent a member to log in, otherwise home. Coaches never go to member pages. */
export function afterSignIn(user: MobileUser, returnTo: string | null): string {
  return user.role === 'USER' && returnTo ? returnTo : homeFor(user);
}
