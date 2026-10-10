import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/prisma/models/booking', () => ({ listAttendees: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn() }));

import { GET } from './route';
import { listAttendees } from '@/prisma/models/booking';
import { findSession } from '@/prisma/models/session';
import { findCoachStatus } from '@/prisma/models/coach-profile';
import { call, signInAs } from '@/test/api';
import { sessionRow } from '@/test/sessions';

const params = { id: 'x1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findSession).mockResolvedValue(sessionRow() as any);
  vi.mocked(listAttendees).mockResolvedValue([{ id: 'b1', createdAt: new Date(0), member: { id: 'u1', name: 'Ali', email: 'a@x.com' } }] as any);
});

describe('GET /api/sessions/[id]/attendees', () => {
  it('lists bookings for the coach and admins', async () => {
    signInAs('k1', 'COACH');
    expect(await (await call(GET, { params })).json()).toEqual([
      { bookingId: 'b1', memberId: 'u1', name: 'Ali', email: 'a@x.com', bookedAt: new Date(0).toISOString() },
    ]);
    signInAs('a1', 'ADMIN');
    expect((await call(GET, { params })).status).toBe(200);
  });

  it('is hidden from other coaches and members', async () => {
    signInAs('k2', 'COACH');
    expect((await call(GET, { params })).status).toBe(403);
    signInAs('u1', 'USER');
    expect((await call(GET, { params })).status).toBe(403);
  });

  it('refuses a suspended coach', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(findCoachStatus).mockResolvedValueOnce('SUSPENDED');
    const res = await call(GET, { params });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'coach_not_active' });
  });
});
