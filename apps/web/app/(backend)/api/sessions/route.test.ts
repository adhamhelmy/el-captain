import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/lib/server/coach-guard', () => ({ assertActiveCoach: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ listOpenSessions: vi.fn(), createGroupSessions: vi.fn() }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));

import { GET, POST } from './route';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { HttpError } from '@/lib/server/api';
import { findCoach } from '@/prisma/models/coach-profile';
import { createGroupSessions, listOpenSessions } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sessionRow } from '@/test/sessions';

const coach = {
  id: 'k1',
  coachProfile: {
    sports: [
      { sportId: 's1', sport: { status: 'APPROVED' } },
      { sportId: 's2', sport: { status: 'PENDING' } },
    ],
  },
  venues: [{ id: 'v1' }],
};
const body = {
  title: 'Sunrise Flow',
  sportId: 's1',
  venueId: 'v1',
  level: 'ALL_LEVELS',
  startsAt: new Date(Date.now() + 86_400_000).toISOString(),
  durationMin: 60,
  price: 350,
  capacity: 12,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findCoach).mockResolvedValue(coach as any);
  vi.mocked(createGroupSessions).mockResolvedValue([sessionRow()] as any);
});

describe('GET /api/sessions', () => {
  it('lists open sessions for anyone, with filters', async () => {
    signInAs(null);
    vi.mocked(listOpenSessions).mockResolvedValue([sessionRow()] as any);
    const res = await call(GET, { url: 'http://localhost/api/sessions?sport=s1&q=%20flow%20&coach=k1' });
    expect(await res.json()).toEqual([expect.objectContaining({ id: 'x1', booked: 3, venue: expect.objectContaining({ id: 'v1' }) })]);
    expect(listOpenSessions).toHaveBeenCalledWith({ sportId: 's1', q: 'flow', coachId: 'k1', from: undefined, to: undefined }, expect.anything());
  });
});

describe('POST /api/sessions', () => {
  beforeEach(() => signInAs('k1', 'COACH'));

  it('creates one session', async () => {
    const res = await call(POST, { body });
    expect(res.status).toBe(201);
    expect(createGroupSessions).toHaveBeenCalledWith(
      {
        coachId: 'k1',
        sportId: 's1',
        venueId: 'v1',
        level: 'ALL_LEVELS',
        title: 'Sunrise Flow',
        description: null,
        durationMin: 60,
        price: 350,
        capacity: 12,
      },
      [new Date(body.startsAt)],
    );
  });

  it('creates weekly copies', async () => {
    await call(POST, { body: { ...body, repeatWeeks: 3 } });
    expect(vi.mocked(createGroupSessions).mock.calls[0][1]).toHaveLength(3);
  });

  it('lists every field that breaks a rule', async () => {
    const res = await call(POST, { body: { ...body, title: '', capacity: 1, repeatWeeks: 13 } });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'invalid_session', fields: ['title', 'capacity', 'repeatWeeks'] });
    expect(createGroupSessions).not.toHaveBeenCalled();
  });

  it("refuses a sport that isn't the coach's approved sport, or a venue that isn't theirs", async () => {
    const res = await call(POST, { body: { ...body, sportId: 's2', venueId: 'v9' } });
    expect(await res.json()).toMatchObject({ code: 'invalid_session', fields: ['sportId', 'venueId'] });
  });

  it('needs an approved coach', async () => {
    vi.mocked(assertActiveCoach).mockRejectedValueOnce(new HttpError(403, 'Coach not approved', 'coach_not_active'));
    expect((await call(POST, { body })).status).toBe(403);
  });

  it('is for coaches only', async () => {
    signInAs('u1', 'USER');
    expect((await call(POST, { body })).status).toBe(403);
  });
});
