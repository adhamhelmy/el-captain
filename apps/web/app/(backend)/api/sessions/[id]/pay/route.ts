import { NextResponse } from 'next/server';
import { assertFound, assertNoConflict, assertUpstream, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { requestLocale } from '@/lib/email/mail';
import { sendBookingConfirmed } from '@/lib/email/session-emails';
import { toSessionDTO } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { readPaymentMethod } from '@/lib/shared/payment-rules';
import { appReturnUrl } from '@/lib/server/payments/app-return';
import { startCheckout } from '@/lib/server/payments/checkout';
import { assertBooked, bookingPayment } from '@/lib/server/payments/manual';
import { findBooking, payHeldInCashAt } from '@/prisma/models/booking';
import { findSession } from '@/prisma/models/session';

/**
 * The member pays for the spot they hold: a private session the coach accepted, or a group spot they didn't finish paying for.
 * `method` picks how, as when booking: card answers `checkoutUrl`, cash confirms the spot (`bookedByMe`).
 * The app sends `returnUrl`, its own link to come back to after paying by card.
 */
async function pay({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  const body = await req.json().catch(() => ({}));
  const method = readPaymentMethod(body?.method);
  assertValid(method, 'Invalid payment method', ERROR_CODES.PAYMENT_METHOD_UNAVAILABLE);

  if (method === 'cash') {
    const outcome = await payHeldInCashAt(id, user.id);
    assertBooked(outcome);
    const booking = await findBooking(id, user.id);
    const session = await findSession(id);
    await sendBookingConfirmed({ id: user.id, email: user.email, locale: requestLocale(req) }, toSessionDTO(session!), true);
    return NextResponse.json({ bookedByMe: true, payment: booking && (await bookingPayment(booking.id)) });
  }

  const booking = await findBooking(id, user.id);
  assertFound(booking);
  const holding = booking.status === 'PENDING_PAYMENT' && !!booking.holdUntil && booking.holdUntil > new Date();
  assertNoConflict(holding, 'Nothing to pay', ERROR_CODES.PAYMENT_CLOSED);
  const session = await findSession(id);
  assertNoConflict(session?.status === 'SCHEDULED', 'Nothing to pay', ERROR_CODES.PAYMENT_CLOSED);

  const awaiting = { bookingId: booking.id, price: session.price };
  const checkoutUrl = await startCheckout(awaiting, user.id, session.title, appReturnUrl(body?.returnUrl)).catch((e) => {
    console.error(`checkout for booking ${booking.id} failed`, e);
    return null;
  });
  assertUpstream(checkoutUrl, 'Payment unavailable', ERROR_CODES.PAYMENT_UNAVAILABLE);
  return NextResponse.json({ checkoutUrl });
}

export const POST = protect(pay, ['USER']);
