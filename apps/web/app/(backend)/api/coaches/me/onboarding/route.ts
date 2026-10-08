import { NextResponse } from 'next/server';
import { assertFound, protect, type AuthContext } from '@/lib/api';
import { missingFields } from '@/lib/coach-rules';
import { draftOf, toCoachDTO } from '@/lib/dto';
import { findCoach } from '@/prisma/models/coach-profile';
import { lastStatusEvent } from '@/prisma/models/coach-status';

/** Everything the onboarding wizard needs: the draft, what still blocks submit, and why it was last rejected or suspended. */
async function myOnboarding({ user }: AuthContext) {
  const coach = await findCoach(user.id);
  assertFound(coach?.coachProfile);

  const status = coach.coachProfile.status;
  const last = status === 'REJECTED' || status === 'SUSPENDED' ? await lastStatusEvent(coach.coachProfile.id) : null;

  return NextResponse.json({ coach: toCoachDTO(coach), missing: missingFields(draftOf(coach)), reason: last?.reason ?? null });
}

export const GET = protect(myOnboarding, ['COACH']);
