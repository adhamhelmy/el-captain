import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { homeForRole } from '@/lib/routes'

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role
    const path = req.nextUrl.pathname
    const deny = () => NextResponse.redirect(new URL(homeForRole(role), req.url))

    if (path.startsWith('/admin') && role !== 'ADMIN') return deny()
    // Only the /classes list is protected; /classes/[id] is a public page.
    if (path === '/classes' && role !== 'STUDIO' && role !== 'COACH' && role !== 'ADMIN') return deny()
    if (path.startsWith('/bookings') && role !== 'USER' && role !== 'ADMIN') return deny()
    if (path.startsWith('/sessions') && role !== 'COACH' && role !== 'ADMIN') return deny()
  },
  { pages: { signIn: '/auth/login' } }
)

export const config = {
  matcher: ['/admin/:path*', '/classes', '/bookings/:path*', '/sessions/:path*', '/profile/:path*'],
}
