import { NextResponse } from 'next/server'
import { assertValid, publicRoute, type RequestContext } from '@/lib/api'
import { ERROR_CODES } from '@/lib/error-codes'
import { isStrongPassword } from '@/lib/auth-rules'
import { hashPassword } from '@/lib/password'
import { consumeToken } from '@/prisma/models/auth-token'
import { markEmailVerified, updatePasswordHash } from '@/prisma/models/user'

/** Sets a new password from a reset link. Following the link also proves the email, so it counts as verified. */
async function resetPassword({ req }: RequestContext) {
  const { token, password } = await req.json()
  assertValid(typeof token === 'string' && token, 'Missing token', ERROR_CODES.INVALID_TOKEN)
  assertValid(isStrongPassword(password), 'Password is too weak', ERROR_CODES.WEAK_PASSWORD)

  const userId = await consumeToken(token, 'RESET_PASSWORD')
  assertValid(userId, 'Invalid or expired link', ERROR_CODES.INVALID_TOKEN)
  await updatePasswordHash(userId, await hashPassword(password))
  await markEmailVerified(userId)

  return NextResponse.json({ ok: true })
}

export const POST = publicRoute(resetPassword)
