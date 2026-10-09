import { NextResponse } from 'next/server';
import { assertFound, protect, type AuthContext } from '@/lib/server/api';
import { toSessionDTO } from '@/lib/server/dto';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { findCoachClient } from '@/prisma/models/insights';

/** One client: only members who booked this coach are visible to them. */
async function client({ user, params: { memberId } }: AuthContext<{ memberId: string }>) {
  await assertActiveCoach(user);
  const found = await findCoachClient(user.id, memberId);
  assertFound(found);
  return NextResponse.json({ member: found.member, sessions: found.sessions.map(toSessionDTO) });
}

export const GET = protect(client, ['COACH']);
