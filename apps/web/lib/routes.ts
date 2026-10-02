/** Landing page for a signed-in user, based on their role. */
export function homeForRole(role?: string): string {
  if (role === 'ADMIN') return '/admin'
  if (role === 'STUDIO' || role === 'COACH') return '/classes'
  if (role === 'USER') return '/bookings'
  return '/'
}
