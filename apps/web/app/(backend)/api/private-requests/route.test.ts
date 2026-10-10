import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findActiveCoach: vi.fn() }));
vi.mock('@/prisma/models/private-request', () => ({ createRequest: vi.fn(), hasPendingRequest: vi.fn() }));
vi.mock('@/prisma/models/member', () => ({ setMemberLocale: vi.fn() }));
vi.mock('@/lib/email/session-emails', () => ({ sendPrivateRequested: vi.fn() }));

import { POST } from './route';
import { sendPrivateRequested } from '@/lib/email/session-emails';
import { findActiveCoach } from '@/prisma/models/coach-profile';
import { createRequest, hasPendingRequest } from '@/prisma/models/private-request';
import { call, signInAs } from '@/test/api';
import { requestRow } from '@/test/sessions';

const coach = {
  id: 'k1',
  email: 'k@x.com',
  coachProfile: { privatePrice: 800, privateDuration: 60, locale: 'en', sports: [{ sportId: 's1', sport: { status: 'APPROVED' } }] },
  venues: [{ id: 'v1' }],
};
const startsAt = new Date(Date.now() + 86_400_000).toISOString();
const body = { coachId: 'k1', venueId: 'v1', sportId: 's1', startsAt, message: ' Knee rehab ' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('u1', 'USER');
  vi.mocked(findActiveCoach).mockResolvedValue(coach as any);
  vi.mocked(hasPendingRequest).mockResolvedValue(false);
  vi.mocked(createRequest).mockResolvedValue(requestRow() as any);
});

describe('POST /api/private-requests', () => {
  it("sends a request with the coach's price and length, and emails the coach", async () => {
    const res = await call(POST, { body });
    expect(res.status).toBe(201);
    expect(createRequest).toHaveBeenCalledWith({
      memberId: 'u1',
      coachId: 'k1',
      venueId: 'v1',
      sportId: 's1',
      startsAt: new Date(startsAt),
      durationMin: 60,
      price: 800,
      message: 'Knee rehab',
    });
    expect(sendPrivateRequested).toHaveBeenCalledWith({ id: 'k1', email: 'k@x.com', locale: 'en' }, expect.objectContaining({ id: 'r1' }));
  });

  it("refuses when the coach hasn't set a private price", async () => {
    vi.mocked(findActiveCoach).mockResolvedValue({ ...coach, coachProfile: { ...coach.coachProfile, privatePrice: null } } as any);
    expect(await (await call(POST, { body })).json()).toMatchObject({ code: 'private_unavailable' });
  });

  it('refuses a second pending request to the same coach', async () => {
    vi.mocked(hasPendingRequest).mockResolvedValue(true);
    expect((await call(POST, { body })).status).toBe(409);
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("refuses a venue or sport that isn't the coach's, and a past time", async () => {
    const res = await call(POST, { body: { ...body, venueId: 'v9', sportId: 's9', startsAt: new Date(Date.now() - 1000).toISOString() } });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'invalid_session', fields: ['startsAt', 'venueId', 'sportId'] });
  });

  it('returns 404 for a coach who is not active', async () => {
    vi.mocked(findActiveCoach).mockResolvedValue(null);
    expect((await call(POST, { body })).status).toBe(404);
  });
});
