import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, protect, type AuthContext } from '@/lib/server/api';
import { toRequestDTO } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { cancelRequest, findRequest } from '@/prisma/models/private-request';

/** The member withdraws a request the coach hasn't answered. */
async function withdraw({ user, params: { id } }: AuthContext<{ id: string }>) {
  const request = await findRequest(id);
  assertFound(request);
  assertAllowed(request.memberId === user.id);
  assertNoConflict(await cancelRequest(id, user.id), 'Not pending', ERROR_CODES.REQUEST_CLOSED);
  return NextResponse.json(toRequestDTO((await findRequest(id))!));
}

export const POST = protect(withdraw, ['USER']);
