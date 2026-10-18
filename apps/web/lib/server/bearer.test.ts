import { beforeEach, describe, it, expect, vi } from 'vitest';

vi.mock('@/prisma/models/user', () => ({ findAccess: vi.fn() }));

import { issueToken, userFromBearer } from './bearer';
import { HttpError } from './api';
import { findAccess } from '@/prisma/models/user';

process.env.NEXTAUTH_SECRET = 'test-secret';

const user = { id: 'u1', name: 'A', email: 'a@b.com', role: 'USER' as const };
const withBearer = (token: string) => new Request('http://localhost/api', { headers: { authorization: `Bearer ${token}` } });
const access = (over: object = {}) =>
  vi.mocked(findAccess).mockResolvedValue({ suspended: false, coachStatus: null, passwordChangedAt: null, ...over });

describe('userFromBearer', () => {
  beforeEach(() => access());

  it('is null when the request has no bearer token', async () => {
    expect(await userFromBearer(new Request('http://localhost/api'))).toBeNull();
  });

  it('reads back the user a token was issued for', async () => {
    const got = await userFromBearer(withBearer(await issueToken(user)));
    expect(got).toMatchObject(user);
  });

  it('re-reads the coach status on every request', async () => {
    access({ coachStatus: 'ACTIVE' });
    const got = await userFromBearer(withBearer(await issueToken({ ...user, role: 'COACH' })));
    expect(got?.coachStatus).toBe('ACTIVE');
  });

  it('marks a suspended account so protect() can answer 403', async () => {
    access({ suspended: true });
    expect((await userFromBearer(withBearer(await issueToken(user))))?.suspended).toBe(true);
  });

  it('answers 401 for a token that is not ours', async () => {
    await expect(userFromBearer(withBearer('garbage'))).rejects.toMatchObject({ status: 401 });
  });

  it('answers 401 for a token issued before the last password change', async () => {
    const token = await issueToken(user);
    access({ passwordChangedAt: Date.now() + 1000 });
    const err = await userFromBearer(withBearer(token)).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(401);
  });
});
