import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/prisma/models/insights', () => ({ findCoachClient: vi.fn() }));

import { GET } from './route';
import { findCoachClient } from '@/prisma/models/insights';
import { findCoachStatus } from '@/prisma/models/coach-profile';
import { call, signInAs } from '@/test/api';
import { sessionRow } from '@/test/sessions';

const params = { memberId: 'u1' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
});

describe('GET /api/coaches/me/clients/[memberId]', () => {
  it('returns the member and their sessions with this coach', async () => {
    vi.mocked(findCoachClient).mockResolvedValue({
      member: { id: 'u1', name: 'Ali', email: 'a@x.com', phone: null, createdAt: new Date(0) },
      sessions: [sessionRow()],
    } as any);
    const json = await (await call(GET, { params })).json();
    expect(json).toMatchObject({ member: { id: 'u1' }, sessions: [{ id: 'x1' }] });
    expect(findCoachClient).toHaveBeenCalledWith('k1', 'u1');
  });

  it('returns 404 for a member who never booked this coach', async () => {
    vi.mocked(findCoachClient).mockResolvedValue(null);
    expect((await call(GET, { params })).status).toBe(404);
  });

  it('refuses a suspended coach, so member contact details stay hidden', async () => {
    vi.mocked(findCoachStatus).mockResolvedValueOnce('SUSPENDED');
    const res = await call(GET, { params });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'coach_not_active' });
  });
});
