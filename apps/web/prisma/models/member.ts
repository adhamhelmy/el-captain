import type { Prisma } from '@prisma/client';
import type { Page } from '@/lib/server/api';
import { prisma } from '../client';

const withFavourites = {
  favouriteSports: { include: { sport: true }, orderBy: { sport: { nameEn: 'asc' } } },
} satisfies Prisma.UserInclude;

export type Member = Prisma.UserGetPayload<{ include: typeof withFavourites }>;

/** What a member's profile save may change. Undefined fields are left as they are; sportIds replaces the whole list. */
export type MemberUpdate = { name?: string; phone?: string | null; sportIds?: string[] };

/** A member (role USER) with their favourite sports, or null when the id is not a member. */
export function findMember(id: string) {
  return prisma.user.findUnique({ where: { id, role: 'USER' }, include: withFavourites });
}

export function updateMember(id: string, { name, phone, sportIds }: MemberUpdate) {
  return prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { name, phone } });
    if (sportIds) {
      await tx.favouriteSport.deleteMany({ where: { userId: id } });
      await tx.favouriteSport.createMany({ data: sportIds.map((sportId) => ({ userId: id, sportId })) });
    }
    return tx.user.findUniqueOrThrow({ where: { id }, include: withFavourites });
  });
}

/** Members for the admin list, newest first, narrowed by a name or email search. */
export function listMembersForAdmin(q: string | undefined, { take, skip }: Page) {
  const search = q && {
    OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }],
  };
  return prisma.user.findMany({ where: { role: 'USER', ...search }, include: withFavourites, orderBy: { createdAt: 'desc' }, take, skip });
}

/** Suspends or reinstates a member and returns them, or null when the id is not a member. */
export async function setMemberSuspended(id: string, suspended: boolean) {
  const { count } = await prisma.user.updateMany({ where: { id, role: 'USER' }, data: { suspendedAt: suspended ? new Date() : null } });
  return count ? findMember(id) : null;
}

/** Remembers the language the member uses, for the emails sent to them later. */
export function setMemberLocale(id: string, locale: string) {
  return prisma.user.update({ where: { id }, data: { locale } });
}
