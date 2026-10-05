import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Role } from '@el-captain/types'

/** Roles anyone can sign up as. ADMIN is never self-service. */
const SIGNUP_ROLES = new Set(['USER', 'COACH', 'STUDIO'])

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, name, role, studioName, city } = body

  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: 'Missing required fields', code: 'missing_fields' }, { status: 400 })
  }
  if (!SIGNUP_ROLES.has(role)) {
    return NextResponse.json({ error: 'Invalid role', code: 'invalid_role' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use', code: 'email_taken' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: role as Role,
      ...(role === 'STUDIO' && studioName && city
        ? { clientProfile: { create: { studioName, city } } }
        : {}),
      ...(role === 'COACH'
        ? { coachProfile: { create: {} } }
        : {}),
    },
  })

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 })
}
