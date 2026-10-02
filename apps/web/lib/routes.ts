/** Landing page for a signed-in user, based on their role. */
export function homeForRole(role?: string): string {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'COACH' || role === 'STUDIO') return '/coach/dashboard'
  if (role === 'USER') return '/user/dashboard'
  return '/'
}

/** Roles allowed into each area. Each area renders as one persona, so roles don't share. */
export const AREA_ROLES: Record<string, string[]> = {
  admin: ['ADMIN'],
  coach: ['COACH', 'STUDIO'],
  user: ['USER'],
}

/** Whether `role` may open `path`. Paths outside the role areas are public. */
export function canAccess(role: string | undefined, path: string): boolean {
  const roles = AREA_ROLES[path.split(/[/?#]/)[1]]
  return !roles || roles.includes(role as string)
}
