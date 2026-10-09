import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/prisma/models/session', () => ({ listCoachSessions: vi.fn(), listMemberSessions: vi.fn() }));

import { GET } from './route';
import { listCoachSessions, listMemberSessions } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sessionRow } from '@/test/sessions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listCoachSessions).mockResolvedValue([sessionRow()] as any);
  vi.mocked(listMemberSessions).mockResolvedValue([sessionRow()] as any);
});

describe('GET /api/sessions/me', () => {
  it("lists a coach's own upcoming sessions by default", async () => {
    signInAs('k1', 'COACH');
    expect(await (await call(GET)).json()).toHaveLength(1);
    expect(listCoachSessions).toHaveBeenCalledWith('k1', 'upcoming', expect.anything());
  });

  it("lists a member's past bookings", async () => {
    signInAs('u1', 'USER');
    await call(GET, { url: 'http://localhost/api/sessions/me?when=past' });
    expect(listMemberSessions).toHaveBeenCalledWith('u1', 'past', expect.anything());
  });

  it('is not for admins', async () => {
    signInAs('a1', 'ADMIN');
    expect((await call(GET)).status).toBe(403);
  });
});
