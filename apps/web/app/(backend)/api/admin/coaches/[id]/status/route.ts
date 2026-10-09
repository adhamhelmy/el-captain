import { NextResponse } from 'next/server';
import { assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { canTransition } from '@/lib/shared/coach-rules';
import { sendCoachDecisionEmail } from '@/lib/email/coach-emails';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { isAppLocale } from '@/i18n/locale';
import { findCoach, type CoachStatus } from '@/prisma/models/coach-profile';
import { setCoachStatus } from '@/prisma/models/coach-status';

/** Which email each decision sends. Approval is PENDING → ACTIVE only; reinstating sends none. */
function emailFor(from: CoachStatus, to: CoachStatus) {
  if (from === 'PENDING' && to === 'ACTIVE') return 'approved';
  if (to === 'REJECTED') return 'rejected';
  if (to === 'SUSPENDED') return 'suspended';
  return null;
}

/** An admin approves, rejects, suspends or reinstates a coach. */
async function decide({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  const { to, reason } = await req.json();
  const coach = await findCoach(id);
  assertFound(coach?.coachProfile);

  const { id: profileId, status: from, locale } = coach.coachProfile;
  assertNoConflict(canTransition(from, to, 'admin'), 'Invalid status change', ERROR_CODES.INVALID_STATUS_TRANSITION);

  const why = typeof reason === 'string' && reason.trim() ? reason.trim() : null;
  if (to === 'REJECTED') assertValid(why, 'A reason is required', ERROR_CODES.REASON_REQUIRED);

  const changed = await setCoachStatus(profileId, { from, to, actorId: user.id, reason: why });
  assertNoConflict(changed, 'Status changed', ERROR_CODES.INVALID_STATUS_TRANSITION);

  const kind = emailFor(from, to);
  if (kind) await sendCoachDecisionEmail({ id, email: coach.email }, isAppLocale(locale) ? locale : 'en', kind, why);
  return NextResponse.json({ status: to });
}

export const POST = protect(decide, ['ADMIN']);
