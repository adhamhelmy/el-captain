export type { Venue } from '@prisma/client';
import { prisma } from '../client';

export type VenueData = { name: string; address: string; city: string; mapUrl: string | null };

/** The coach's venues: active ones first, by name. */
export function listVenues(coachId: string) {
  return prisma.venue.findMany({ where: { coachId }, orderBy: [{ archivedAt: { sort: 'asc', nulls: 'first' } }, { name: 'asc' }] });
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

/** Hidden from new sessions; sessions already there keep pointing at it. */
export function archiveVenue(id: string) {
  return prisma.venue.update({ where: { id }, data: { archivedAt: new Date() } });
}
