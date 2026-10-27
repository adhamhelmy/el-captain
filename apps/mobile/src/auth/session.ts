import type { Role } from '@el-captain/types';
import { api, ApiError } from '@/api/client';
import { deleteItem, getItem, setItem } from '@/lib/storage';

export type MobileUser = { id: string; name: string; email: string; role: Role; coachStatus?: string };
/** Why the app opened signed out, or with a stale user; a message key under `errors`. */
export type Notice = 'signedOut' | 'accountSuspended' | 'network' | 'passwordChanged';
export type Session = { token: string | null; user: MobileUser | null; notice?: Notice };

const NOTICES: ReadonlySet<unknown> = new Set<Notice>(['signedOut', 'accountSuspended', 'network', 'passwordChanged']);

/** A notice, or null for anything else (a button wired straight to signOut passes its press event). */
export const noticeOf = (why: unknown): Notice | null => (NOTICES.has(why) ? (why as Notice) : null);

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

const GUEST: Session = { token: null, user: null };

async function save(token: string, user: MobileUser) {
  await setItem(TOKEN_KEY, token);
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function signOut() {
  await deleteItem(TOKEN_KEY);
  await deleteItem(USER_KEY);
}

async function cachedUser(): Promise<MobileUser | null> {
  try {
    return JSON.parse((await getItem(USER_KEY)) ?? 'null') as MobileUser | null;
  } catch {
    return null;
  }
}

/** Calls go out with `token` until the provider takes over; restore runs before anything else. */
let pending: string | null = null;
export const pendingToken = () => pending;

/** App start: the saved token, checked against the server so a revoked or suspended account is signed out. */
export async function restoreSession(): Promise<Session> {
  const token = await getItem(TOKEN_KEY);
  if (!token) return GUEST;

  pending = token;
  try {
    const { user } = await api<{ user: MobileUser }>('/api/auth/token');
    await setItem(USER_KEY, JSON.stringify(user));
    return { token, user };
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 0;
    const code = e instanceof ApiError ? e.code : undefined;
    // Only a rejected token or a suspended account signs out; a server hiccup keeps the session.
    const suspended = status === 403 && code === 'account_suspended';
    if (status !== 401 && !suspended) return { token, user: await cachedUser(), notice: 'network' };
    await signOut();
    return { ...GUEST, notice: suspended ? 'accountSuspended' : 'signedOut' };
  } finally {
    pending = null;
  }
}

/** Email + password for a token. Throws ApiError: 401 wrong details, 403 with the web's code, 0 unreachable. */
export async function signIn(email: string, password: string): Promise<{ token: string; user: MobileUser }> {
  const result = await api<{ token: string; user: MobileUser }>('/api/auth/token', { method: 'POST', json: { email, password } });
  await save(result.token, result.user);
  return result;
}
