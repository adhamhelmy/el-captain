import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/insights', () => ({ adminStats: vi.fn(), recentBookings: vi.fn() }));

import { GET } from './route';
import { GET as RECENT } from '../bookings/route';
import { adminStats, recentBookings } from '@/prisma/models/insights';
import { call, signInAs } from '@/test/api';

beforeEach(() => vi.clearAllMocks());

describe('admin numbers', () => {
  it('returns the dashboard numbers and recent bookings to admins only', async () => {
    signInAs('a1', 'ADMIN');
    vi.mocked(adminStats).mockResolvedValue({ members: 40, activeCoaches: 6, sessionsNext7: 12, bookedValue30: 750 });
    vi.mocked(recentBookings).mockResolvedValue([
      {
        id: 'b1',
        createdAt: new Date(0),
        member: { id: 'u1', name: 'Ali' },
        session: { id: 'x1', title: 'Flow', type: 'GROUP', sport: { id: 's1', nameEn: 'Yoga', nameAr: null, status: 'APPROVED' } },
      },
    ] as any);
    expect(await (await call(GET)).json()).toEqual({ members: 40, activeCoaches: 6, sessionsNext7: 12, bookedValue30: 750 });
    expect(await (await call(RECENT)).json()).toEqual([expect.objectContaining({ id: 'b1', member: { id: 'u1', name: 'Ali' } })]);
    signInAs('k1', 'COACH');
    expect((await call(GET)).status).toBe(403);
    expect((await call(RECENT)).status).toBe(403);
  });
});
