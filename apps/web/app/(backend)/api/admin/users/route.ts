import { NextResponse } from 'next/server'
import { assertValid, protect, type AuthContext } from '@/lib/api'
import { listUsers, updateUserRole } from '@/prisma/models/user'

const ASSIGNABLE_ROLES = new Set(['ADMIN', 'STUDIO', 'USER'])

async function list() {
  const users = await listUsers()
  return NextResponse.json(users)
}

async function changeRole({ req }: AuthContext) {
  const { userId, role } = await req.json()
  
  assertValid(userId && role, 'userId and role required')
  assertValid(ASSIGNABLE_ROLES.has(role), 'Invalid role')

  await updateUserRole(userId, role)
  return NextResponse.json({ success: true })
}

export const GET = protect(list, ['ADMIN'])
export const PATCH = protect(changeRole, ['ADMIN'])
