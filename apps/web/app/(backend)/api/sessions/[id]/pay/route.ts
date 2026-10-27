import { NextResponse } from 'next/server';
import { assertFound, assertNoConflict, assertUpstream, protect, type AuthContext } from '@/lib/server/api';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { appReturnUrl } from '@/lib/server/payments/app-return';
import { startCheckout } from '@/lib/server/payments/checkout';
import { findBooking } from '@/prisma/models/booking';
import { findSession } from '@/prisma/models/session';

/**
 * The member pays for the spot they hold: a private session the coach accepted, or a group spot they didn't finish paying for.
 * The app sends `returnUrl`, its own link to come back to after paying.
 */
async function pay({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  const booking = await findBooking(id, user.id);
  assertFound(booking);
  const holding = booking.status === 'PENDING_PAYMENT' && !!booking.holdUntil && booking.holdUntil > new Date();
  assertNoConflict(holding, 'Nothing to pay', ERROR_CODES.PAYMENT_CLOSED);
  const session = await findSession(id);
  assertNoConflict(session?.status === 'SCHEDULED', 'Nothing to pay', ERROR_CODES.PAYMENT_CLOSED);

  const body = await req.json().catch(() => ({}));
  const returnUrl = appReturnUrl(body?.returnUrl);
  const checkoutUrl = await startCheckout({ bookingId: booking.id, price: session.price }, user.id, session.title, returnUrl).catch((e) => {
    console.error(`checkout for booking ${booking.id} failed`, e);
    return null;
  });
  assertUpstream(checkoutUrl, 'Payment unavailable', ERROR_CODES.PAYMENT_UNAVAILABLE);
  return NextResponse.json({ checkoutUrl });
}

export const POST = protect(pay, ['USER']);
