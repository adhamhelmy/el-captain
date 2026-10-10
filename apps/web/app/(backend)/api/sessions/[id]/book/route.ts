import { NextResponse } from 'next/server';
import { assertFound, assertNoConflict, protect, type AuthContext } from '@/lib/server/api';
import { toSessionDTO } from '@/lib/server/dto';
import { requestLocale } from '@/lib/email/mail';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { bookSession } from '@/prisma/models/booking';
import { setMemberLocale } from '@/prisma/models/member';
import { sendBookingConfirmed } from '@/lib/email/session-emails';
import { findSession } from '@/prisma/models/session';

/** A member books a spot on a group session (or books again after cancelling). */
async function book({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  const outcome = await bookSession(id, user.id);
  if (!outcome.ok) {
    assertFound(outcome.reason === 'missing' ? null : outcome);
    assertNoConflict(false, 'Cannot book', outcome.reason === 'full' ? ERROR_CODES.SESSION_FULL : ERROR_CODES.SESSION_CLOSED);
  }
  await setMemberLocale(user.id, requestLocale(req));
  const session = await findSession(id);
  const dto = toSessionDTO(session!);
  if (outcome.newlyBooked) await sendBookingConfirmed({ id: user.id, email: user.email, locale: requestLocale(req) }, dto);
  return NextResponse.json({ ...dto, bookedByMe: true });
}

export const POST = protect(book, ['USER']);
