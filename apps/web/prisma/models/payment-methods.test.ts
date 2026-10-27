import { beforeEach, describe, expect, it, vi } from 'vitest';

// Cash: paid to the coach at the session, who marks it paid or not paid.
const { tx, db } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    payment: { count: vi.fn(), create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    booking: { findUnique: vi.fn(), findFirstOrThrow: vi.fn(), update: vi.fn() },
    session: { updateMany: vi.fn() },
  };
  const db = {
    $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    payment: { count: vi.fn(), create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  };
  return { tx, db };
});
vi.mock('../client', () => ({ prisma: db }));

import { cashBlocked, closeCashPayments, confirmWithCash, markCash } from './payment';

const now = new Date('2026-10-20T10:00:00Z');
const later = (min: number) => new Date(now.getTime() + min * 60_000);

beforeEach(() => {
  vi.clearAllMocks();
  tx.payment.updateMany.mockResolvedValue({ count: 1 });
  db.payment.updateMany.mockResolvedValue({ count: 1 });
});

describe('cashBlocked', () => {
  it('counts cash the coach has not marked after the start, and cash marked not paid', async () => {
    tx.payment.count.mockResolvedValue(1);
    expect(await cashBlocked(tx as any, 'u1', now)).toBe(false);
    expect(tx.payment.count).toHaveBeenCalledWith({
      where: {
        memberId: 'u1',
        provider: 'CASH',
        OR: [
          { status: 'PENDING', booking: { status: 'CONFIRMED', session: { status: 'SCHEDULED', startsAt: { lte: now } } } },
          { status: 'FAILED', settledAt: { not: null } },
        ],
      },
    });
  });

  it('blocks at two', async () => {
    tx.payment.count.mockResolvedValue(2);
    expect(await cashBlocked(tx as any, 'u1', now)).toBe(true);
  });
});

describe('confirmWithCash', () => {
  it('confirms the booking and records the cash owed', async () => {
    await confirmWithCash(tx as any, 'b1', 'u1', 350);
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { status: 'CONFIRMED', holdUntil: null, cancelledAt: null, cancelledBy: null },
    });
    expect(tx.payment.create).toHaveBeenCalledWith({ data: { bookingId: 'b1', memberId: 'u1', amountCents: 35000, provider: 'CASH' } });
  });
});

describe('closeCashPayments', () => {
  it('closes cash that was never paid', async () => {
    await closeCashPayments(['b1']);
    expect(db.payment.updateMany).toHaveBeenCalledWith({ where: { bookingId: { in: ['b1'] }, provider: 'CASH', status: 'PENDING' }, data: { status: 'FAILED' } });
  });

  it('does nothing without bookings', async () => {
    await closeCashPayments([]);
    expect(db.payment.updateMany).not.toHaveBeenCalled();
  });
});

describe('markCash', () => {
  const cash = (over: object = {}, session: object = {}) => ({
    provider: 'CASH',
    status: 'PENDING',
    booking: { status: 'CONFIRMED', session: { coachId: 'k1', startsAt: later(-30), ...session } },
    ...over,
  });

  it.each([
    [true, { status: 'PAID', paidAt: now }],
    [false, { status: 'FAILED', paidAt: null }],
  ])('the coach marks paid=%s after the start', async (paid, data) => {
    db.payment.findUnique.mockResolvedValue(cash());
    expect(await markCash('p1', 'k1', paid, now)).toEqual({ ok: true });
    expect(db.payment.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { ...data, settledAt: now, settledById: 'k1' } });
  });

  it.each([
    ['missing', null],
    ['missing', cash({ provider: 'PAYMOB' })],
    ['missing', cash({ status: 'REFUNDED' })],
    ['missing', cash({ booking: { status: 'CANCELLED', session: { coachId: 'k1', startsAt: later(-30) } } })],
    ['forbidden', cash({}, { coachId: 'k2' })],
    ['early', cash({}, { startsAt: later(30) })],
  ])('refuses as %s', async (reason, p) => {
    db.payment.findUnique.mockResolvedValue(p);
    expect(await markCash('p1', 'k1', true, now)).toEqual({ ok: false, reason });
    expect(db.payment.update).not.toHaveBeenCalled();
  });
});
