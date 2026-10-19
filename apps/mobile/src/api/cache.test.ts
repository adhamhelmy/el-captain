import { api } from './client';
import { clearCache, forget, load, peek, prefetch, remember } from './cache';
import { pagePaths, prefetchPaths, weekPath } from './paths';

jest.mock('./client', () => ({ api: jest.fn() }));
const mockApi = api as jest.Mock;

describe('cache', () => {
  beforeEach(() => {
    clearCache();
    mockApi.mockReset();
  });

  it('keeps what a load returned, for the next screen that asks', async () => {
    mockApi.mockResolvedValue([{ id: 's1' }]);
    expect(peek('/api/x')).toBeUndefined();
    expect(await load('/api/x')).toEqual([{ id: 's1' }]);
    expect(peek('/api/x')).toEqual([{ id: 's1' }]);
  });

  it('always asks the server again, then keeps the newer answer', async () => {
    mockApi.mockResolvedValueOnce(['old']).mockResolvedValueOnce(['new']);
    await load('/api/x');
    expect(await load('/api/x')).toEqual(['new']);
    expect(peek('/api/x')).toEqual(['new']);
  });

  it('keeps nothing from a failed load and passes the error on', async () => {
    mockApi.mockRejectedValue(new Error('offline'));
    await expect(load('/api/x')).rejects.toThrow('offline');
    expect(peek('/api/x')).toBeUndefined();
  });

  it('forgets everything on clear, such as when signing out', async () => {
    mockApi.mockResolvedValue(['mine']);
    await load('/api/x');
    clearCache();
    expect(peek('/api/x')).toBeUndefined();
  });

  it('drops an answer that lands after a clear, so the next account never sees it', async () => {
    let answer!: (v: unknown) => void;
    mockApi.mockReturnValue(new Promise((r) => (answer = r)));
    const pending = load('/api/x');
    clearCache();
    answer(['previous account']);
    await pending;
    expect(peek('/api/x')).toBeUndefined();
  });

  it('shares a request already on its way instead of sending it twice', async () => {
    let answer!: (v: unknown) => void;
    mockApi.mockReturnValue(new Promise((r) => (answer = r)));
    const prefetched = load('/api/x');
    const screen = load('/api/x');
    answer(['one']);
    expect(await screen).toEqual(['one']);
    expect(await prefetched).toEqual(['one']);
    expect(mockApi).toHaveBeenCalledTimes(1);
  });

  it('prefetches only what it does not have yet', async () => {
    mockApi.mockResolvedValue(['kept']);
    await load('/api/a');
    mockApi.mockClear();
    await prefetch(['/api/a', '/api/b']);
    expect(mockApi.mock.calls.map(([path]) => path)).toEqual(['/api/b']);
  });

  it('keeps a fresher answer after a change, or forgets one that is out of date', async () => {
    mockApi.mockResolvedValue({ bookedByMe: false });
    await load('/api/sessions/s1');
    remember('/api/sessions/s1', { bookedByMe: true });
    expect(peek('/api/sessions/s1')).toEqual({ bookedByMe: true });
    forget('/api/sessions/s1');
    expect(peek('/api/sessions/s1')).toBeUndefined();
  });

  it('prefetches every path, and one failing does not stop the rest', async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === '/api/b') throw new Error('500');
      return path;
    });
    await prefetch(['/api/a', '/api/b', '/api/c']);
    expect([peek('/api/a'), peek('/api/b'), peek('/api/c')]).toEqual(['/api/a', undefined, '/api/c']);
  });
});

describe('prefetchPaths', () => {
  it('loads a member’s tabs, an active coach’s tabs, and explore for a guest', () => {
    expect(prefetchPaths({ role: 'USER' })).toContain('/api/users/me/coaches');
    expect(prefetchPaths({ role: 'COACH', coachStatus: 'ACTIVE' })).toContain('/api/coaches/me/clients');
    expect(prefetchPaths(null)).toContain('/api/sessions?limit=50');
  });

  it('loads this week of a coach’s schedule, the exact path the week view asks for', () => {
    expect(weekPath(0)).toMatch(/^\/api\/sessions\/me\?from=.+&to=.+$/);
    expect(prefetchPaths({ role: 'COACH', coachStatus: 'ACTIVE' })).toContain(weekPath(0));
  });

  it('loads nothing for a coach still in onboarding or an admin', () => {
    expect(prefetchPaths({ role: 'COACH', coachStatus: 'PENDING' })).toEqual([]);
    expect(prefetchPaths({ role: 'ADMIN' })).toEqual([]);
  });
});

describe('pagePaths', () => {
  it('maps a page to the requests it opens with', () => {
    expect(pagePaths('/session/s1')).toEqual(['/api/sessions/s1']);
    expect(pagePaths('/coach-session/s1')).toEqual(['/api/sessions/s1', '/api/sessions/s1/attendees']);
    expect(pagePaths('/coach-profile/c1')).toEqual(['/api/coaches/c1', '/api/sessions?limit=50&coach=c1']);
    expect(pagePaths('/client/m1')).toEqual(['/api/coaches/me/clients/m1']);
  });

  it('loads nothing for tabs or unknown pages', () => {
    expect(pagePaths('/user/sessions')).toEqual([]);
    expect(pagePaths('/coach/sessions?tab=requests')).toEqual([]);
  });
});
