import { NextResponse } from 'next/server';
import { assertValid, protect, type AuthContext } from '@/lib/server/api';
import { toSessionDTO } from '@/lib/server/dto';
import { date, oneOf } from '@/lib/server/query-filter';
import { WHENS } from '@/lib/shared/session-rules';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { expireHolds } from '@/prisma/models/booking';
import { listCoachSessions, listCoachSessionsBetween, listMemberSessions, MAX_RANGE_DAYS } from '@/prisma/models/session';

/**
 * A coach's own sessions, or the sessions a member is booked on. ?when=upcoming (default) or past.
 * A coach can instead ask for everything starting between ?from= and ?to= (up to a month), as the week view does.
 */
async function mine({ user, query, page }: AuthContext) {
  await assertActiveCoach(user);
  await expireHolds();
  const from = date('from')(query);
  const to = date('to')(query);
  if (user.role === 'COACH' && (from || to)) {
    assertValid(from && to && to > from && to.getTime() - from.getTime() <= MAX_RANGE_DAYS * 86_400_000, 'Invalid range');
    return NextResponse.json((await listCoachSessionsBetween(user.id, from, to)).map(toSessionDTO));
  }
  const when = oneOf('when', WHENS, 'upcoming')(query);
  const list = user.role === 'COACH' ? await listCoachSessions(user.id, when, page) : await listMemberSessions(user.id, when, page);
  return NextResponse.json(list.map(toSessionDTO));
}

export const GET = protect(mine, ['COACH', 'USER']);
