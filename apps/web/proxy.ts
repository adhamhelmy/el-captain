import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { canAccess, homeForRole } from '@/lib/routes'

export default withAuth(
  function proxy(req) {
    const role = req.nextauth.token?.role
    if (!canAccess(role, req.nextUrl.pathname)) {
      return NextResponse.redirect(new URL(homeForRole(role), req.url))
    }
  },
  { pages: { signIn: '/login' } }
)

export const config = {
  matcher: ['/admin/:path*', '/coach/:path*', '/user/:path*'],
}
