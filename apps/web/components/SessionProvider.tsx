'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { STATUS_RECHECK_MS } from '@/lib/coach-rules';

export function SessionProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  // Re-reads the session regularly so a coach's review status (and a suspension) reaches the route guard.
  return <NextAuthSessionProvider refetchInterval={STATUS_RECHECK_MS / 1000}>{children}</NextAuthSessionProvider>;
}
