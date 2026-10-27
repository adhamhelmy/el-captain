import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above imports, so the fake transaction must be created with vi.hoisted.
const tx = vi.hoisted(() => ({
  session: { updateMany: vi.fn() },
  booking: { findMany: vi.fn(), updateMany: vi.fn() },
}));
vi.mock('../client', () => ({ prisma: { $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)) } }));

import { cancelSession } from './session';

const member = (id: string) => ({ id, email: `${id}@x.com`, locale: 'en' });

beforeEach(() => {
  vi.clearAllMocks();
  tx.session.updateMany.mockResolvedValue({ count: 1 });
  tx.booking.findMany.mockResolvedValue([
    { id: 'b1', member: member('u1') },
    { id: 'b2', member: member('u2') },
  ]);
});

describe('cancelSession', () => {
  it('cancels confirmed and held bookings, returning the members to email and the bookings to refund', async () => {
    expect(await cancelSession('x1', 'COACH', 'Injury')).toEqual({ members: [member('u1'), member('u2')], bookingIds: ['b1', 'b2'] });
    const active = { sessionId: 'x1', status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } };
    expect(tx.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: active }));
    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: active,
      data: { status: 'CANCELLED', cancelledAt: expect.any(Date), cancelledBy: 'COACH', holdUntil: null },
    });
  });

  it('returns null for a session that was already cancelled', async () => {
    tx.session.updateMany.mockResolvedValue({ count: 0 });
    expect(await cancelSession('x1', 'ADMIN', null)).toBeNull();
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });
});
