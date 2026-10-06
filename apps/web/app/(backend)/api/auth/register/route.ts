import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { assertNoConflict, assertValid, publicRoute, type RequestContext } from '@/lib/api'
import { createUser, findUserByEmail } from '@/prisma/models/user'

/** Roles anyone can sign up as. ADMIN is never self-service. */
const SIGNUP_ROLES = new Set(['USER', 'COACH', 'STUDIO'])

async function register({ req }: RequestContext) {
  const { email, password, name, role, studioName, city } = await req.json()

  assertValid(email && password && name && role, 'Missing required fields', 'missing_fields')
  assertValid(SIGNUP_ROLES.has(role), 'Invalid role', 'invalid_role')
  assertNoConflict(!(await findUserByEmail(email)), 'Email already in use', 'email_taken')

  const studio = studioName && city ? { studioName, city } : undefined
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await createUser({ email, name, role, studio, passwordHash })

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 })
}

export const POST = publicRoute(register)
