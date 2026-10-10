import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above imports, so the fake transaction must be created with vi.hoisted.
const tx = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  session: { findUnique: vi.fn() },
  booking: { findUnique: vi.fn(), count: vi.fn(), upsert: vi.fn() },
}));
vi.mock('../client', () => ({ prisma: { $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)) } }));

import { bookSession } from './booking';

const now = new Date('2026-10-20T10:00:00Z');
const open = {
  type: 'GROUP',
  status: 'SCHEDULED',
  startsAt: new Date('2026-10-21T10:00:00Z'),
  capacity: 2,
  coach: { coachProfile: { status: 'ACTIVE' } },
};

beforeEach(() => {
  vi.clearAllMocks();
  tx.session.findUnique.mockResolvedValue(open);
  tx.booking.findUnique.mockResolvedValue(null);
  tx.booking.count.mockResolvedValue(1);
});

describe('bookSession', () => {
  it('locks the session row before counting, so two members cannot both take the last spot', async () => {
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: true, newlyBooked: true });
    const [strings, id] = tx.$queryRaw.mock.calls[0];
    expect(strings.join('?')).toMatch(/SELECT id FROM "Session" WHERE id = \? FOR UPDATE/);
    expect(id).toBe('x1');
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.booking.count.mock.invocationCallOrder[0]);
    expect(tx.booking.upsert).toHaveBeenCalledWith({
      where: { sessionId_memberId: { sessionId: 'x1', memberId: 'u1' } },
      create: { sessionId: 'x1', memberId: 'u1' },
      update: { status: 'CONFIRMED', cancelledAt: null, cancelledBy: null },
    });
  });

  it('refuses when the spots are taken', async () => {
    tx.booking.count.mockResolvedValue(2);
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: false, reason: 'full' });
    expect(tx.booking.upsert).not.toHaveBeenCalled();
  });

  it('reactivates a cancelled booking', async () => {
    tx.booking.findUnique.mockResolvedValue({ status: 'CANCELLED' });
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: true, newlyBooked: true });
    expect(tx.booking.upsert).toHaveBeenCalled();
  });

  it('does nothing for a member who is already booked', async () => {
    tx.booking.findUnique.mockResolvedValue({ status: 'CONFIRMED' });
    expect(await bookSession('x1', 'u1', now)).toEqual({ ok: true, newlyBooked: false });
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
