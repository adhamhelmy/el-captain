import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertValid, protect, type AuthContext } from '@/lib/api';
import { toSessionRequestDTO } from '@/lib/dto';
import { findSessionRequest, updateSessionRequestStatus } from '@/prisma/models/session-request';
import { assertActiveCoach } from '@/lib/coach-guard';

/** The coach the request was sent to, or an admin, accepts or declines it. */
async function respond({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  await assertActiveCoach(user);

  const { status } = await req.json();
  assertValid(['ACCEPTED', 'DECLINED'].includes(status), 'Invalid status');

  const request = await findSessionRequest(id);
  assertFound(request);
  assertAllowed(request.coachId === user.id || user.role === 'ADMIN');

  const updated = await updateSessionRequestStatus(id, status);
  return NextResponse.json(toSessionRequestDTO(updated));
}

export const PATCH = protect(respond, ['COACH', 'ADMIN']);
