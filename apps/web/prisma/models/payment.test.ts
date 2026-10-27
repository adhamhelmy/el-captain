import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above imports, so the fakes must be created with vi.hoisted.
const { tx, db } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    payment: { findUnique: vi.fn(), update: vi.fn() },
    booking: { count: vi.fn(), update: vi.fn() },
  };
  const db = {
    $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    payment: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  };
  return { tx, db };
});
vi.mock('../client', () => ({ prisma: db }));

import { markRefund, settlePayment } from './payment';

const now = new Date('2026-10-20T10:00:00Z');
const later = (min: number) => new Date(now.getTime() + min * 60_000);
const member = { id: 'u1', email: 'u@x.com', locale: 'en' };
const result = { paymentId: 'p1', transactionId: 't1', success: true, pending: false, amountCents: 35000 };
const outer = { id: 'p1', status: 'PENDING', amountCents: 35000, booking: { sessionId: 's1' } };
const held = (over: object = {}, session: object = {}) => ({
  id: 'p1',
  status: 'PENDING',
  amountCents: 35000,
  booking: {
    id: 'b1',
    memberId: 'u1',
    status: 'PENDING_PAYMENT',
    holdUntil: later(5),
    member,
    session: { id: 's1', status: 'SCHEDULED', startsAt: later(60 * 24), capacity: 2, ...session },
    ...over,
  },
});
const refund = { kind: 'refund', sessionId: 's1', paymentId: 'p1', transactionId: 't1', amountCents: 35000 };

beforeEach(() => {
  vi.clearAllMocks();
  db.payment.findUnique.mockResolvedValue(outer);
  tx.payment.findUnique.mockResolvedValue(held());
  tx.booking.count.mockResolvedValue(0);
});

describe('settlePayment', () => {
  it('confirms a held booking once paid, locking the session first', async () => {
    expect(await settlePayment(result, now)).toEqual({ kind: 'confirmed', sessionId: 's1', member });
    const [strings, id] = tx.$queryRaw.mock.calls[0];
    expect(strings.join('?')).toMatch(/SELECT id FROM "Session" WHERE id = \? FOR UPDATE/);
    expect(id).toBe('s1');
    expect(tx.payment.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { status: 'PAID', providerTransactionId: 't1', paidAt: now } });
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { status: 'CONFIRMED', holdUntil: null, cancelledAt: null, cancelledBy: null },
    });
  });

  it('does nothing the second time, so the webhook and the return page can both settle', async () => {
    tx.payment.findUnique.mockResolvedValue({ ...held(), status: 'PAID' });
    expect(await settlePayment(result, now)).toEqual({ kind: 'already', sessionId: 's1' });
    expect(tx.payment.update).not.toHaveBeenCalled();
    expect(tx.booking.update).not.toHaveBeenCalled();
  });

  it('ignores an unknown payment', async () => {
    db.payment.findUnique.mockResolvedValue(null);
    expect(await settlePayment(result, now)).toEqual({ kind: 'ignored' });
  });

  it('ignores a transaction for a different amount', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await settlePayment({ ...result, amountCents: 100 }, now)).toEqual({ kind: 'ignored' });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('waits on a pending transaction', async () => {
    expect(await settlePayment({ ...result, pending: true }, now)).toEqual({ kind: 'pending', sessionId: 's1' });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('marks a declined payment failed but keeps the hold for a retry', async () => {
    expect(await settlePayment({ ...result, success: false }, now)).toEqual({ kind: 'failed', sessionId: 's1' });
    expect(db.payment.updateMany).toHaveBeenCalledWith({ where: { id: 'p1', status: 'PENDING' }, data: { status: 'FAILED' } });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('confirms a retry that succeeds after a failed attempt', async () => {
    tx.payment.findUnique.mockResolvedValue({ ...held(), status: 'FAILED' });
    expect(await settlePayment(result, now)).toMatchObject({ kind: 'confirmed' });
  });

  it('confirms a late payment when a spot is still free', async () => {
    tx.payment.findUnique.mockResolvedValue(held({ holdUntil: later(-1) }));
    expect(await settlePayment(result, now)).toMatchObject({ kind: 'confirmed' });
    expect(tx.booking.count).toHaveBeenCalledWith({
      where: {
        sessionId: 's1',
        memberId: { not: 'u1' },
        OR: [{ status: 'CONFIRMED' }, { status: 'PENDING_PAYMENT', holdUntil: { gt: now } }],
      },
    });
  });

  it('refunds a late payment when the session filled up', async () => {
    tx.payment.findUnique.mockResolvedValue(held({ holdUntil: later(-1) }));
    tx.booking.count.mockResolvedValue(2);
    expect(await settlePayment(result, now)).toEqual(refund);
    expect(tx.payment.update).toHaveBeenCalled();
    expect(tx.booking.update).not.toHaveBeenCalled();
  });

  it.each([
    ['the booking is already confirmed by another payment', held({ status: 'CONFIRMED' })],
    ['the session was cancelled', held({}, { status: 'CANCELLED' })],
    ['the session has started', held({}, { startsAt: now })],
  ])('refunds when %s', async (_, payment) => {
    tx.payment.findUnique.mockResolvedValue(payment);
    expect(await settlePayment(result, now)).toEqual(refund);
    expect(tx.booking.update).not.toHaveBeenCalled();
  });
});

describe('markRefund', () => {
  it('records a refund or its failure', async () => {
    await markRefund('p1', true, now);
    expect(db.payment.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { status: 'REFUNDED', refundedAt: now } });
    await markRefund('p1', false, now);
    expect(db.payment.update).toHaveBeenLastCalledWith({ where: { id: 'p1' }, data: { status: 'REFUND_FAILED' } });
  });
});
