import { NextResponse } from 'next/server';
import { assertValid, protect, publicRoute, type AuthContext, type RequestContext } from '@/lib/server/api';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { toSessionDTO } from '@/lib/server/dto';
import { date, readFilter, search, text } from '@/lib/server/query-filter';
import { assertCoachCanUse, assertSessionValid, EMPTY_DRAFT, readSessionDraft } from '@/lib/server/session-input';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { repeatStarts, type SessionLevel } from '@/lib/shared/session-rules';
import { createGroupSessions, listOpenSessions } from '@/prisma/models/session';

const FILTER = { sportId: text('sport'), q: search(), coachId: text('coach'), from: date('from'), to: date('to') };

/** Upcoming group sessions. ?sport= ?q= (title or coach) ?coach= ?from= ?to= */
async function list({ query, page }: RequestContext) {
  return NextResponse.json((await listOpenSessions(readFilter(query, FILTER), page)).map(toSessionDTO));
}

/** An approved coach publishes a group session, optionally repeated weekly. */
async function create({ req, user }: AuthContext) {
  await assertActiveCoach(user);
  const d = readSessionDraft(await req.json(), EMPTY_DRAFT);
  assertSessionValid(d);
  await assertCoachCanUse(user.id, { sportId: d.sportId, venueId: d.venueId });
  const starts = repeatStarts(d.startsAt!, d.repeatWeeks);
  assertValid(starts, 'Invalid session', ERROR_CODES.INVALID_SESSION, { fields: ['startsAt'] });
  const created = await createGroupSessions(
    {
      coachId: user.id,
      sportId: d.sportId,
      venueId: d.venueId,
      level: d.level as SessionLevel,
      title: d.title,
      description: d.description || null,
      durationMin: d.durationMin,
      price: d.price,
      capacity: d.capacity,
    },
    starts,
  );
  return NextResponse.json(created.map(toSessionDTO), { status: 201 });
}

export const GET = publicRoute(list);
export const POST = protect(create, ['COACH']);
