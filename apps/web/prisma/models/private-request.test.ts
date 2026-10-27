import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above imports, so the fake transaction must be created with vi.hoisted.
const tx = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  privateRequest: { findUnique: vi.fn(), update: vi.fn() },
  session: { findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  booking: { findMany: vi.fn(), updateMany: vi.fn() },
  sport: { findUniqueOrThrow: vi.fn() },
}));
vi.mock('../client', () => ({ prisma: { $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)) } }));

import { acceptRequest } from './private-request';

const now = new Date('2026-10-20T10:00:00Z');
const pending = {
  id: 'r1',
  memberId: 'u1',
  coachId: 'k1',
  venueId: 'v1',
  sportId: 's1',
  startsAt: new Date('2026-10-21T10:00:00Z'),
  durationMin: 60,
  price: 800,
  message: 'Knee rehab',
  status: 'PENDING',
};

beforeEach(() => {
  vi.clearAllMocks();
  tx.privateRequest.findUnique.mockResolvedValue(pending);
  tx.session.findMany.mockResolvedValue([]);
  tx.session.create.mockResolvedValue({ id: 'x9' });
  tx.sport.findUniqueOrThrow.mockResolvedValue({ nameEn: 'Yoga' });
  tx.booking.findMany.mockResolvedValue([]);
});

describe('acceptRequest', () => {
  it('locks the coach, then the request, then creates the private session with the member booked, and links it', async () => {
    expect(await acceptRequest('r1', 'k1', now)).toEqual({ ok: true, sessionId: 'x9', payBy: pending.startsAt });
    const [coachLock, coachId] = tx.$queryRaw.mock.calls[0];
    expect(coachLock.join('?')).toMatch(/FROM "CoachProfile" WHERE "userId" = \? FOR UPDATE/);
    expect(coachId).toBe('k1');
    expect(tx.$queryRaw.mock.calls[1][0].join('?')).toMatch(/FROM "PrivateRequest" WHERE id = \? FOR UPDATE/);
    expect(tx.$queryRaw.mock.invocationCallOrder[1]).toBeLessThan(tx.session.findMany.mock.invocationCallOrder[0]);
    expect(tx.session.create).toHaveBeenCalledWith({
      data: {
        coachId: 'k1',
        sportId: 's1',
        venueId: 'v1',
        type: 'PRIVATE',
        title: 'Yoga',
        description: 'Knee rehab',
        startsAt: pending.startsAt,
        durationMin: 60,
        price: 800,
        capacity: 1,
        bookings: { create: { memberId: 'u1', status: 'PENDING_PAYMENT', holdUntil: pending.startsAt } },
      },
    });
    expect(tx.privateRequest.update).toHaveBeenCalledWith({ where: { id: 'r1' }, data: { status: 'ACCEPTED', respondedAt: now, sessionId: 'x9' } });
  });

  it.each([
    ['already answered', { ...pending, status: 'CANCELLED' }],
    ['expired', { ...pending, startsAt: now }],
    ["another coach's", { ...pending, coachId: 'k2' }],
  ])('refuses a request that is %s, creating nothing', async (_, request) => {
    tx.privateRequest.findUnique.mockResolvedValue(request);
    expect(await acceptRequest('r1', 'k1', now)).toEqual({ ok: false, reason: 'closed' });
    expect(tx.session.create).not.toHaveBeenCalled();
  });

  it('holds the booking for 24 hours for payment', async () => {
    tx.privateRequest.findUnique.mockResolvedValue({ ...pending, startsAt: new Date('2026-10-23T10:00:00Z') });
    await acceptRequest('r1', 'k1', now);
    expect(tx.session.create.mock.calls[0][0].data.bookings).toEqual({
      create: { memberId: 'u1', status: 'PENDING_PAYMENT', holdUntil: new Date('2026-10-21T10:00:00Z') },
    });
  });

  it('holds only until the start when that comes sooner', async () => {
    const soon = new Date('2026-10-20T12:00:00Z');
    tx.privateRequest.findUnique.mockResolvedValue({ ...pending, startsAt: soon });
    await acceptRequest('r1', 'k1', now);
    expect(tx.session.create.mock.calls[0][0].data.bookings.create.holdUntil).toEqual(soon);
  });

  it('confirms a free private session straight away', async () => {
    tx.privateRequest.findUnique.mockResolvedValue({ ...pending, price: 0 });
    await acceptRequest('r1', 'k1', now);
    expect(tx.session.create.mock.calls[0][0].data.bookings).toEqual({ create: { memberId: 'u1' } });
  });

  it('clears lapsed unpaid holds before the clash check, so their time is free again', async () => {
    tx.booking.findMany.mockResolvedValue([{ id: 'b0', sessionId: 'x0', session: { type: 'PRIVATE' } }]);
    await acceptRequest('r1', 'k1', now);
    expect(tx.booking.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['b0'] } }, data: { status: 'CANCELLED', cancelledAt: now } });
    expect(tx.session.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['x0'] }, status: 'SCHEDULED' },
      data: { status: 'CANCELLED', cancelledAt: now },
    });
    expect(tx.session.updateMany.mock.invocationCallOrder[0]).toBeLessThan(tx.session.findMany.mock.invocationCallOrder[0]);
  });

  it('refuses when the coach already has a session at that time', async () => {
    tx.session.findMany.mockResolvedValue([{ startsAt: new Date('2026-10-21T09:30:00Z'), durationMin: 60 }]);
    expect(await acceptRequest('r1', 'k1', now)).toEqual({ ok: false, reason: 'conflict' });
    expect(tx.session.create).not.toHaveBeenCalled();
  });

  it('allows a session that ends exactly when the request starts', async () => {
    tx.session.findMany.mockResolvedValue([{ startsAt: new Date('2026-10-21T09:00:00Z'), durationMin: 60 }]);
    expect(await acceptRequest('r1', 'k1', now)).toMatchObject({ ok: true });
  });
});
