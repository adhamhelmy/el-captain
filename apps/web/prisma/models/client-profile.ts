import type { ClientProfile, Prisma } from '@prisma/client'
import { prisma } from '../client'

const withProfile = { clientProfile: true } satisfies Prisma.UserInclude

export type Client = Prisma.UserGetPayload<{ include: typeof withProfile }>
export type ClientProfileFields = Partial<Omit<ClientProfile, 'id' | 'userId'>>

const DEFAULT_STUDIO_NAME = 'My Studio'

/** A studio user with its profile, or null when the id is not a studio. */
export function findClient(id: string) {
  return prisma.user.findUnique({ where: { id, role: 'STUDIO' }, include: withProfile })
}

/** Updates the studio's name and profile fields; undefined fields are left as they are. */
export function updateClient(id: string, { name, ...profile }: ClientProfileFields & { name?: string }) {
  return prisma.$transaction(async (tx) => {
    if (name) await tx.user.update({ where: { id }, data: { name } })
    await tx.clientProfile.upsert({
      where: { userId: id },
      create: { userId: id, ...profile, studioName: profile.studioName ?? DEFAULT_STUDIO_NAME },
      update: profile,
    })
    return tx.user.findUniqueOrThrow({ where: { id }, include: withProfile })
  })
}
