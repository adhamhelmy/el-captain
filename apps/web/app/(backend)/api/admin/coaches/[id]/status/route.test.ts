import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));
vi.mock('@/prisma/models/coach-status', () => ({ setCoachStatus: vi.fn() }));
vi.mock('@/lib/email/coach-emails', () => ({ sendCoachDecisionEmail: vi.fn() }));

import { POST } from './route';
import { findCoach } from '@/prisma/models/coach-profile';
import { setCoachStatus } from '@/prisma/models/coach-status';
import { sendCoachDecisionEmail } from '@/lib/email/coach-emails';
import { call, signInAs } from '@/test/api';

const params = { id: 'k1' };
const coachIn = (status: string) => ({ id: 'k1', email: 'k@x.com', name: 'Mona', coachProfile: { id: 'p1', status, locale: 'ar' } }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('a1', 'ADMIN');
  vi.mocked(findCoach).mockResolvedValue(coachIn('PENDING'));
  vi.mocked(setCoachStatus).mockResolvedValue(true);
});

describe('POST /api/admin/coaches/[id]/status', () => {
  it('is admin only', async () => {
    signInAs('k1', 'COACH');
    expect((await call(POST, { params, body: { to: 'ACTIVE' } })).status).toBe(403);
  });

  it('approves a pending coach and emails them in their language', async () => {
    const res = await call(POST, { params, body: { to: 'ACTIVE' } });
    expect(res.status).toBe(200);
    expect(setCoachStatus).toHaveBeenCalledWith('p1', { from: 'PENDING', to: 'ACTIVE', actorId: 'a1', reason: null });
    expect(sendCoachDecisionEmail).toHaveBeenCalledWith({ id: 'k1', email: 'k@x.com' }, 'ar', 'approved', null);
  });

  it('approves even while the coach has a sport waiting for review', async () => {
    expect((await call(POST, { params, body: { to: 'ACTIVE' } })).status).toBe(200);
  });

  it('needs a reason to reject, and sends it', async () => {
    const res = await call(POST, { params, body: { to: 'REJECTED', reason: '   ' } });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('reason_required');

    expect((await call(POST, { params, body: { to: 'REJECTED', reason: ' Blurry photo ' } })).status).toBe(200);
    expect(sendCoachDecisionEmail).toHaveBeenCalledWith(expect.anything(), 'ar', 'rejected', 'Blurry photo');
  });

  it('suspends with an optional reason and reinstates without an email', async () => {
    vi.mocked(findCoach).mockResolvedValue(coachIn('ACTIVE'));
    expect((await call(POST, { params, body: { to: 'SUSPENDED' } })).status).toBe(200);
    expect(sendCoachDecisionEmail).toHaveBeenCalledWith(expect.anything(), 'ar', 'suspended', null);

    vi.clearAllMocks();
    vi.mocked(setCoachStatus).mockResolvedValue(true);
    vi.mocked(findCoach).mockResolvedValue(coachIn('SUSPENDED'));
    expect((await call(POST, { params, body: { to: 'ACTIVE' } })).status).toBe(200);
    expect(sendCoachDecisionEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['INCOMPLETE', 'ACTIVE'],
    ['ACTIVE', 'REJECTED'],
    ['PENDING', 'BANANA'],
  ])('refuses %s → %s', async (from, to) => {
    vi.mocked(findCoach).mockResolvedValue(coachIn(from));
    const res = await call(POST, { params, body: { to } });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('invalid_status_transition');
  });

  it('answers 409 and sends nothing when another admin decided first', async () => {
    vi.mocked(setCoachStatus).mockResolvedValue(false);
    expect((await call(POST, { params, body: { to: 'ACTIVE' } })).status).toBe(409);
    expect(sendCoachDecisionEmail).not.toHaveBeenCalled();
  });

  it('falls back to English for a coach with no saved language', async () => {
    vi.mocked(findCoach).mockResolvedValue({ ...coachIn('PENDING'), coachProfile: { id: 'p1', status: 'PENDING', locale: null } });
    await call(POST, { params, body: { to: 'ACTIVE' } });
    expect(vi.mocked(sendCoachDecisionEmail).mock.calls[0][1]).toBe('en');
  });
});
