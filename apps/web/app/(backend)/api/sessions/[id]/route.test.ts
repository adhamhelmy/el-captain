import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/lib/server/coach-guard', () => ({ assertActiveCoach: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn(), updateSession: vi.fn() }));
vi.mock('@/prisma/models/booking', () => ({ findBooking: vi.fn() }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));

import { GET, PATCH } from './route';
import { findBooking } from '@/prisma/models/booking';
import { findCoach } from '@/prisma/models/coach-profile';
import { findSession, updateSession } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sessionRow } from '@/test/sessions';

const params = { id: 'x1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findSession).mockResolvedValue(sessionRow() as any);
  vi.mocked(updateSession).mockResolvedValue(sessionRow() as any);
  vi.mocked(findBooking).mockResolvedValue(null);
  vi.mocked(findCoach).mockResolvedValue({
    id: 'k1',
    coachProfile: { sports: [{ sportId: 's1', sport: { status: 'APPROVED' } }] },
    venues: [{ id: 'v1' }, { id: 'v2' }],
  } as any);
});

describe('GET /api/sessions/[id]', () => {
  it('shows a group session to a guest', async () => {
    signInAs(null);
    expect(await (await call(GET, { params })).json()).toMatchObject({ id: 'x1', booked: 3, bookedByMe: false });
  });

  it('tells a member they are booked', async () => {
    signInAs('u1', 'USER');
    vi.mocked(findBooking).mockResolvedValue({ status: 'CONFIRMED' } as any);
    expect(await (await call(GET, { params })).json()).toMatchObject({ bookedByMe: true });
  });

  it('hides a private session from everyone but its coach, its member and admins', async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ type: 'PRIVATE', capacity: 1 }) as any);
    signInAs(null);
    expect((await call(GET, { params })).status).toBe(404);
    signInAs('u2', 'USER');
    expect((await call(GET, { params })).status).toBe(404);
    signInAs('k1', 'COACH');
    expect((await call(GET, { params })).status).toBe(200);
    signInAs('a1', 'ADMIN');
    expect((await call(GET, { params })).status).toBe(200);
    signInAs('u1', 'USER');
    vi.mocked(findBooking).mockResolvedValue({ status: 'CONFIRMED' } as any);
    expect((await call(GET, { params })).status).toBe(200);
  });

  it("hides a suspended coach's group session from guests and new members, not from its booked members", async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ coach: { id: 'k1', name: 'Mona', coachProfile: { photoPath: null, status: 'SUSPENDED' } } }) as any);
    signInAs(null);
    expect((await call(GET, { params })).status).toBe(404);
    signInAs('u1', 'USER');
    vi.mocked(findBooking).mockResolvedValue({ status: 'CONFIRMED' } as any);
    expect((await call(GET, { params })).status).toBe(200);
  });

  it('returns 404 for an unknown id', async () => {
    vi.mocked(findSession).mockResolvedValue(null);
    expect((await call(GET, { params })).status).toBe(404);
  });
});

describe('PATCH /api/sessions/[id]', () => {
  beforeEach(() => signInAs('k1', 'COACH'));

  it('saves only what changed', async () => {
    const res = await call(PATCH, { params, body: { title: 'Evening Flow', price: 400 } });
    expect(res.status).toBe(200);
    expect(updateSession).toHaveBeenCalledWith('x1', { title: 'Evening Flow', price: 400 });
  });

  it('lets an unbooked session move to another time and venue', async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ _count: { bookings: 0 } }) as any);
    const startsAt = new Date(Date.now() + 2 * 86_400_000).toISOString();
    await call(PATCH, { params, body: { startsAt, venueId: 'v2' } });
    expect(updateSession).toHaveBeenCalledWith('x1', { startsAt: new Date(startsAt), venueId: 'v2' });
  });

  it('locks the time, venue and length once anyone is booked', async () => {
    const startsAt = new Date(Date.now() + 2 * 86_400_000).toISOString();
    const res = await call(PATCH, { params, body: { startsAt, venueId: 'v2', durationMin: 90 } });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'invalid_session', fields: ['venueId', 'startsAt', 'durationMin'] });
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("won't drop capacity below the bookings", async () => {
    const res = await call(PATCH, { params, body: { capacity: 2 } });
    expect(await res.json()).toMatchObject({ code: 'invalid_session', fields: ['capacity'] });
  });

  it("refuses another coach's session", async () => {
    signInAs('k2', 'COACH');
    expect((await call(PATCH, { params, body: { title: 'x' } })).status).toBe(403);
  });

  it('refuses a session that started or was cancelled', async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ status: 'CANCELLED' }) as any);
    expect(await (await call(PATCH, { params, body: { title: 'x' } })).json()).toMatchObject({ code: 'session_closed' });
    vi.mocked(findSession).mockResolvedValue(sessionRow({ startsAt: new Date(Date.now() - 1000) }) as any);
    expect((await call(PATCH, { params, body: { title: 'x' } })).status).toBe(409);
  });
});
