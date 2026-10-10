import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, protect, type AuthContext } from '@/lib/server/api';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { toRequestDTO, toSessionDTO } from '@/lib/server/dto';
import { sendRequestAccepted } from '@/lib/email/session-emails';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { acceptRequest, findRequest } from '@/prisma/models/private-request';
import { findSession } from '@/prisma/models/session';

async function accept({ user, params: { id } }: AuthContext<{ id: string }>) {
  await assertActiveCoach(user);

  const request = await findRequest(id);
  assertFound(request);
  assertAllowed(request.coachId === user.id);

  const outcome = await acceptRequest(id, user.id);
  if (!outcome.ok) assertNoConflict(false, 'Cannot accept', outcome.reason === 'conflict' ? ERROR_CODES.TIME_CONFLICT : ERROR_CODES.REQUEST_CLOSED);

  const session = await findSession(outcome.sessionId);
  const { id: memberId, email, locale } = request.member;
  await sendRequestAccepted({ id: memberId, email, locale }, toSessionDTO(session!));
  return NextResponse.json(toRequestDTO((await findRequest(id))!));
}

export const POST = protect(accept, ['COACH']);
