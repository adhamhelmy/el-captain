import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/prisma/models/booking', () => ({ bookSession: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn() }));
vi.mock('@/prisma/models/member', () => ({ setMemberLocale: vi.fn() }));
vi.mock('@/lib/email/session-emails', () => ({ sendBookingConfirmed: vi.fn() }));

import { POST } from './route';
import { bookSession } from '@/prisma/models/booking';
import { setMemberLocale } from '@/prisma/models/member';
import { findSession } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sendBookingConfirmed } from '@/lib/email/session-emails';
import { getServerSession } from 'next-auth';
const signInMember = () => vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER', email: 'u@x.com' } } as any);
import { sessionRow } from '@/test/sessions';

const params = { id: 'x1' };

beforeEach(() => {
  vi.clearAllMocks();
  signInMember();
  vi.mocked(findSession).mockResolvedValue(sessionRow() as any);
});

describe('POST /api/sessions/[id]/book', () => {
  it('books and remembers the member’s language', async () => {
    vi.mocked(bookSession).mockResolvedValue({ ok: true, newlyBooked: true });
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'x1', bookedByMe: true });
    expect(bookSession).toHaveBeenCalledWith('x1', 'u1');
    expect(setMemberLocale).toHaveBeenCalledWith('u1', 'en');
    expect(sendBookingConfirmed).toHaveBeenCalledWith({ id: 'u1', email: 'u@x.com', locale: 'en' }, expect.objectContaining({ id: 'x1' }));
  });

  it("doesn't email again when the member was already booked", async () => {
    vi.mocked(bookSession).mockResolvedValue({ ok: true, newlyBooked: false });
    await call(POST, { params, body: {} });
    expect(sendBookingConfirmed).not.toHaveBeenCalled();
  });

  it.each([
    ['full', 409, 'session_full'],
    ['closed', 409, 'session_closed'],
  ] as const)('answers %s with %i %s', async (reason, status, code) => {
    vi.mocked(bookSession).mockResolvedValue({ ok: false, reason });
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(status);
    expect(await res.json()).toMatchObject({ code });
  });

  it('returns 404 for an unknown session', async () => {
    vi.mocked(bookSession).mockResolvedValue({ ok: false, reason: 'missing' });
    expect((await call(POST, { params, body: {} })).status).toBe(404);
  });

  it('is for members only', async () => {
    signInAs('k1', 'COACH');
    expect((await call(POST, { params, body: {} })).status).toBe(403);
  });
});
