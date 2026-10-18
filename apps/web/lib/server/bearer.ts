import { decode, encode } from 'next-auth/jwt';
import type { Role } from '@el-captain/types';
import { HttpError, type AuthUser } from '@/lib/server/api';
import type { CoachStatus } from '@/lib/shared/coach-rules';
import { findAccess } from '@/prisma/models/user';

/**
 * Sign-in tokens for the mobile app, which can't rely on the browser's next-auth cookie.
 * Same secret and format as the cookie's JWT; the app sends it as `Authorization: Bearer <token>`.
 */
const MAX_AGE_S = 30 * 24 * 60 * 60;
const secret = () => process.env.NEXTAUTH_SECRET ?? '';

type TokenUser = { id: string; name: string; email: string; role: Role };

export function issueToken({ id, name, email, role }: TokenUser) {
  return encode({ token: { id, name, email, role, signedInAt: Date.now() }, secret: secret(), maxAge: MAX_AGE_S });
}

/**
 * The user behind the request's bearer token, or null when it has none.
 * Account status is read on every request (no cookie to cache it in), so a suspension,
 * approval or password change applies at once; a token older than the last password change is refused.
 */
export async function userFromBearer(req: Request): Promise<AuthUser | null> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  const token = await decode({ token: header.slice(7), secret: secret() }).catch(() => null);
  if (!token?.id) throw new HttpError(401, 'Unauthorized');

  const access = await findAccess(token.id);
  if (access.passwordChangedAt && access.passwordChangedAt > (token.signedInAt ?? 0)) throw new HttpError(401, 'Unauthorized');

  return {
    id: token.id,
    name: token.name ?? '',
    email: token.email ?? '',
    role: token.role,
    ...(token.role === 'COACH' && { coachStatus: (access.coachStatus ?? 'INCOMPLETE') as CoachStatus }),
    ...(access.suspended && { suspended: true }),
  };
}
