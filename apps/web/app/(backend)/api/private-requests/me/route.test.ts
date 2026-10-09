import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/prisma/models/private-request', () => ({ listMemberRequests: vi.fn(), listCoachRequests: vi.fn() }));

import { GET } from './route';
import { listCoachRequests, listMemberRequests } from '@/prisma/models/private-request';
import { call, signInAs } from '@/test/api';
import { requestRow } from '@/test/sessions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listMemberRequests).mockResolvedValue([requestRow({ startsAt: new Date(Date.now() - 1000) })] as any);
  vi.mocked(listCoachRequests).mockResolvedValue([requestRow()] as any);
});

describe('GET /api/private-requests/me', () => {
  it("shows a member's sent requests, reporting a passed pending one as expired", async () => {
    signInAs('u1', 'USER');
    expect(await (await call(GET)).json()).toEqual([expect.objectContaining({ id: 'r1', status: 'EXPIRED' })]);
    expect(listMemberRequests).toHaveBeenCalledWith('u1');
  });

  it("shows a coach's received requests", async () => {
    signInAs('k1', 'COACH');
    expect(await (await call(GET)).json()).toEqual([expect.objectContaining({ status: 'PENDING' })]);
    expect(listCoachRequests).toHaveBeenCalledWith('k1');
  });
});
