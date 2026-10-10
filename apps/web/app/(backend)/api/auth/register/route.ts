import { NextResponse } from 'next/server'
import { assertNoConflict, assertValid, publicRoute, type RequestContext } from '@/lib/server/api'
import { ERROR_CODES } from '@/lib/shared/error-codes'
import { sendVerificationEmail } from '@/lib/email/auth-emails'
import { isStrongPassword, isValidEmail, normalizeEmail, SIGNUP_ROLES } from '@/lib/shared/auth-rules'
import { hashPassword } from '@/lib/server/password'
import { createUser, findUserByEmail } from '@/prisma/models/user'

/** Creates the account unverified and emails a confirmation link. Sign-in waits for that link. */
async function register({ req }: RequestContext) {
  const { password, name, role, studioName, city, ...body } = await req.json()
  const email = normalizeEmail(body.email)

  assertValid(email && password && name && role, 'Missing required fields', ERROR_CODES.MISSING_FIELDS)
  assertValid(isValidEmail(email), 'Invalid email', ERROR_CODES.INVALID_EMAIL)
  assertValid(SIGNUP_ROLES.has(role), 'Invalid role', ERROR_CODES.INVALID_ROLE)
  assertValid(isStrongPassword(password), 'Password is too weak', ERROR_CODES.WEAK_PASSWORD)
  assertNoConflict(!(await findUserByEmail(email)), 'Email already in use', ERROR_CODES.EMAIL_TAKEN)

  const studio = studioName && city ? { studioName, city } : undefined
  const passwordHash = await hashPassword(password)
  const user = await createUser({ email, name, role, studio, passwordHash })
  await sendVerificationEmail(req, user)

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 })
}

export const POST = publicRoute(register)
