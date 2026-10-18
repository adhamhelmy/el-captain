import { ApiError } from '@/api/client';

/** Message key under `errors` for a failed sign-in; same keys as the web login (signInError in error-codes.ts). */
export type SignInError = 'invalidLogin' | 'emailNotVerified' | 'accountSuspended' | 'network' | 'generic';

const BY_CODE: Record<string, SignInError> = {
  email_not_verified: 'emailNotVerified',
  account_suspended: 'accountSuspended',
  network: 'network',
};

export function signInError(e: unknown): SignInError {
  if (!(e instanceof ApiError)) return 'generic';
  if (e.code && BY_CODE[e.code]) return BY_CODE[e.code];
  return e.status === 401 ? 'invalidLogin' : 'generic';
}
