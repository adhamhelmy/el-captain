import { api, ApiError } from '@/api/client';
import { noticeOf, restoreSession, signIn, signOut, TOKEN_KEY, USER_KEY } from './session';

jest.mock('@/lib/storage', () => {
  const store = new Map<string, string>();
  return {
    store,
    getItem: jest.fn(async (k: string) => store.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItem: jest.fn(async (k: string) => void store.delete(k)),
  };
});
jest.mock('@/api/client', () => {
  const actual = jest.requireActual('@/api/client');
  return { ...actual, api: jest.fn() };
});


const { store } = jest.requireMock('@/lib/storage') as { store: Map<string, string> };
const user = { id: 'u1', name: 'A', email: 'a@b.com', role: 'USER' };

describe('session', () => {
  beforeEach(() => {
    store.clear();
    jest.mocked(api).mockReset();
  });

  it('starts as a guest when no token is saved', async () => {
    expect(await restoreSession()).toEqual({ token: null, user: null });
    expect(api).not.toHaveBeenCalled();
  });

  it('restores a saved token and refreshes the user', async () => {
    store.set(TOKEN_KEY, 'tok');
    jest.mocked(api).mockResolvedValue({ user });
    expect(await restoreSession()).toEqual({ token: 'tok', user });
  });

  it('drops a revoked token (password changed) and says why', async () => {
    store.set(TOKEN_KEY, 'tok');
    jest.mocked(api).mockRejectedValue(new ApiError(401));
    expect(await restoreSession()).toEqual({ token: null, user: null, notice: 'signedOut' });
    expect(store.has(TOKEN_KEY)).toBe(false);
  });

  it('drops the token of a suspended account and says why', async () => {
    store.set(TOKEN_KEY, 'tok');
    jest.mocked(api).mockRejectedValue(new ApiError(403, 'account_suspended'));
    expect(await restoreSession()).toEqual({ token: null, user: null, notice: 'accountSuspended' });
    expect(store.has(TOKEN_KEY)).toBe(false);
  });

  it('stays signed in as the last known user when the server is just unreachable', async () => {
    store.set(TOKEN_KEY, 'tok');
    store.set(USER_KEY, JSON.stringify(user));
    jest.mocked(api).mockRejectedValue(new ApiError(0, 'network'));
    expect(await restoreSession()).toEqual({ token: 'tok', user, notice: 'network' });
    expect(store.get(TOKEN_KEY)).toBe('tok');
  });

  it('keeps the session through a server error at start', async () => {
    store.set(TOKEN_KEY, 'tok');
    store.set(USER_KEY, JSON.stringify(user));
    jest.mocked(api).mockRejectedValue(new ApiError(503));
    expect(await restoreSession()).toEqual({ token: 'tok', user, notice: 'network' });
    expect(store.get(TOKEN_KEY)).toBe('tok');
  });

  it('only treats a 403 as suspension when the server says so', async () => {
    store.set(TOKEN_KEY, 'tok');
    jest.mocked(api).mockRejectedValue(new ApiError(403));
    expect((await restoreSession()).token).toBe('tok');
  });

  it('saves the token on sign-in and clears it on sign-out', async () => {
    jest.mocked(api).mockResolvedValue({ token: 'new', user });
    expect(await signIn('a@b.com', 'pw')).toEqual({ token: 'new', user });
    expect(store.get(TOKEN_KEY)).toBe('new');
    expect(JSON.parse(store.get(USER_KEY)!)).toEqual(user);
    await signOut();
    expect(store.has(TOKEN_KEY)).toBe(false);
    expect(store.has(USER_KEY)).toBe(false);
  });
});

describe('noticeOf', () => {
  it('keeps a known notice', () => {
    expect(noticeOf('passwordChanged')).toBe('passwordChanged');
  });

  it('drops anything else, such as a press event from a button wired straight to signOut', () => {
    expect(noticeOf({ nativeEvent: {} })).toBeNull();
    expect(noticeOf('nope')).toBeNull();
    expect(noticeOf(undefined)).toBeNull();
  });
});
