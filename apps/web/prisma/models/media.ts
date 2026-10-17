import type { CoachMedia, MediaKind, Sport } from '@prisma/client';
import { prisma } from '../client';

export type { MediaKind };
export type Media = CoachMedia & { sport: Sport | null };

export type NewMedia = {
  kind: MediaKind;
  filePath: string;
  contentType: string;
  size: number;
  caption: string | null;
  sportId: string | null;
  durationSec: number | null;
};

export function createMedia(coachProfileId: string, data: NewMedia) {
  return prisma.coachMedia.create({ data: { ...data, coachProfileId }, include: { sport: true } });
}

/** The item only when it belongs to this coach user. */
export function findMedia(id: string, coachUserId: string) {
  return prisma.coachMedia.findFirst({ where: { id, coachProfile: { userId: coachUserId } } });
}

export function updateMedia(id: string, data: { caption: string | null; sportId: string | null }) {
  return prisma.coachMedia.update({ where: { id }, data, include: { sport: true } });
}

export function deleteMedia(id: string) {
  return prisma.coachMedia.delete({ where: { id } });
}

/** How many gallery items keep this file, so a session dropping it as a cover knows whether to delete it. */
export function countMediaWithPath(filePath: string) {
  return prisma.coachMedia.count({ where: { filePath } });
}
