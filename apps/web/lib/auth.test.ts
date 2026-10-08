import { beforeEach, describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('@/prisma/models/user', () => ({ findUserByEmail: vi.fn() }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn() }));

import { authOptions } from './auth';
import { ERROR_CODES } from './error-codes';
import { findUserByEmail } from '@/prisma/models/user';
import { findCoachStatus } from '@/prisma/models/coach-profile';

describe('authOptions', () => {
  it('uses jwt session strategy', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
  });

  it('has credentials provider', () => {
    expect(authOptions.providers).toHaveLength(1);
    expect(authOptions.providers[0].id).toBe('credentials');
  });

  it('redirects sign-in to /login', () => {
    expect(authOptions.pages?.signIn).toBe('/login');
  });
});

describe('credentials authorize', () => {
  const authorize = (authOptions.providers[0] as any).options.authorize as (c: object) => Promise<unknown>;

  beforeEach(async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: 'u1',
      name: 'A',
      email: 'a@b.com',
      role: 'USER',
      passwordHash: await bcrypt.hash('password123', 4),
      emailVerified: new Date(),
    } as any);
  });

  it('signs in with the right password, matching the email case-insensitively', async () => {
    expect(await authorize({ email: ' A@B.com', password: 'password123' })).toMatchObject({ id: 'u1' });
    expect(findUserByEmail).toHaveBeenCalledWith('a@b.com');
  });

  it('rejects an invalid email without looking it up', async () => {
    vi.mocked(findUserByEmail).mockClear();
    expect(await authorize({ email: 'nope', password: 'password123' })).toBeNull();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  it('rejects a wrong password', async () => {
    expect(await authorize({ email: 'a@b.com', password: 'nope' })).toBeNull();
  });

  it('refuses an unverified email only once the password matched', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: 'u1',
      passwordHash: await bcrypt.hash('password123', 4),
      emailVerified: null,
    } as any);
    await expect(authorize({ email: 'a@b.com', password: 'password123' })).rejects.toThrow(ERROR_CODES.EMAIL_NOT_VERIFIED);
    expect(await authorize({ email: 'a@b.com', password: 'wrong' })).toBeNull();
  });
});

describe('jwt callback coach status', () => {
  const jwt = authOptions.callbacks!.jwt! as (a: any) => Promise<any>;
  const session = authOptions.callbacks!.session! as (a: any) => Promise<any>;
  beforeEach(() => vi.mocked(findCoachStatus).mockReset());

  it('reads the status when a coach signs in', async () => {
    vi.mocked(findCoachStatus).mockResolvedValue('INCOMPLETE');
    const token = await jwt({ token: {}, user: { id: 'k1', role: 'COACH' } });
    expect(token).toMatchObject({ id: 'k1', role: 'COACH', coachStatus: 'INCOMPLETE' });
    expect(findCoachStatus).toHaveBeenCalledWith('k1');
  });

  it('re-reads a non-active status on every refresh', async () => {
    vi.mocked(findCoachStatus).mockResolvedValue('ACTIVE');
    const token = await jwt({ token: { id: 'k1', role: 'COACH', coachStatus: 'PENDING', coachStatusCheckedAt: Date.now() } });
    expect(token.coachStatus).toBe('ACTIVE');
  });

  it('keeps a fresh active status without a query, and re-reads it after 5 minutes', async () => {
    const fresh = { id: 'k1', role: 'COACH', coachStatus: 'ACTIVE', coachStatusCheckedAt: Date.now() };
    expect((await jwt({ token: { ...fresh } })).coachStatus).toBe('ACTIVE');
    expect(findCoachStatus).not.toHaveBeenCalled();

    vi.mocked(findCoachStatus).mockResolvedValue('SUSPENDED');
    const stale = { ...fresh, coachStatusCheckedAt: Date.now() - 5 * 60 * 1000 - 1 };
    expect((await jwt({ token: stale })).coachStatus).toBe('SUSPENDED');
  });

  it('never queries for other roles', async () => {
    await jwt({ token: {}, user: { id: 'u1', role: 'USER' } });
    expect(findCoachStatus).not.toHaveBeenCalled();
  });

  it('exposes the status on the session', async () => {
    const s = await session({ session: { user: {} }, token: { id: 'k1', role: 'COACH', coachStatus: 'PENDING' } });
    expect(s.user).toMatchObject({ id: 'k1', role: 'COACH', coachStatus: 'PENDING' });
  });
});
