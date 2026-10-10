import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/prisma/models/insights', () => ({ coachStats: vi.fn() }));

import { GET } from './route';
import { coachStats } from '@/prisma/models/insights';
import { call, signInAs } from '@/test/api';

beforeEach(() => vi.clearAllMocks());

describe('GET /api/coaches/me/stats', () => {
  it("returns the coach's numbers", async () => {
    signInAs('k1', 'COACH');
    vi.mocked(coachStats).mockResolvedValue({ bookingsNext7: 5, earnings30: 3600, fillRate: 50 });
    expect(await (await call(GET)).json()).toEqual({ bookingsNext7: 5, earnings30: 3600, fillRate: 50 });
    expect(coachStats).toHaveBeenCalledWith('k1');
  });

  it('is for coaches only', async () => {
    signInAs('u1', 'USER');
    expect((await call(GET)).status).toBe(403);
  });
});
