import type { Prisma } from '@prisma/client';
import type { TransactionResult } from '@/lib/server/payments/provider';
import { CASH_UNPAID_LIMIT } from '@/lib/shared/payment-rules';
import { prisma } from '../client';
import { liveHold } from './booking';

type Tx = Prisma.TransactionClient;
export type { PaymentProvider, PaymentStatus } from '@prisma/client';

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

/** The method and state of the booking's latest payment, for the member's session page. */
export function latestPayment(bookingId: string) {
  return prisma.payment.findFirst({
    where: { bookingId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, provider: true, status: true, amountCents: true },
  });
}

/**
 * Cash sessions the member hasn't paid: the session started and the coach hasn't marked it yet, or marked it not paid.
 * At CASH_UNPAID_LIMIT the member can't choose cash again.
 */
export async function cashBlocked(tx: Tx, memberId: string, now: Date) {
  const unpaid = await tx.payment.count({
    where: {
      memberId,
      provider: 'CASH',
      OR: [
        { status: 'PENDING', booking: { status: 'CONFIRMED', session: { status: 'SCHEDULED', startsAt: { lte: now } } } },
        { status: 'FAILED', settledAt: { not: null } },
      ],
    },
  });
  return unpaid >= CASH_UNPAID_LIMIT;
}

/** Confirms the booking to be paid in cash at the session. */
export async function confirmWithCash(tx: Tx, bookingId: string, memberId: string, price: number) {
  await tx.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED', holdUntil: null, cancelledAt: null, cancelledBy: null } });
  return tx.payment.create({ data: { bookingId, memberId, amountCents: price * 100, provider: 'CASH' } });
}

/** Cash not yet paid on these cancelled bookings is no longer owed. */
export async function closeCashPayments(bookingIds: string[]) {
  if (bookingIds.length === 0) return;
  await prisma.payment.updateMany({ where: { bookingId: { in: bookingIds }, provider: 'CASH', status: 'PENDING' }, data: { status: 'FAILED' } });
}

export type CashMark = { ok: true } | { ok: false; reason: 'missing' | 'forbidden' | 'early' };

/** The coach marks a cash payment paid or not paid, once the session has started. Either can be changed later. */
export async function markCash(paymentId: string, coachId: string, paid: boolean, now = new Date()): Promise<CashMark> {
  const p = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { provider: true, status: true, booking: { select: { status: true, session: { select: { coachId: true, startsAt: true } } } } },
  });
  if (p?.provider !== 'CASH' || p.booking.status !== 'CONFIRMED' || !['PENDING', 'PAID', 'FAILED'].includes(p.status)) return { ok: false, reason: 'missing' };
  if (p.booking.session.coachId !== coachId) return { ok: false, reason: 'forbidden' };
  if (p.booking.session.startsAt > now) return { ok: false, reason: 'early' };
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: paid ? 'PAID' : 'FAILED', paidAt: paid ? now : null, settledAt: now, settledById: coachId },
  });
  return { ok: true };
}
