import type { Role } from '@el-captain/types';
import { isValidEmail, normalizeEmail } from '@/lib/shared/auth-rules';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { checkPassword } from '@/lib/server/password';
import { findUserByEmail } from '@/prisma/models/user';

export type SignedInUser = { id: string; name: string; email: string; role: Role };
export type CredentialsResult =
  | { user: SignedInUser }
  | { error: 'invalid' | typeof ERROR_CODES.EMAIL_NOT_VERIFIED | typeof ERROR_CODES.ACCOUNT_SUSPENDED };

/** Email + password check shared by the web login (next-auth) and the mobile app's token endpoint. */
export async function checkCredentials(rawEmail: string, password: string): Promise<CredentialsResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return { error: 'invalid' };

  const user = await findUserByEmail(email);
  if (!user) return { error: 'invalid' };

  const valid = await checkPassword(password, user.passwordHash);
  if (!valid) return { error: 'invalid' };
  // Only after the password matched, so this can't be used to find out which emails have accounts.
  if (!user.emailVerified) return { error: ERROR_CODES.EMAIL_NOT_VERIFIED };
  if (user.suspendedAt) return { error: ERROR_CODES.ACCOUNT_SUSPENDED };

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role as Role } };
}
