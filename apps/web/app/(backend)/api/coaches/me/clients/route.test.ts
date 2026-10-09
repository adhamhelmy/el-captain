import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/prisma/models/insights', () => ({ listCoachClients: vi.fn() }));

import { GET } from './route';
import { findCoachStatus } from '@/prisma/models/coach-profile';
import { listCoachClients } from '@/prisma/models/insights';
import { call, signInAs } from '@/test/api';

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
  vi.mocked(listCoachClients).mockResolvedValue([]);
});

describe('GET /api/coaches/me/clients', () => {
  it("lists the coach's clients", async () => {
    expect((await call(GET)).status).toBe(200);
    expect(listCoachClients).toHaveBeenCalledWith('k1');
  });

  it('refuses a suspended coach', async () => {
    vi.mocked(findCoachStatus).mockResolvedValueOnce('SUSPENDED');
    const res = await call(GET);
    expect(res.status).toBe(403);
    expect(listCoachClients).not.toHaveBeenCalled();
  });
});
