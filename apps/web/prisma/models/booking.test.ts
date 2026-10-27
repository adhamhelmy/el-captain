import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above imports, so the fake transaction must be created with vi.hoisted.
const tx = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  booking: { findUnique: vi.fn(), count: vi.fn(), upsert: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
  session: { findUnique: vi.fn(), updateMany: vi.fn() },
}));
const db = vi.hoisted(() => ({ booking: { findFirst: vi.fn(), updateMany: vi.fn() } }));
vi.mock('../client', () => ({ prisma: { ...db, $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)) } }));

import { bookSession, expireHolds, unbookSession } from './booking';

const now = new Date('2026-10-20T10:00:00Z');
const open = {
  type: 'GROUP',
  status: 'SCHEDULED',
  startsAt: new Date('2026-10-21T10:00:00Z'),
  capacity: 2,
  price: 0,
  coach: { coachProfile: { status: 'ACTIVE' } },
};

beforeEach(() => {
  vi.clearAllMocks();
  tx.session.findUnique.mockResolvedValue(open);
  tx.booking.findUnique.mockResolvedValue(null);
  tx.booking.count.mockResolvedValue(1);
  tx.booking.upsert.mockResolvedValue({ id: 'b1' });
});

const holdEnds = new Date(now.getTime() + 15 * 60_000);
const paid = { ...open, price: 350 };

describe('bookSession', () => {
  it('locks the session row before counting, so two members cannot both take the last spot', async () => {
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: true, newlyBooked: true, awaitingPayment: null });
    const [strings, id] = tx.$queryRaw.mock.calls[0];
    expect(strings.join('?')).toMatch(/SELECT id FROM "Session" WHERE id = \? FOR UPDATE/);
    expect(id).toBe('x1');
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.booking.count.mock.invocationCallOrder[0]);
    expect(tx.booking.upsert).toHaveBeenCalledWith({
      where: { sessionId_memberId: { sessionId: 'x1', memberId: 'u1' } },
      create: { sessionId: 'x1', memberId: 'u1' },
      update: { status: 'CONFIRMED', cancelledAt: null, cancelledBy: null, holdUntil: null },
    });
  });

  it("counts confirmed spots and other members' live holds", async () => {
    await bookSession('x1', 'u1', now);
    expect(tx.booking.count).toHaveBeenCalledWith({
      where: {
        sessionId: 'x1',
        memberId: { not: 'u1' },
        OR: [{ status: 'CONFIRMED' }, { status: 'PENDING_PAYMENT', holdUntil: { gt: now } }],
      },
    });
  });

  it('holds the spot for 15 minutes on a paid session and asks for payment', async () => {
    tx.session.findUnique.mockResolvedValue(paid);
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: true, newlyBooked: true, awaitingPayment: { bookingId: 'b1', price: 350 } });
    expect(tx.booking.upsert).toHaveBeenCalledWith({
      where: { sessionId_memberId: { sessionId: 'x1', memberId: 'u1' } },
      create: { sessionId: 'x1', memberId: 'u1', status: 'PENDING_PAYMENT', holdUntil: holdEnds },
      update: { status: 'PENDING_PAYMENT', holdUntil: holdEnds, cancelledAt: null, cancelledBy: null },
    });
  });

  it("reuses the member's live hold without extending it", async () => {
    tx.session.findUnique.mockResolvedValue(paid);
    tx.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'PENDING_PAYMENT', holdUntil: new Date(now.getTime() + 60_000) });
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: true, newlyBooked: false, awaitingPayment: { bookingId: 'b1', price: 350 } });
    expect(tx.booking.upsert).not.toHaveBeenCalled();
  });

  it('holds again once an old hold has lapsed', async () => {
    tx.session.findUnique.mockResolvedValue(paid);
    tx.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'PENDING_PAYMENT', holdUntil: now });
    expect(await bookSession('x1', 'u1', now)).toMatchObject({ ok: true, newlyBooked: true });
    expect(tx.booking.upsert).toHaveBeenCalled();
  });

  it("refuses when the last spot is another member's live hold", async () => {
    tx.session.findUnique.mockResolvedValue(paid);
    tx.booking.count.mockResolvedValue(2);
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: false, reason: 'full' });
  });

  it('refuses when the spots are taken', async () => {
    tx.booking.count.mockResolvedValue(2);
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: false, reason: 'full' });
    expect(tx.booking.upsert).not.toHaveBeenCalled();
  });

  it('reactivates a cancelled booking', async () => {
    tx.booking.findUnique.mockResolvedValue({ status: 'CANCELLED' });
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: true, newlyBooked: true, awaitingPayment: null });
    expect(tx.booking.upsert).toHaveBeenCalled();
  });

  it('does nothing for a member who is already booked', async () => {
    tx.booking.findUnique.mockResolvedValue({ status: 'CONFIRMED' });
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: true, newlyBooked: false, awaitingPayment: null });
    expect(tx.booking.upsert).not.toHaveBeenCalled();
  });

  it.each([
    ['started', { ...open, startsAt: now }],
    ['cancelled', { ...open, status: 'CANCELLED' }],
    ['private', { ...open, type: 'PRIVATE' }],
    ["suspended coach's", { ...open, coach: { coachProfile: { status: 'SUSPENDED' } } }],
  ])('refuses a %s session', async (_, session) => {
    tx.session.findUnique.mockResolvedValue(session);
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: false, reason: 'closed' });
  });

  it('reports a missing session', async () => {
    tx.session.findUnique.mockResolvedValue(null);
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: false, reason: 'missing' });
  });
});

describe('expireHolds', () => {
  it('cancels lapsed unpaid bookings and the private sessions they were for', async () => {
    tx.booking.findMany.mockResolvedValue([
      { id: 'b1', sessionId: 'x1', session: { type: 'GROUP' } },
      { id: 'b2', sessionId: 'x2', session: { type: 'PRIVATE' } },
    ]);
    await expireHolds(now);
    expect(tx.booking.findMany).toHaveBeenCalledWith({
      where: { status: 'PENDING_PAYMENT', holdUntil: { lte: now } },
      select: { id: true, sessionId: true, session: { select: { type: true } } },
    });
    expect(tx.booking.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['b1', 'b2'] } }, data: { status: 'CANCELLED', cancelledAt: now } });
    expect(tx.session.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['x2'] }, status: 'SCHEDULED' },
      data: { status: 'CANCELLED', cancelledAt: now },
    });
  });

  it('writes nothing when no hold has lapsed', async () => {
    tx.booking.findMany.mockResolvedValue([]);
    await expireHolds(now);
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
    expect(tx.session.updateMany).not.toHaveBeenCalled();
  });
});

describe('unbookSession', () => {
  it("cancels the member's confirmed group booking and returns it, for the refund", async () => {
    db.booking.findFirst.mockResolvedValue({ id: 'b1' });
    db.booking.updateMany.mockResolvedValue({ count: 1 });
    expect(await unbookSession('x1', 'u1')).toBe('b1');
    expect(db.booking.updateMany).toHaveBeenCalledWith({
      where: { sessionId: 'x1', memberId: 'u1', status: 'CONFIRMED', session: { type: 'GROUP' }, id: 'b1' },
      data: { status: 'CANCELLED', cancelledAt: expect.any(Date), cancelledBy: 'MEMBER' },
    });
  });

  it('returns null when there was nothing to cancel, or someone else got there first', async () => {
    db.booking.findFirst.mockResolvedValue(null);
    expect(await unbookSession('x1', 'u1')).toBeNull();
    db.booking.findFirst.mockResolvedValue({ id: 'b1' });
    db.booking.updateMany.mockResolvedValue({ count: 0 });
    expect(await unbookSession('x1', 'u1')).toBeNull();
  });
});
