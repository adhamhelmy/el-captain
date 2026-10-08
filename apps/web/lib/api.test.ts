import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { assertAllowed, assertFound, assertNoConflict, assertValid, protect, publicRoute } from './api';

const signIn = (user: object | null) => vi.mocked(getServerSession).mockResolvedValue(user && ({ user } as any));

const call = (route: ReturnType<typeof publicRoute<any>>, params = {}) =>
  route(new Request('http://localhost/api/x') as any, { params: Promise.resolve(params) });

const ok = vi.fn(async () => Response.json({ ok: true }));

describe('protect', () => {
  beforeEach(() => vi.clearAllMocks());

  it('answers 401 when nobody is signed in', async () => {
    signIn(null);
    expect((await call(protect(ok))).status).toBe(401);
    expect(ok).not.toHaveBeenCalled();
  });

  it('lets any signed-in user through when no roles are given', async () => {
    signIn({ id: 'u1', role: 'USER' });
    expect((await call(protect(ok))).status).toBe(200);
  });

  it('answers 403 when the role is not allowed', async () => {
    signIn({ id: 'u1', role: 'USER' });
    expect((await call(protect(ok, ['ADMIN']))).status).toBe(403);
    expect(ok).not.toHaveBeenCalled();
  });

  it('calls the handler with the params and the signed-in user', async () => {
    signIn({ id: 'u1', role: 'ADMIN' });
    expect((await call(protect(ok, ['ADMIN']), { id: 'r1' })).status).toBe(200);
    expect(ok).toHaveBeenCalledWith(expect.objectContaining({ params: { id: 'r1' }, user: { id: 'u1', role: 'ADMIN' } }));
  });

  it('answers 404 when the handler asserts a missing record', async () => {
    signIn({ id: 'u1', role: 'USER' });
    const route = protect(async () => {
      assertFound(null);
      return ok();
    });
    expect((await call(route)).status).toBe(404);
  });

  it('answers 403 when the handler asserts the user is not allowed', async () => {
    signIn({ id: 'u1', role: 'USER' });
    const route = protect(async ({ user }) => {
      assertAllowed(user.id === 'u2');
      return ok();
    });
    expect((await call(route)).status).toBe(403);
  });

  it('rethrows errors that are not HttpErrors', async () => {
    signIn({ id: 'u1', role: 'USER' });
    const route = protect(async () => {
      throw new Error('boom');
    });
    await expect(call(route)).rejects.toThrow('boom');
  });
});

describe('publicRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('runs the handler without a session', async () => {
    expect((await call(publicRoute(ok))).status).toBe(200);
    expect(getServerSession).not.toHaveBeenCalled();
  });

  it('answers 400 with the code when the handler asserts invalid input', async () => {
    const res = await call(
      publicRoute(async () => {
        assertValid(false, 'Bad', 'bad_input');
        return ok();
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Bad', code: 'bad_input' });
  });

  it('answers 409 when the handler asserts a conflict', async () => {
    const res = await call(
      publicRoute(async () => {
        assertNoConflict(false, 'Taken');
        return ok();
      }),
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'Taken' });
  });

  it('adds the details to the error body', async () => {
    const res = await call(
      publicRoute(async () => {
        assertValid(false, 'Incomplete', 'profile_incomplete', { missing: ['photo'] });
        return ok();
      }),
    );
    expect(await res.json()).toEqual({ error: 'Incomplete', code: 'profile_incomplete', missing: ['photo'] });
    const conflict = await call(
      publicRoute(async () => {
        assertNoConflict(false, 'Exists', 'sport_exists', { sport: { id: 's1' } });
        return ok();
      }),
    );
    expect(await conflict.json()).toEqual({ error: 'Exists', code: 'sport_exists', sport: { id: 's1' } });
  });

  it('answers 404 with a custom message', async () => {
    const res = await call(
      publicRoute(async () => {
        assertFound(null, 'Class not found');
        return ok();
      }),
    );
    expect(await res.json()).toEqual({ error: 'Class not found' });
  });
});

describe('query and page', () => {
  const seen = vi.fn();
  const route = publicRoute(async ({ query, page }) => {
    seen({ q: query.get('q'), missing: query.get('missing'), types: query.getAll('type'), page });
    return ok();
  });
  const at = (search: string) => route(new Request(`http://localhost/api/x${search}`) as any, { params: Promise.resolve({}) });

  beforeEach(() => vi.clearAllMocks());

  it('reads values, with undefined for missing ones', async () => {
    await at('?q=yoga&type=a&type=b');
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ q: 'yoga', missing: undefined, types: ['a', 'b'] }));
  });

  it('defaults to the first page', async () => {
    await at('');
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ page: { take: 12, skip: 0 } }));
  });

  it('reads limit and offset', async () => {
    await at('?limit=5&offset=10');
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ page: { take: 5, skip: 10 } }));
  });

  it('caps the limit and ignores invalid or negative values', async () => {
    await at('?limit=500&offset=-3');
    expect(seen).toHaveBeenLastCalledWith(expect.objectContaining({ page: { take: 50, skip: 0 } }));
    await at('?limit=abc&offset=xyz');
    expect(seen).toHaveBeenLastCalledWith(expect.objectContaining({ page: { take: 12, skip: 0 } }));
  });
});
