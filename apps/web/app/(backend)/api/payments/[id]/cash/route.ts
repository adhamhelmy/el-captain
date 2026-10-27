import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { markCash } from '@/prisma/models/payment';

/** The coach marks a member's cash payment `{ paid: true | false }`, once the session has started. */
async function cash({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  await assertActiveCoach(user);
  const body = await req.json().catch(() => ({}));
  assertValid(typeof body?.paid === 'boolean', 'Invalid body', ERROR_CODES.MISSING_FIELDS);

  const outcome = await markCash(id, user.id, body.paid);
  if (!outcome.ok) {
    assertFound(outcome.reason === 'missing' ? null : outcome);
    assertAllowed(outcome.reason !== 'forbidden');
    assertNoConflict(false, 'Session not started', ERROR_CODES.SESSION_CLOSED);
  }
  return NextResponse.json({ status: body.paid ? 'PAID' : 'FAILED' });
}

export const POST = protect(cash, ['COACH']);
