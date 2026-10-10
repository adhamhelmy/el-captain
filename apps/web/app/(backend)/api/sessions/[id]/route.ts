import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  assertAllowed,
  assertFound,
  assertNoConflict,
  assertValid,
  protect,
  publicRoute,
  type AuthContext,
  type RequestContext,
} from '@/lib/server/api';
import { authOptions } from '@/lib/server/auth';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { toSessionDTO } from '@/lib/server/dto';
import { assertCoachCanUse, assertSessionValid, draftFromSession, readSessionDraft } from '@/lib/server/session-input';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { hasStarted, type SessionField, type SessionLevel } from '@/lib/shared/session-rules';
import { findBooking } from '@/prisma/models/booking';
import { findSession, updateSession, type SessionUpdate } from '@/prisma/models/session';

/**
 * One session. A private one, or one whose coach isn't active (e.g. suspended), is a 404
 * for anyone but its coach, its booked members and admins.
 */
async function get({ params: { id } }: RequestContext<{ id: string }>) {
  const session = await findSession(id);
  assertFound(session);
  const viewer = (await getServerSession(authOptions))?.user;
  const booking = viewer ? await findBooking(id, viewer.id) : null;
  const bookedByMe = booking?.status === 'CONFIRMED';
  const hidden = session.type === 'PRIVATE' || session.coach.coachProfile?.status !== 'ACTIVE';
  if (hidden) assertFound(viewer?.role === 'ADMIN' || viewer?.id === session.coachId || bookedByMe ? session : null);
  return NextResponse.json({ ...toSessionDTO(session), bookedByMe });
}

/** Fields that can't change once a member has booked: they'd turn up at the wrong time or place. */
const LOCKED_WHEN_BOOKED = ['venueId', 'startsAt', 'durationMin'] as const;

/** The coach edits a group session before it starts. Only the changed fields are saved. */
async function edit({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  await assertActiveCoach(user);
  const session = await findSession(id);
  assertFound(session);
  assertAllowed(session.coachId === user.id);
  assertNoConflict(
    session.type === 'GROUP' && session.status === 'SCHEDULED' && !hasStarted(session.startsAt),
    'Session closed',
    ERROR_CODES.SESSION_CLOSED,
  );

  const before = draftFromSession(session);
  const after = readSessionDraft(await req.json(), before);
  assertSessionValid(after);

  const changed = (Object.keys(before) as SessionField[]).filter((k) =>
    k === 'startsAt' ? before.startsAt!.getTime() !== after.startsAt!.getTime() : before[k] !== after[k],
  );
  const booked = session._count.bookings;
  const blocked: SessionField[] = [
    ...(booked > 0 ? LOCKED_WHEN_BOOKED.filter((k) => changed.includes(k)) : []),
    ...(after.capacity < booked ? (['capacity'] as const) : []),
  ];
  assertValid(blocked.length === 0, 'Invalid session', ERROR_CODES.INVALID_SESSION, { fields: blocked });
  await assertCoachCanUse(user.id, {
    ...(changed.includes('sportId') && { sportId: after.sportId }),
    ...(changed.includes('venueId') && { venueId: after.venueId }),
  });

  const update: SessionUpdate = {};
  for (const k of changed) {
    if (k === 'repeatWeeks') continue;
    if (k === 'description') update.description = after.description || null;
    else if (k === 'level') update.level = after.level as SessionLevel;
    else if (k === 'startsAt') update.startsAt = after.startsAt!;
    else Object.assign(update, { [k]: after[k] });
  }
  return NextResponse.json(toSessionDTO(await updateSession(id, update)));
}

export const GET = publicRoute(get);
export const PATCH = protect(edit, ['COACH']);
