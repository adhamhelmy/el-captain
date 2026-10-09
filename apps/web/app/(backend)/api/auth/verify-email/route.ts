import { NextResponse } from 'next/server'
import { assertValid, publicRoute, type RequestContext } from '@/lib/server/api'
import { ERROR_CODES } from '@/lib/shared/error-codes'
import { consumeToken } from '@/prisma/models/auth-token'
import { markEmailVerified } from '@/prisma/models/user'

/** Confirms the email the link was sent to. POST, so link scanners that only GET can't use the token up. */
async function verifyEmail({ req }: RequestContext) {
  const { token } = await req.json()
  assertValid(typeof token === 'string' && token, 'Missing token', ERROR_CODES.INVALID_TOKEN)

  const userId = await consumeToken(token, 'VERIFY_EMAIL')
  assertValid(userId, 'Invalid or expired link', ERROR_CODES.INVALID_TOKEN)
  await markEmailVerified(userId)

  return NextResponse.json({ ok: true })
}

export const POST = publicRoute(verifyEmail)
