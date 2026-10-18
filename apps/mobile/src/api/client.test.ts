import { api, ApiError, configureApi } from './client';

const respond = (status: number, body: object) =>
  jest.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response);

describe('api', () => {
  const onUnauthorized = jest.fn();
  beforeEach(() => {
    onUnauthorized.mockReset();
    configureApi({ baseUrl: 'http://mac:3000', getToken: () => 'tok', getLocale: () => 'ar', onUnauthorized });
  });

  it('calls the API base URL with the bearer token and language', async () => {
    globalThis.fetch = respond(200, { ok: true });
    expect(await api('/api/users/me')).toEqual({ ok: true });
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://mac:3000/api/users/me');
    expect(init.headers).toMatchObject({ authorization: 'Bearer tok', 'accept-language': 'ar' });
  });

  it('throws an ApiError with the server code', async () => {
    globalThis.fetch = respond(409, { error: 'Full', code: 'session_full' });
    await expect(api('/api/sessions/1/book', { method: 'POST' })).rejects.toMatchObject({ status: 409, code: 'session_full' });
  });

  it("passes on the fields the server rejected", async () => {
    globalThis.fetch = respond(400, { error: 'Invalid', code: 'invalid_session', fields: ['capacity'] });
    await expect(api('/api/sessions/1', { method: 'PATCH' })).rejects.toMatchObject({ code: 'invalid_session', fields: ['capacity'] });
  });

  it('keeps the rest of the error body, e.g. the existing sport behind sport_exists', async () => {
    globalThis.fetch = respond(409, { code: 'sport_exists', sport: { id: 's1' } });
    await expect(api('/api/sports', { method: 'POST' })).rejects.toMatchObject({ code: 'sport_exists', body: { sport: { id: 's1' } } });
  });

  it('reports an unreachable server as status 0, code network', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    });
    const err = await api('/api/x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 0, code: 'network' });
  });

  it('signs out on a 401 from a signed-in call', async () => {
    globalThis.fetch = respond(401, { error: 'Unauthorized' });
    await expect(api('/api/users/me')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('does not sign out on a 401 when nobody is signed in', async () => {
    configureApi({ baseUrl: 'http://mac:3000', getToken: () => null, getLocale: () => 'en', onUnauthorized });
    globalThis.fetch = respond(401, { error: 'Invalid email or password' });
    await expect(api('/api/auth/token', { method: 'POST' })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('api timeout', () => {
  afterEach(() => jest.useRealTimers());

  it('gives up on a server that never answers and reports it as unreachable', async () => {
    jest.useFakeTimers();
    configureApi({ baseUrl: 'http://10.0.0.1:3000', getToken: () => null, getLocale: () => 'en', onUnauthorized: jest.fn() });
    globalThis.fetch = jest.fn(
      (_url, init?: RequestInit) =>
        new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    ) as any;
    const pending = api('/api/auth/token').catch((e) => e);
    jest.advanceTimersByTime(10_000);
    expect(await pending).toMatchObject({ status: 0, code: 'network' });
  });
});
