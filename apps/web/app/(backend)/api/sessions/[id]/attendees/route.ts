import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, protect, type AuthContext } from '@/lib/server/api';
import { toAttendeeDTO } from '@/lib/server/dto';
import { listAttendees } from '@/prisma/models/booking';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { findSession } from '@/prisma/models/session';

/** Who's booked: for the session's coach and admins. */
async function attendees({ user, params: { id } }: AuthContext<{ id: string }>) {
  await assertActiveCoach(user);

  const session = await findSession(id);
  assertFound(session);
  assertAllowed(user.role === 'ADMIN' || session.coachId === user.id);
  return NextResponse.json((await listAttendees(id)).map(toAttendeeDTO));
}

export const GET = protect(attendees, ['COACH', 'ADMIN']);
