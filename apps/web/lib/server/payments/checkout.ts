import { appUrl } from '@/lib/email/mail';
import { sendBookingConfirmed } from '@/lib/email/session-emails';
import { toSessionDTO } from '@/lib/server/dto';
import type { AwaitingPayment } from '@/prisma/models/booking';
import { attachCheckout, closeCashPayments, createPayment, findPayer, markRefund, openPayment, paidPayments, setReturnUrl, settlePayment, type Settlement } from '@/prisma/models/payment';
import { findSession } from '@/prisma/models/session';
import { paymob, toPiastres } from './paymob';
import type { TransactionResult } from './provider';

/**
 * The payment page for a held booking. Goes back to the booking's open checkout if there is one,
 * otherwise records a new Payment and asks Paymob for a checkout. Throws when Paymob refuses.
 * `returnUrl` is the app link to come back to after paying; null when the member is on the web.
 */
export async function startCheckout({ bookingId, price }: AwaitingPayment, memberId: string, description: string, returnUrl: string | null = null) {
  const open = await openPayment(bookingId);
  if (open?.clientSecret) {
    if ((open.returnUrl ?? null) !== returnUrl) await setReturnUrl(open.id, returnUrl);
    return paymob.checkoutUrl(open.clientSecret);
  }

  const member = await findPayer(memberId);
  const payment = await createPayment({ bookingId, memberId, amountCents: toPiastres(price), returnUrl });
  const checkout = await paymob.createCheckout({
    paymentId: payment.id,
    amountCents: payment.amountCents,
    description,
    customer: member,
    notificationUrl: appUrl('/api/payments/paymob/webhook'),
    redirectionUrl: appUrl('/api/payments/paymob/return'),
  });
  await attachCheckout(payment.id, checkout);
  return checkout.checkoutUrl;
}

/** Applies a verified transaction: confirms and emails, or refunds a payment that came too late. */
export async function settle(result: TransactionResult): Promise<Settlement> {
  const outcome = await settlePayment(result);
  if (outcome.kind === 'confirmed') {
    const session = await findSession(outcome.sessionId);
    await sendBookingConfirmed(outcome.member, toSessionDTO(session!));
  }
  if (outcome.kind === 'refund') await refundPayment(outcome.paymentId, outcome.transactionId, outcome.amountCents);
  return outcome;
}

/** Refunds one payment in full. A refusal is recorded for admins, never thrown: the cancellation it follows stands. */
async function refundPayment(paymentId: string, transactionId: string, amountCents: number) {
  try {
    await paymob.refund(transactionId, amountCents);
    await markRefund(paymentId, true);
  } catch (e) {
    console.error(`refund of payment ${paymentId} failed`, e);
    await markRefund(paymentId, false);
  }
}

/** Refunds whatever was paid for these cancelled bookings: card payments through Paymob; unpaid cash is no longer owed. */
export async function refundBookings(bookingIds: string[]) {
  if (bookingIds.length === 0) return;
  await closeCashPayments(bookingIds);
  for (const p of await paidPayments(bookingIds)) await refundPayment(p.id, p.providerTransactionId!, p.amountCents);
}
