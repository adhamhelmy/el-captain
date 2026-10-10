import { NextResponse } from 'next/server'
import { assertFound, assertValid, protect, type AuthContext } from '@/lib/server/api'
import { ERROR_CODES } from '@/lib/shared/error-codes'
import { isStrongPassword } from '@/lib/shared/auth-rules'
import { checkPassword, hashPassword } from '@/lib/server/password'
import { findUserById, updatePasswordHash } from '@/prisma/models/user'

/** A signed-in user changes their password, proving they know the current one. */
async function changePassword({ req, user }: AuthContext) {
  const { currentPassword, newPassword } = await req.json()
  assertValid(currentPassword && newPassword, 'Missing required fields', ERROR_CODES.MISSING_FIELDS)
  assertValid(isStrongPassword(newPassword), 'Password is too weak', ERROR_CODES.WEAK_PASSWORD)

  const account = await findUserById(user.id)
  assertFound(account)
  assertValid(await checkPassword(currentPassword, account.passwordHash), 'Wrong password', ERROR_CODES.WRONG_PASSWORD)
  await updatePasswordHash(account.id, await hashPassword(newPassword))

  return NextResponse.json({ ok: true })
}

export const POST = protect(changePassword, ['USER', 'COACH', 'STUDIO', 'ADMIN'])
