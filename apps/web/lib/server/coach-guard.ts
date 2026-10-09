import { HttpError, type AuthUser } from '@/lib/server/api';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { findCoachStatus } from '@/prisma/models/coach-profile';

/**
 * 403 for a coach who isn't approved (or is suspended), read from the database, not the session token.
 * Other roles pass. Call it first in any handler a coach uses to act on the platform.
 */
export async function assertActiveCoach(user: AuthUser) {
  if (user.role !== 'COACH') return;
  if ((await findCoachStatus(user.id)) !== 'ACTIVE') {
    throw new HttpError(403, 'Coach not approved', ERROR_CODES.COACH_NOT_ACTIVE);
  }
}
