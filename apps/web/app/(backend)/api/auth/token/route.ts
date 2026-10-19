import { NextResponse } from 'next/server'
import { assertAllowed, assertSignedIn, assertValid, protect, publicRoute, type AuthContext, type RequestContext } from '@/lib/server/api'
import { issueToken } from '@/lib/server/bearer'
import { checkCredentials } from '@/lib/server/credentials'
import { ERROR_CODES } from '@/lib/shared/error-codes'
import { findAccess } from '@/prisma/models/user'

/**
 * Mobile app sign-in: email + password in, a bearer token and the user out.
 * Same checks and error codes as the web login; a wrong email or password is a bare 401.
 */
async function signIn({ req }: RequestContext) {
  const { email, password } = await req.json()
  assertValid(typeof email === 'string' && typeof password === 'string' && email && password, 'Missing required fields', ERROR_CODES.MISSING_FIELDS)

  const result = await checkCredentials(email, password)
  assertSignedIn(!('error' in result && result.error === 'invalid'), 'Invalid email or password')
  if ('error' in result) assertAllowed(false, result.error)

  const { user } = result
  const coachStatus = user.role === 'COACH' ? ((await findAccess(user.id)).coachStatus ?? 'INCOMPLETE') : undefined
  return NextResponse.json({ token: await issueToken(user), user: { ...user, ...(coachStatus && { coachStatus }) } })
}

/** The signed-in user, so the app can pick up a role or coach-status change. */
async function me({ user }: AuthContext) {
  const { id, name, email, role, coachStatus } = user
  return NextResponse.json({ user: { id, name, email, role, ...(coachStatus && { coachStatus }) } })
}

export const POST = publicRoute(signIn)
export const GET = protect(me)
