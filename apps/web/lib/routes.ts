/** Where a coach who isn't approved yet lives: the onboarding wizard or its status screens. */
export const ONBOARDING = '/coach/onboarding';

const isOnboarding = (path: string) => path.split(/[?#]/)[0].replace(/\/$/, '') === ONBOARDING;

/** Landing page for a signed-in user, based on their role (and, for coaches, their review status). */
export function homeForRole(role?: string, coachStatus?: string): string {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'COACH') return coachStatus === 'ACTIVE' ? '/coach/dashboard' : ONBOARDING;
  if (role === 'STUDIO') return '/coach/dashboard';
  if (role === 'USER') return '/user/dashboard';
  return '/';
}

/** Roles allowed into each area. Each area renders as one persona, so roles don't share. */
export const AREA_ROLES: Record<string, string[]> = {
  admin: ['ADMIN'],
  coach: ['COACH', 'STUDIO'],
  user: ['USER'],
};

/**
 * Whether `role` may open `path`. Paths outside the role areas are public.
 * A coach who isn't ACTIVE only gets onboarding in the coach area; an ACTIVE one is done with it.
 */
export function canAccess(role: string | undefined, path: string, coachStatus?: string): boolean {
  const area = path.split(/[/?#]/)[1];
  const roles = AREA_ROLES[area];
  if (!roles) return true;
  if (!roles.includes(role as string)) return false;
  if (role === 'COACH' && area === 'coach') return (coachStatus === 'ACTIVE') !== isOnboarding(path);
  return true;
}
