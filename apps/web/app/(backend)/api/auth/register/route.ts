import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Role } from '@el-captain/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, name, role, studioName, city } = body

  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: role as Role,
      ...(role === 'CLIENT' && studioName && city
        ? { clientProfile: { create: { studioName, city } } }
        : {}),
    },
  })

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 })
}
