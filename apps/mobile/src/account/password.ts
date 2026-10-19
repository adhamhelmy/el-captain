import { api } from '@/api/client';

/**
 * Changes the password, then signs this phone back in with the new one: the change signs out every session
 * that started before it, this one too. 'changedSignInAgain' means the change worked but signing back in didn't,
 * so the person must log in again with the new password. A failed change throws the API error.
 */
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
  signIn: (email: string, password: string) => Promise<void>,
): Promise<'done' | 'changedSignInAgain'> {
  await api('/api/auth/change-password', { method: 'POST', json: { currentPassword, newPassword } });
  try {
    await signIn(email, newPassword);
    return 'done';
  } catch {
    return 'changedSignInAgain';
  }
}
