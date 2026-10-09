import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { canAccess, homeForRole } from '@/lib/shared/routes';

export default withAuth(
  function proxy(req) {
    const { role, coachStatus, suspended } = req.nextauth.token ?? {};
    if (suspended) return NextResponse.redirect(new URL(`/login?error=${ERROR_CODES.ACCOUNT_SUSPENDED}`, req.url));
    if (!canAccess(role, req.nextUrl.pathname, coachStatus)) {
      return NextResponse.redirect(new URL(homeForRole(role, coachStatus), req.url));
    }
  },
  { pages: { signIn: '/login' } },
);

export const config = {
  matcher: ['/admin/:path*', '/coach/:path*', '/user/:path*'],
};
