import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/bearer', () => ({ userFromBearer: vi.fn(async () => null) }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/prisma/models/payment', () => ({ markCash: vi.fn() }));

import { POST } from './route';
import { markCash } from '@/prisma/models/payment';
import { call, signInAs } from '@/test/api';

const params = { id: 'p1' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
});

describe('POST /api/payments/[id]/cash', () => {
  it.each([true, false])('the coach marks paid=%s', async (paid) => {
    vi.mocked(markCash).mockResolvedValue({ ok: true });
    const res = await call(POST, { params, body: { paid } });
    expect(await res.json()).toEqual({ status: paid ? 'PAID' : 'FAILED' });
    expect(markCash).toHaveBeenCalledWith('p1', 'k1', paid);
  });

  it('needs paid as true or false', async () => {
    expect((await call(POST, { params, body: { paid: 'yes' } })).status).toBe(400);
    expect(markCash).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', 404],
    ['forbidden', 403],
    ['early', 409],
  ] as const)('answers %s with %i', async (reason, status) => {
    vi.mocked(markCash).mockResolvedValue({ ok: false, reason });
    expect((await call(POST, { params, body: { paid: true } })).status).toBe(status);
  });

  it('is for coaches only', async () => {
    signInAs('u1', 'USER');
    expect((await call(POST, { params, body: { paid: true } })).status).toBe(403);
  });
});
