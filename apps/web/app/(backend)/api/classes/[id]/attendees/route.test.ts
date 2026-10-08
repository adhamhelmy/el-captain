import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/class', () => ({ findClass: vi.fn() }));
vi.mock('@/prisma/models/booking', () => ({ listClassAttendees: vi.fn() }));
vi.mock('@/lib/coach-guard', () => ({ assertActiveCoach: vi.fn() }));

import { GET } from './route';
import { findClass } from '@/prisma/models/class';
import { listClassAttendees } from '@/prisma/models/booking';
import { call, signInAs } from '@/test/api';

const params = { id: 'c1' };

beforeEach(() => vi.clearAllMocks());

describe('GET /api/classes/[id]/attendees', () => {
  it('returns 403 for a USER', async () => {
    signInAs('u1', 'USER');
    expect((await call(GET, { params })).status).toBe(403);
  });

  it('returns 404 when the class does not exist', async () => {
    signInAs('host', 'COACH');
    vi.mocked(findClass).mockResolvedValue(null);
    expect((await call(GET, { params })).status).toBe(404);
  });

  it("returns 403 for another host's class", async () => {
    signInAs('other', 'COACH');
    vi.mocked(findClass).mockResolvedValue({ id: 'c1', clientId: 'host' } as any);
    expect((await call(GET, { params })).status).toBe(403);
    expect(listClassAttendees).not.toHaveBeenCalled();
  });

  it('lists who booked the host’s class', async () => {
    signInAs('host', 'COACH');
    vi.mocked(findClass).mockResolvedValue({ id: 'c1', clientId: 'host' } as any);
    vi.mocked(listClassAttendees).mockResolvedValue([
      { id: 'b1', createdAt: new Date('2026-01-01'), user: { id: 'u1', name: 'Ali', email: 'a@x.com' } },
    ] as any);
    const res = await call(GET, { params });
    expect(await res.json()).toEqual([{ bookingId: 'b1', userId: 'u1', name: 'Ali', email: 'a@x.com', bookedAt: '2026-01-01T00:00:00.000Z' }]);
  });
});
