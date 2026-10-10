import { describe, it, expect, vi } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/prisma/models/private-request', () => ({ countPendingRequests: vi.fn(async () => 3) }));

import { GET } from './route';
import { countPendingRequests } from '@/prisma/models/private-request';
import { call, signInAs } from '@/test/api';

describe('GET /api/private-requests/me/pending', () => {
  it("counts the coach's unanswered requests", async () => {
    signInAs('k1', 'COACH');
    expect(await (await call(GET)).json()).toEqual({ count: 3 });
    expect(countPendingRequests).toHaveBeenCalledWith('k1');
  });

  it('is for coaches only', async () => {
    signInAs('u1', 'USER');
    expect((await call(GET)).status).toBe(403);
  });
});
