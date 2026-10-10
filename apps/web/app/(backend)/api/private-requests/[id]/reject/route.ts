import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { toRequestDTO } from '@/lib/server/dto';
import { sendRequestRejected } from '@/lib/email/session-emails';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { cleanText, TEXT_MAX } from '@/lib/shared/session-rules';
import { findRequest, rejectRequest } from '@/prisma/models/private-request';

async function reject({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  await assertActiveCoach(user);
  const request = await findRequest(id);
  assertFound(request);
  assertAllowed(request.coachId === user.id);

  const body = await req.json().catch(() => ({}));
  const note = cleanText(body?.note);
  assertValid(note.length <= TEXT_MAX, 'Note too long', ERROR_CODES.INVALID_SESSION, { fields: ['note'] });
  assertNoConflict(await rejectRequest(id, user.id, note || null), 'Not pending', ERROR_CODES.REQUEST_CLOSED);

  const { id: memberId, email, locale } = request.member;
  await sendRequestRejected({ id: memberId, email, locale }, request, note || null);
  return NextResponse.json(toRequestDTO((await findRequest(id))!));
}

export const POST = protect(reject, ['COACH']);
