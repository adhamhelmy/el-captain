import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/booking', () => ({ expireHolds: vi.fn() }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/prisma/models/session', () => ({
  listCoachSessions: vi.fn(),
  listCoachSessionsBetween: vi.fn(),
  listMemberSessions: vi.fn(),
  MAX_RANGE_DAYS: 31,
}));

import { GET } from './route';
import { listCoachSessions, listCoachSessionsBetween, listMemberSessions } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sessionRow } from '@/test/sessions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listCoachSessions).mockResolvedValue([sessionRow()] as any);
  vi.mocked(listMemberSessions).mockResolvedValue([sessionRow()] as any);
  vi.mocked(listCoachSessionsBetween).mockResolvedValue([sessionRow(), sessionRow({ id: 's2' })] as any);
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

  it('gives a coach every session in a date range, however many come before it', async () => {
    signInAs('k1', 'COACH');
    const res = await call(GET, { url: 'http://localhost/api/sessions/me?from=2026-12-04T22:00:00Z&to=2026-12-11T22:00:00Z' });
    expect(await res.json()).toHaveLength(2);
    expect(listCoachSessionsBetween).toHaveBeenCalledWith('k1', new Date('2026-12-04T22:00:00Z'), new Date('2026-12-11T22:00:00Z'));
    expect(listCoachSessions).not.toHaveBeenCalled();
  });

  it('refuses a range that is backwards, half given or longer than a month', async () => {
    signInAs('k1', 'COACH');
    for (const q of ['from=2026-12-11&to=2026-12-04', 'from=2026-12-04', 'from=2026-01-01&to=2026-03-01']) {
      expect((await call(GET, { url: `http://localhost/api/sessions/me?${q}` })).status).toBe(400);
    }
    expect(listCoachSessionsBetween).not.toHaveBeenCalled();
  });
});
