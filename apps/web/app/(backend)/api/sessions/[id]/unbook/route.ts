import { NextResponse } from 'next/server';
import { assertFound, assertNoConflict, protect, type AuthContext } from '@/lib/server/api';
import { toSessionDTO } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { canMemberCancel } from '@/lib/shared/session-rules';
import { refundBookings } from '@/lib/server/payments/checkout';
import { unbookSession } from '@/prisma/models/booking';
import { findSession } from '@/prisma/models/session';

/** A member cancels their group booking, up to 2 hours before the start, and gets back what they paid. A private session is cancelled by its coach. */
async function unbook({ user, params: { id } }: AuthContext<{ id: string }>) {
  const session = await findSession(id);
  assertFound(session);
  assertNoConflict(session.type === 'GROUP', 'Ask the coach to cancel a private session', ERROR_CODES.SESSION_CLOSED);
  assertNoConflict(canMemberCancel(session.startsAt), 'Too late to cancel', ERROR_CODES.CANCEL_TOO_LATE);
  const bookingId = await unbookSession(id, user.id);
  assertFound(bookingId);
  await refundBookings([bookingId]);

  const updated = await findSession(id);
  return NextResponse.json({ ...toSessionDTO(updated!), bookedByMe: false });
}

export const POST = protect(unbook, ['USER']);
