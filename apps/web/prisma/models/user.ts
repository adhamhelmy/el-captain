import type { Role } from '@prisma/client'
import { prisma } from '../client'

export type NewUser = {
  email: string
  passwordHash: string
  name: string
  role: Role
  /** Creates the studio profile when the user is a studio. */
  studio?: { studioName: string; city: string }
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

/** Creates the user. A coach always starts with an empty coach profile. */
export function createUser({ studio, ...user }: NewUser) {
  return prisma.user.create({
    data: {
      ...user,
      ...(user.role === 'STUDIO' && studio && { clientProfile: { create: studio } }),
      ...(user.role === 'COACH' && { coachProfile: { create: {} } }),
    },
  })
}

/** All users, newest first, without their password hashes. */
export function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export function updateUserRole(id: string, role: Role) {
  return prisma.user.update({ where: { id }, data: { role } })
}
