import { NextResponse } from 'next/server';
import { assertFound, protect, type AuthContext } from '@/lib/api';
import { toAdminCoachDTO } from '@/lib/dto';
import { findCoach } from '@/prisma/models/coach-profile';
import { listStatusEvents } from '@/prisma/models/coach-status';

/** The full profile whatever its status, with the review history. */
async function getCoach({ params: { id } }: AuthContext<{ id: string }>) {
  const coach = await findCoach(id);
  assertFound(coach?.coachProfile);
  return NextResponse.json(toAdminCoachDTO(coach, await listStatusEvents(coach.coachProfile.id)));
}

export const GET = protect(getCoach, ['ADMIN']);
