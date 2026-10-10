import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { canTransition, missingFields } from '@/lib/shared/coach-rules';
import { sendCoachSubmittedEmail } from '@/lib/email/coach-emails';
import { draftOf } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { requestLocale } from '@/lib/email/mail';
import { findCoach } from '@/prisma/models/coach-profile';
import { setCoachStatus } from '@/prisma/models/coach-status';
import { listAdminEmails } from '@/prisma/models/user';

/** The coach sends their profile for review. Everything required must be filled in first. */
async function submit({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  assertAllowed(user.id === id);

  const coach = await findCoach(id);
  assertFound(coach?.coachProfile);

  const from = coach.coachProfile.status;
  assertNoConflict(canTransition(from, 'PENDING', 'coach'), 'Cannot submit now', ERROR_CODES.INVALID_STATUS_TRANSITION);

  const missing = missingFields(draftOf(coach));
  assertValid(missing.length === 0, 'Profile incomplete', ERROR_CODES.PROFILE_INCOMPLETE, { missing });

  const changed = await setCoachStatus(coach.coachProfile.id, { from, to: 'PENDING', actorId: user.id, locale: requestLocale(req) });
  assertNoConflict(changed, 'Status changed', ERROR_CODES.INVALID_STATUS_TRANSITION);

  await sendCoachSubmittedEmail(await listAdminEmails(), { id, name: coach.name });
  return NextResponse.json({ status: 'PENDING' });
}

export const POST = protect(submit, ['COACH']);
