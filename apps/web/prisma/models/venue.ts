export type { Venue } from '@prisma/client';
import { prisma } from '../client';

export type VenueData = { name: string; address: string; city: string; mapUrl: string | null };

/** The coach's venues: active ones first, by name, each with how many scheduled sessions are still ahead there. */
export function listVenues(coachId: string, now = new Date()) {
  return prisma.venue.findMany({
    where: { coachId },
    include: { _count: { select: { sessions: { where: { status: 'SCHEDULED', startsAt: { gt: now } } } } } },
    orderBy: [{ archivedAt: { sort: 'asc', nulls: 'first' } }, { name: 'asc' }],
  });
}

/**
 * Archives the venue unless it is the coach's last active one; null when it is.
 * The coach's profile row is locked first, so two archives at once can't both see "two left" and leave none.
 */
export function archiveVenueKeepingOne(id: string, coachId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "CoachProfile" WHERE "userId" = ${coachId} FOR UPDATE`;
    const venue = await tx.venue.findUnique({ where: { id } });
    if (venue?.archivedAt) return venue;
    if ((await tx.venue.count({ where: { coachId, archivedAt: null } })) <= 1) return null;
    return tx.venue.update({ where: { id }, data: { archivedAt: new Date() } });
  });
}

export function findVenue(id: string) {
  return prisma.venue.findUnique({ where: { id } });
}

export function createVenue(coachId: string, data: VenueData) {
  return prisma.venue.create({ data: { ...data, coachId } });
}

export function updateVenue(id: string, data: VenueData) {
  return prisma.venue.update({ where: { id }, data });
}
