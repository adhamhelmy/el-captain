import { NextResponse } from 'next/server';
import { assertUpstream, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { toSessionDTO } from '@/lib/server/dto';
import { requestLocale } from '@/lib/email/mail';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { readPaymentMethod } from '@/lib/shared/payment-rules';
import { bookSession, findBooking } from '@/prisma/models/booking';
import { setMemberLocale } from '@/prisma/models/member';
import { sendBookingConfirmed } from '@/lib/email/session-emails';
import { appReturnUrl } from '@/lib/server/payments/app-return';
import { startCheckout } from '@/lib/server/payments/checkout';
import { assertBooked, bookingPayment } from '@/lib/server/payments/manual';
import { findSession } from '@/prisma/models/session';

/**
 * A member books a spot on a group session (or books again after cancelling), paying with `method` (card when not sent).
 * - Card: the spot is held and the answer carries `checkoutUrl`; the booking is confirmed once payment arrives.
 *   The app sends `returnUrl`, its own link to come back to after paying.
 * - Cash: the spot is booked straight away, to be paid at the session.
 */
async function book({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  const body = await req.json().catch(() => ({}));
  const method = readPaymentMethod(body?.method);
  assertValid(method, 'Invalid payment method', ERROR_CODES.PAYMENT_METHOD_UNAVAILABLE);

  const outcome = await bookSession(id, user.id, new Date(), method);
  assertBooked(outcome);
  await setMemberLocale(user.id, requestLocale(req));
  const session = await findSession(id);
  const dto = toSessionDTO(session!);

  if (outcome.awaitingPayment) {
    const { bookingId } = outcome.awaitingPayment;
    const checkoutUrl = await startCheckout(outcome.awaitingPayment, user.id, dto.title, appReturnUrl(body?.returnUrl)).catch((e) => {
      console.error(`checkout for booking ${bookingId} failed`, e);
      return null;
    });
    assertUpstream(checkoutUrl, 'Payment unavailable', ERROR_CODES.PAYMENT_UNAVAILABLE);
    return NextResponse.json({ ...dto, bookedByMe: false, checkoutUrl });
  }

  const booking = await findBooking(id, user.id);
  const payment = booking && (await bookingPayment(booking.id));
  const member = { id: user.id, email: user.email, locale: requestLocale(req) };
  if (outcome.newlyBooked) await sendBookingConfirmed(member, dto, payment?.method === 'cash');
  return NextResponse.json({ ...dto, bookedByMe: true, payment });
}

export const POST = protect(book, ['USER']);
