import type { TransactionResult } from '@/lib/server/payments/provider';
import { prisma } from '../client';
import { liveHold } from './booking';

type Recipient = { id: string; email: string; locale: string | null };

/** What the checkout needs to know about the member paying. */
export function findPayer(memberId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: memberId }, select: { id: true, name: true, email: true, phone: true } });
}

/** The booking's newest checkout that hasn't been paid or declined, to send the member back to. */
export function openPayment(bookingId: string) {
  return prisma.payment.findFirst({ where: { bookingId, status: 'PENDING', clientSecret: { not: null } }, orderBy: { createdAt: 'desc' } });
}

export function createPayment(data: { bookingId: string; memberId: string; amountCents: number; returnUrl: string | null }) {
  return prisma.payment.create({ data: { ...data, provider: 'PAYMOB' } });
}

/** Where to send the member after a checkout they reopened, which may be on another device. */
export function setReturnUrl(id: string, returnUrl: string | null) {
  return prisma.payment.update({ where: { id }, data: { returnUrl } });
}

/** The app link the payment's checkout was started from, or null when it was the web. */
export async function paymentReturnUrl(id: string) {
  return (await prisma.payment.findUnique({ where: { id }, select: { returnUrl: true } }))?.returnUrl ?? null;
}

export function attachCheckout(id: string, { intentionId, clientSecret }: { intentionId: string; clientSecret: string }) {
  return prisma.payment.update({ where: { id }, data: { providerIntentionId: intentionId, clientSecret } });
}

export type Settlement =
  | { kind: 'ignored' }
  | { kind: 'pending' | 'failed' | 'already'; sessionId: string }
  | { kind: 'confirmed'; sessionId: string; member: Recipient }
  | { kind: 'refund'; sessionId: string; paymentId: string; transactionId: string; amountCents: number };

/**
 * Applies a verified transaction to its payment and booking. Safe to run twice for the same transaction:
 * the webhook and the return page both call it.
 * A success confirms the booking while its hold lasts, or later if a spot is still free.
 * A success that can't be used (session full, cancelled or started, or already paid) comes back as `refund`.
 */
export async function settlePayment(r: TransactionResult, now = new Date()): Promise<Settlement> {
  const payment = await prisma.payment.findUnique({
    where: { id: r.paymentId },
    select: { id: true, amountCents: true, booking: { select: { sessionId: true } } },
  });
  if (!payment) return { kind: 'ignored' };
  if (r.amountCents !== payment.amountCents) {
    console.error(`payment ${payment.id}: transaction ${r.transactionId} is for ${r.amountCents}, expected ${payment.amountCents}`);
    return { kind: 'ignored' };
  }
  const sessionId = payment.booking.sessionId;
  if (r.pending) return { kind: 'pending', sessionId };
  if (!r.success) {
    await prisma.payment.updateMany({ where: { id: payment.id, status: 'PENDING' }, data: { status: 'FAILED' } });
    return { kind: 'failed', sessionId };
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Session" WHERE id = ${sessionId} FOR UPDATE`;
    const p = await tx.payment.findUnique({
      where: { id: payment.id },
      select: {
        status: true,
        booking: {
          select: {
            id: true,
            memberId: true,
            status: true,
            holdUntil: true,
            member: { select: { id: true, email: true, locale: true } },
            session: { select: { status: true, startsAt: true, capacity: true } },
          },
        },
      },
    });
    if (!p || (p.status !== 'PENDING' && p.status !== 'FAILED')) return { kind: 'already', sessionId };
    await tx.payment.update({ where: { id: payment.id }, data: { status: 'PAID', providerTransactionId: r.transactionId, paidAt: now } });

    const b = p.booking;
    const refund = { kind: 'refund', sessionId, paymentId: payment.id, transactionId: r.transactionId, amountCents: r.amountCents } as const;
    if (b.status === 'CONFIRMED' || b.session.status !== 'SCHEDULED' || b.session.startsAt <= now) return refund;
    const holding = b.status === 'PENDING_PAYMENT' && !!b.holdUntil && b.holdUntil > now;
    if (!holding) {
      const taken = await tx.booking.count({ where: { sessionId, memberId: { not: b.memberId }, OR: [{ status: 'CONFIRMED' }, liveHold(now)] } });
      if (taken >= b.session.capacity) return refund;
    }
    await tx.booking.update({ where: { id: b.id }, data: { status: 'CONFIRMED', holdUntil: null, cancelledAt: null, cancelledBy: null } });
    return { kind: 'confirmed', sessionId, member: b.member };
  });
}

/** Paid payments on these bookings: what a cancellation has to refund. */
export function paidPayments(bookingIds: string[]) {
  return prisma.payment.findMany({
    where: { bookingId: { in: bookingIds }, status: 'PAID', providerTransactionId: { not: null } },
    select: { id: true, providerTransactionId: true, amountCents: true },
  });
}

/** Refunds Paymob refused, newest first, for admins to sort out in Paymob's dashboard. */
export function failedRefunds(limit = 20) {
  return prisma.payment.findMany({
    where: { status: 'REFUND_FAILED' },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      amountCents: true,
      providerTransactionId: true,
      updatedAt: true,
      member: { select: { name: true, email: true } },
      booking: { select: { session: { select: { id: true, title: true } } } },
    },
  });
}

export type FailedRefundRow = Awaited<ReturnType<typeof failedRefunds>>[number];

export function markRefund(paymentId: string, ok: boolean, now = new Date()) {
  return prisma.payment.update({ where: { id: paymentId }, data: ok ? { status: 'REFUNDED', refundedAt: now } : { status: 'REFUND_FAILED' } });
}
