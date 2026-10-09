import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../client', () => ({
  prisma: {
    booking: { count: vi.fn(), findMany: vi.fn() },
    session: { findMany: vi.fn(), count: vi.fn() },
    user: { count: vi.fn() },
    coachProfile: { count: vi.fn() },
  },
}));

import { prisma } from '../client';
import { adminStats, coachStats, listCoachClients, listMemberCoaches } from './insights';

const now = new Date('2026-10-20T10:00:00Z');
const day = 86_400_000;

beforeEach(() => vi.clearAllMocks());

describe('coachStats', () => {
  it('counts the next 7 days of bookings, and earnings and fill over the last 30 days', async () => {
    vi.mocked(prisma.booking.count).mockResolvedValue(5);
    vi.mocked(prisma.session.findMany).mockResolvedValue([
      { type: 'GROUP', price: 300, capacity: 10, _count: { bookings: 8 } },
      { type: 'GROUP', price: 200, capacity: 10, _count: { bookings: 2 } },
      { type: 'PRIVATE', price: 800, capacity: 1, _count: { bookings: 1 } },
    ] as any);
    expect(await coachStats('k1', now)).toEqual({ bookingsNext7: 5, earnings30: 300 * 8 + 200 * 2 + 800, fillRate: 50 });
  });

  it('has no fill rate without past group sessions', async () => {
    vi.mocked(prisma.booking.count).mockResolvedValue(0);
    vi.mocked(prisma.session.findMany).mockResolvedValue([]);
    expect((await coachStats('k1', now)).fillRate).toBeNull();
  });
});

describe('listCoachClients', () => {
  it('groups bookings by member with a count and the last past visit, most recent first', async () => {
    const ali = { id: 'u1', name: 'Ali', email: 'a@x.com' };
    const mona = { id: 'u2', name: 'Mona', email: 'm@x.com' };
    vi.mocked(prisma.booking.findMany).mockResolvedValue([
      { member: ali, session: { startsAt: new Date(now.getTime() - 3 * day) } },
      { member: ali, session: { startsAt: new Date(now.getTime() + day) } },
      { member: mona, session: { startsAt: new Date(now.getTime() - day) } },
    ] as any);
    expect(await listCoachClients('k1', now)).toEqual([
      { member: mona, count: 1, lastVisit: new Date(now.getTime() - day) },
      { member: ali, count: 2, lastVisit: new Date(now.getTime() - 3 * day) },
    ]);
  });
});

describe('listMemberCoaches', () => {
  it('counts past sessions per coach', async () => {
    const coach = { id: 'k1', name: 'Mona', coachProfile: { photoPath: null, city: 'Cairo' } };
    vi.mocked(prisma.booking.findMany).mockResolvedValue([{ session: { coach } }, { session: { coach } }] as any);
    expect(await listMemberCoaches('u1', now)).toEqual([{ coach: { id: 'k1', name: 'Mona', photoPath: null, city: 'Cairo' }, count: 2 }]);
  });
});

describe('adminStats', () => {
  it('adds up members, active coaches, the next 7 days and 30 days of booked value', async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(40);
    vi.mocked(prisma.coachProfile.count).mockResolvedValue(6);
    vi.mocked(prisma.session.count).mockResolvedValue(12);
    vi.mocked(prisma.booking.findMany).mockResolvedValue([{ session: { price: 300 } }, { session: { price: 450 } }] as any);
    expect(await adminStats(now)).toEqual({ members: 40, activeCoaches: 6, sessionsNext7: 12, bookedValue30: 750 });
  });
});
