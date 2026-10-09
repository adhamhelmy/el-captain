import type { SportStatus } from '@prisma/client';

export type { Sport } from '@prisma/client';
import { sportKey } from '@/lib/shared/coach-rules';
import { prisma } from '../client';

const LIST_LIMIT = 50;

/** How many of these ids are real sports; the caller compares it with the number of distinct ids. */
export function countSports(ids: string[]) {
  return prisma.sport.count({ where: { id: { in: ids } } });
}

/** Approved sports, plus the viewer's own pending ones, by English name. */
export function listVisibleSports(viewerId: string | null, q?: string) {
  const visible = { OR: [{ status: 'APPROVED' as const }, ...(viewerId ? [{ status: 'PENDING' as const, createdById: viewerId }] : [])] };
  const matches = q ? { OR: [{ nameEn: { contains: q, mode: 'insensitive' as const } }, { nameAr: { contains: q } }] } : {};
  return prisma.sport.findMany({ where: { AND: [visible, matches] }, orderBy: { nameEn: 'asc' }, take: LIST_LIMIT });
}

export function findSportByKey(key: string) {
  return prisma.sport.findUnique({ where: { key } });
}

export function createSport(data: { nameEn: string; nameAr?: string | null; status: SportStatus; createdById?: string | null }) {
  return prisma.sport.create({ data: { ...data, key: sportKey(data.nameEn) } });
}

/** Every sport with how many coaches list it; pending ones first since they need action. */
export async function listSportsForAdmin() {
  const sports = await prisma.sport.findMany({
    include: { _count: { select: { coaches: true } } },
    orderBy: { nameEn: 'asc' },
  });
  return sports.sort((a, b) => Number(a.status === 'APPROVED') - Number(b.status === 'APPROVED'));
}

export function findSport(id: string) {
  return prisma.sport.findUnique({ where: { id } });
}

/** Renames and/or approves; the duplicate key follows the English name. */
export function updateSport(id: string, { nameEn, ...data }: { nameEn?: string; nameAr?: string | null; status?: 'APPROVED' }) {
  return prisma.sport.update({ where: { id }, data: { ...data, ...(nameEn && { nameEn, key: sportKey(nameEn) }) } });
}

/**
 * Moves every coach, fan, session and private request from one sport to another
 * (skipping coaches and fans who already have both), then deletes the first.
 */
export function mergeSport(fromId: string, intoId: string) {
  return prisma.$transaction(async (tx) => {
    const moving = await tx.coachSport.findMany({ where: { sportId: fromId }, select: { coachProfileId: true } });
    await tx.coachSport.createMany({
      data: moving.map(({ coachProfileId }) => ({ coachProfileId, sportId: intoId })),
      skipDuplicates: true,
    });
    const fans = await tx.favouriteSport.findMany({ where: { sportId: fromId }, select: { userId: true } });
    await tx.favouriteSport.createMany({ data: fans.map(({ userId }) => ({ userId, sportId: intoId })), skipDuplicates: true });
    await tx.session.updateMany({ where: { sportId: fromId }, data: { sportId: intoId } });
    await tx.privateRequest.updateMany({ where: { sportId: fromId }, data: { sportId: intoId } });
    await tx.sport.delete({ where: { id: fromId } });
  });
}
