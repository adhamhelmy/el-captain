import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { toSessionDTO } from '@/lib/server/dto';
import { oneOf } from '@/lib/server/query-filter';
import { WHENS } from '@/lib/shared/session-rules';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { listCoachSessions, listMemberSessions } from '@/prisma/models/session';

/** A coach's own sessions, or the sessions a member is booked on. ?when=upcoming (default) or past. */
async function mine({ user, query, page }: AuthContext) {
  await assertActiveCoach(user);
  const when = oneOf('when', WHENS, 'upcoming')(query);
  const list = user.role === 'COACH' ? await listCoachSessions(user.id, when, page) : await listMemberSessions(user.id, when, page);
  return NextResponse.json(list.map(toSessionDTO));
}

export const GET = protect(mine, ['COACH', 'USER']);
