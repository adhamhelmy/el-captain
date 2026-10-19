import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/bearer', () => ({ userFromBearer: vi.fn(async () => null) }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p, blobInfo: vi.fn(), deleteBlob: vi.fn() }));
vi.mock('@/lib/server/coach-guard', () => ({ assertActiveCoach: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn(), updateSession: vi.fn(), countSessionsWithCover: vi.fn() }));
vi.mock('@/prisma/models/booking', () => ({ findBooking: vi.fn() }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));
vi.mock('@/prisma/models/media', () => ({ findMedia: vi.fn(), countMediaWithPath: vi.fn() }));

import { GET, PATCH } from './route';
import { findBooking } from '@/prisma/models/booking';
import { findCoach } from '@/prisma/models/coach-profile';
import { findSession, updateSession } from '@/prisma/models/session';
import { userFromBearer } from '@/lib/server/bearer';
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

  it('knows the mobile app member from their bearer token: booked, and allowed to see their private session', async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ type: 'PRIVATE', capacity: 1 }) as any);
    signInAs(null);
    vi.mocked(userFromBearer).mockResolvedValue({ id: 'u1', role: 'USER' } as any);
    vi.mocked(findBooking).mockResolvedValue({ status: 'CONFIRMED' } as any);
    const res = await call(GET, { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ bookedByMe: true });
    expect(findBooking).toHaveBeenCalledWith('x1', 'u1');
    vi.mocked(userFromBearer).mockResolvedValue(null);
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

  it('changes or removes the cover, even once members have booked', async () => {
    const { blobInfo } = await import('@/lib/server/blob');
    vi.mocked(blobInfo).mockResolvedValue({ contentType: 'image/png', size: 10 });
    await call(PATCH, { params, body: { coverPath: 'coaches/k1/sessions/new.png' } });
    expect(updateSession).toHaveBeenLastCalledWith('x1', { coverPath: 'coaches/k1/sessions/new.png' });
    await call(PATCH, { params, body: { coverPath: null } });
    expect(updateSession).toHaveBeenLastCalledWith('x1', { coverPath: null });
  });

  it('deletes the old cover file once nothing else uses it', async () => {
    const { blobInfo, deleteBlob } = await import('@/lib/server/blob');
    const { countSessionsWithCover } = await import('@/prisma/models/session');
    const { countMediaWithPath } = await import('@/prisma/models/media');
    vi.mocked(blobInfo).mockResolvedValue({ contentType: 'image/png', size: 10 });
    vi.mocked(findSession).mockResolvedValue(sessionRow({ coverPath: 'coaches/k1/sessions/old.png' }) as any);
    vi.mocked(countSessionsWithCover).mockResolvedValue(0);
    vi.mocked(countMediaWithPath).mockResolvedValue(0);
    await call(PATCH, { params, body: { coverPath: 'coaches/k1/sessions/new.png' } });
    expect(deleteBlob).toHaveBeenCalledWith('coaches/k1/sessions/old.png');

    vi.mocked(deleteBlob).mockClear();
    vi.mocked(countMediaWithPath).mockResolvedValue(1);
    await call(PATCH, { params, body: { coverPath: null } });
    expect(deleteBlob).not.toHaveBeenCalled();

    vi.mocked(countMediaWithPath).mockResolvedValue(0);
    await call(PATCH, { params, body: { title: 'Evening Flow' } });
    expect(deleteBlob).not.toHaveBeenCalled();
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
