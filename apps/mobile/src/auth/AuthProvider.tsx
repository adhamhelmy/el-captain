import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { configureApi } from '@/api/client';
import { useLocale } from '@/i18n/IntlProvider';
import { shouldRefresh } from './refresh';
import * as session from './session';
import type { MobileUser, Notice } from './session';

type AuthValue = {
  status: 'loading' | 'ready';
  user: MobileUser | null;
  /** A message key under `errors` to show once, e.g. why the app opened signed out. */
  notice: Notice | 'adminWeb' | null;
  clearNotice: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  /** Signs out; `notice` explains why on the next screen (e.g. 'passwordChanged'). */
  signOut: (notice?: Notice) => Promise<void>;
  refresh: () => Promise<void>;
  /** Where to go after signing in, when a guest was sent to log in from a page (e.g. to book a session). */
  returnTo: string | null;
  setReturnTo: (path: string | null) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [status, setStatus] = useState<AuthValue['status']>('loading');
  const [user, setUser] = useState<MobileUser | null>(null);
  const [notice, setNotice] = useState<AuthValue['notice']>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const token = useRef<string | null>(null);

  const accept = useCallback((next: session.Session) => {
    token.current = next.token;
    // Admins have no app screens; they stay signed out here and use the web.
    if (next.user?.role === 'ADMIN') {
      session.signOut();
      token.current = null;
      setUser(null);
      setNotice('adminWeb');
      return;
    }
    setUser(next.user);
    if (next.notice) setNotice(next.notice);
  }, []);

  const signOut = useCallback(async (why?: Notice) => {
    await session.signOut();
    token.current = null;
    setUser(null);
    setReturnTo(null);
    if (why) setNotice(why);
  }, []);

  useEffect(() => {
    configureApi({
      getToken: () => token.current ?? session.pendingToken(),
      getLocale: () => locale,
      onUnauthorized: () => signOut('signedOut'),
    });
  }, [locale, signOut]);

  const lastCheck = useRef(0);
  useEffect(() => {
    session
      .restoreSession()
      .then(accept)
      .catch(() => accept({ token: null, user: null }))
      .finally(() => {
        lastCheck.current = Date.now();
        setStatus('ready');
      });
  }, [accept]);

  // Back from the background: pick up an approval, suspension or password change made on the web meanwhile.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (!token.current || !shouldRefresh(state, lastCheck.current, Date.now())) return;
      lastCheck.current = Date.now();
      session.restoreSession().then(accept);
    });
    return () => sub.remove();
  }, [accept]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      notice,
      clearNotice: () => setNotice(null),
      signIn: async (email, password) => accept(await session.signIn(email, password)),
      signOut,
      refresh: async () => accept(await session.restoreSession()),
      returnTo,
      setReturnTo,
    }),
    [status, user, notice, accept, signOut, returnTo],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth outside AuthProvider');
  return value;
}
