import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { toSessionDTO } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { cleanText, hasStarted, TEXT_MAX } from '@/lib/shared/session-rules';
import { cancelSession, findSession } from '@/prisma/models/session';
import { sendSessionCancelled } from '@/lib/email/session-emails';

/** The coach (or an admin) cancels a session that hasn't started. Every booking is cancelled with it. */
async function cancel({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  const admin = user.role === 'ADMIN';
  if (!admin) await assertActiveCoach(user);

  const session = await findSession(id);
  assertFound(session);
  assertAllowed(admin || session.coachId === user.id);
  assertNoConflict(!hasStarted(session.startsAt), 'Session closed', ERROR_CODES.SESSION_CLOSED);

  const body = await req.json().catch(() => ({}));
  const reason = cleanText(body?.reason);
  assertValid(reason.length <= TEXT_MAX, 'Reason too long', ERROR_CODES.INVALID_SESSION, { fields: ['reason'] });

  const members = await cancelSession(id, admin ? 'ADMIN' : 'COACH', reason || null);
  assertNoConflict(members, 'Session closed', ERROR_CODES.SESSION_CLOSED);

  const dto = toSessionDTO((await findSession(id))!);
  await sendSessionCancelled(members, dto, reason || null);
  return NextResponse.json(dto);
}

export const POST = protect(cancel, ['COACH', 'ADMIN']);
