import type { CoachProfile, Prisma } from '@prisma/client'
import { prisma } from '../client'

const withProfile = { coachProfile: true } satisfies Prisma.UserInclude

export type Coach = Prisma.UserGetPayload<{ include: typeof withProfile }>
export type CoachProfileFields = Partial<Omit<CoachProfile, 'id' | 'userId'>>

/** A coach user with their profile, or null when the id is not a coach. */
export function findCoach(id: string) {
  return prisma.user.findUnique({ where: { id, role: 'COACH' }, include: withProfile })
}

/** Updates the coach's name and profile fields; undefined fields are left as they are. */
export function updateCoach(id: string, { name, ...profile }: CoachProfileFields & { name?: string }) {
  return prisma.$transaction(async (tx) => {
    if (name) await tx.user.update({ where: { id }, data: { name } })
    await tx.coachProfile.upsert({
      where: { userId: id },
      create: { userId: id, ...profile },
      update: profile,
    })
    return tx.user.findUniqueOrThrow({ where: { id }, include: withProfile })
  })
}
