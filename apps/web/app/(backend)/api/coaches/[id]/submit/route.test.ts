import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));
vi.mock('@/prisma/models/coach-status', () => ({ setCoachStatus: vi.fn() }));
vi.mock('@/prisma/models/user', () => ({ listAdminEmails: vi.fn() }));
vi.mock('@/lib/email/coach-emails', () => ({ sendCoachSubmittedEmail: vi.fn() }));

import { POST } from './route';
import { findCoach } from '@/prisma/models/coach-profile';
import { setCoachStatus } from '@/prisma/models/coach-status';
import { listAdminEmails } from '@/prisma/models/user';
import { sendCoachSubmittedEmail } from '@/lib/email/coach-emails';
import { call, signInAs } from '@/test/api';

const params = { id: 'k1' };
const complete = {
  id: 'p1',
  status: 'INCOMPLETE',
  photoPath: 'coaches/k1/photo/a.jpg',
  bio: 'x'.repeat(60),
  instagram: 'https://www.instagram.com/m',
  tiktok: 'https://www.tiktok.com/@m',
  sports: [{ sport: {} }],
};
const coachWith = (p: object) => ({ id: 'k1', name: 'Mona', coachProfile: { ...complete, ...p } }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
  vi.mocked(findCoach).mockResolvedValue(coachWith({}));
  vi.mocked(setCoachStatus).mockResolvedValue(true);
  vi.mocked(listAdminEmails).mockResolvedValue(['a@x.com']);
});

describe('POST /api/coaches/[id]/submit', () => {
  it('submits a complete profile, records the language and tells the admins', async () => {
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'PENDING' });
    expect(setCoachStatus).toHaveBeenCalledWith('p1', { from: 'INCOMPLETE', to: 'PENDING', actorId: 'k1', locale: expect.any(String) });
    expect(sendCoachSubmittedEmail).toHaveBeenCalledWith(['a@x.com'], { id: 'k1', name: 'Mona' });
  });

  it('accepts a profile without Instagram or TikTok', async () => {
    vi.mocked(findCoach).mockResolvedValue(coachWith({ instagram: null, tiktok: null }));
    expect((await call(POST, { params, body: {} })).status).toBe(200);
  });

  it('lets a rejected coach resubmit', async () => {
    vi.mocked(findCoach).mockResolvedValue(coachWith({ status: 'REJECTED' }));
    expect((await call(POST, { params, body: {} })).status).toBe(200);
    expect(vi.mocked(setCoachStatus).mock.calls[0][1]).toMatchObject({ from: 'REJECTED', to: 'PENDING' });
  });

  it('lists what is missing', async () => {
    vi.mocked(findCoach).mockResolvedValue(coachWith({ photoPath: null, sports: [] }));
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'profile_incomplete', missing: ['photo', 'sports'] });
    expect(setCoachStatus).not.toHaveBeenCalled();
  });

  it('refuses a coach who is already pending or active, and another coach', async () => {
    vi.mocked(findCoach).mockResolvedValue(coachWith({ status: 'ACTIVE' }));
    expect((await call(POST, { params, body: {} })).status).toBe(409);
    signInAs('k2', 'COACH');
    expect((await call(POST, { params, body: {} })).status).toBe(403);
  });

  it('answers 409 without emailing when the status changed underneath', async () => {
    vi.mocked(setCoachStatus).mockResolvedValue(false);
    expect((await call(POST, { params, body: {} })).status).toBe(409);
    expect(sendCoachSubmittedEmail).not.toHaveBeenCalled();
  });
});
