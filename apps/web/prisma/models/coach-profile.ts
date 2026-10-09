import type { CoachStatus, Prisma } from '@prisma/client';

export type { CoachStatus };
import type { Page } from '@/lib/server/api';
import { prisma } from '../client';

const withProfile = {
  coachProfile: {
    include: {
      links: { orderBy: { position: 'asc' } },
      certifications: { orderBy: { createdAt: 'asc' } },
      sports: { include: { sport: true }, orderBy: { sport: { nameEn: 'asc' } } },
    },
  },
  venues: { where: { archivedAt: null }, orderBy: { name: 'asc' } },
} satisfies Prisma.UserInclude;

export type Coach = Prisma.UserGetPayload<{ include: typeof withProfile }>;

/** What a profile save may change. Lists replace the whole list; undefined fields are left as they are. */
export type ProfileUpdate = {
  name?: string;
  bio?: string | null;
  city?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  photoPath?: string | null;
  privatePrice?: number | null;
  privateDuration?: number | null;
  links?: { label: string; url: string }[];
  sportIds?: string[];
};

/** A coach user with their full profile, whatever their status, or null when the id is not a coach. */
export function findCoach(id: string) {
  return prisma.user.findUnique({ where: { id, role: 'COACH' }, include: withProfile });
}

/** The coach only when approved: what the public and members may see. */
export function findActiveCoach(id: string) {
  return prisma.user.findFirst({ where: { id, role: 'COACH', coachProfile: { status: 'ACTIVE' } }, include: withProfile });
}

/** Approved coaches for members and guests, newest first, narrowed by sport and a name search. */
export function listActiveCoaches({ sportId, q }: { sportId?: string; q?: string }, { take, skip }: Page) {
  return prisma.user.findMany({
    where: {
      role: 'COACH',
      coachProfile: { status: 'ACTIVE', ...(sportId && { sports: { some: { sportId } } }) },
      ...(q && { name: { contains: q, mode: 'insensitive' as const } }),
    },
    include: withProfile,
    orderBy: { createdAt: 'desc' },
    take,
    skip,
  });
}

/** Just the coach's review status, for the session token. Null when the user has no coach profile. */
export async function findCoachStatus(userId: string) {
  const profile = await prisma.coachProfile.findUnique({ where: { userId }, select: { status: true } });
  return profile?.status ?? null;
}

/** Saves the given parts of the profile in one transaction. */
export function updateCoach(id: string, { name, links, sportIds, ...fields }: ProfileUpdate) {
  return prisma.$transaction(async (tx) => {
    if (name) await tx.user.update({ where: { id }, data: { name } });
    const profile = await tx.coachProfile.upsert({ where: { userId: id }, create: { userId: id, ...fields }, update: fields });
    if (links) {
      await tx.coachLink.deleteMany({ where: { coachProfileId: profile.id } });
      await tx.coachLink.createMany({ data: links.map((l, position) => ({ ...l, position, coachProfileId: profile.id })) });
    }
    if (sportIds) {
      await tx.coachSport.deleteMany({ where: { coachProfileId: profile.id } });
      await tx.coachSport.createMany({ data: sportIds.map((sportId) => ({ sportId, coachProfileId: profile.id })) });
    }
    return tx.user.findUniqueOrThrow({ where: { id }, include: withProfile });
  });
}

export type AdminCoachFilter = { status?: CoachStatus; sportIds?: string[]; q?: string };

/**
 * Coaches for the admin list, narrowed by status, a name or email search, and sports (coaching any of them counts).
 * Pending ones come oldest submission first: that's the review queue.
 */
export function listCoachesForAdmin({ status, sportIds = [], q }: AdminCoachFilter, { take, skip }: Page) {
  const bySport = sportIds.length > 0;
  const profile = { ...(status && { status }), ...(bySport && { sports: { some: { sportId: { in: sportIds } } } }) };
  const search = q && {
    OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }],
  };
  return prisma.user.findMany({
    where: { role: 'COACH', ...((status || bySport) && { coachProfile: profile }), ...search },
    include: withProfile,
    orderBy: status === 'PENDING' ? { coachProfile: { submittedAt: 'asc' } } : { createdAt: 'desc' },
    take,
    skip,
  });
}
