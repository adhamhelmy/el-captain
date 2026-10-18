import { ApiError } from '@/api/client';
import { signInError } from './sign-in-error';

describe('signInError', () => {
  it('uses the web login messages for the server codes', () => {
    expect(signInError(new ApiError(403, 'email_not_verified'))).toBe('emailNotVerified');
    expect(signInError(new ApiError(403, 'account_suspended'))).toBe('accountSuspended');
  });

  it('treats a 401 as a wrong email or password', () => {
    expect(signInError(new ApiError(401))).toBe('invalidLogin');
  });

  it('explains an unreachable server', () => {
    expect(signInError(new ApiError(0, 'network'))).toBe('network');
  });

  it('falls back to the generic error for anything else', () => {
    expect(signInError(new ApiError(500))).toBe('generic');
    expect(signInError(new Error('boom'))).toBe('generic');
  });
});
