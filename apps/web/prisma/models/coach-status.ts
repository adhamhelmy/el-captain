import type { CoachStatus } from '@prisma/client';

export type { CoachStatusEvent } from '@prisma/client';
import { prisma } from '../client';

/** The latest status change; its reason is what a rejected or suspended coach is shown. */
export function lastStatusEvent(coachProfileId: string) {
  return prisma.coachStatusEvent.findFirst({ where: { coachProfileId }, orderBy: { createdAt: 'desc' } });
}

export type StatusChange = { from: CoachStatus; to: CoachStatus; actorId: string; reason?: string | null; locale?: string };

/**
 * Moves the coach from `from` to `to` and records it. Returns false when the status was no longer `from`,
 * e.g. another admin decided first, so the caller can answer 409 instead of deciding twice.
 */
export function setCoachStatus(coachProfileId: string, { from, to, actorId, reason, locale }: StatusChange) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.coachProfile.updateMany({
      where: { id: coachProfileId, status: from },
      data: { status: to, ...(to === 'PENDING' && { submittedAt: new Date() }), ...(locale && { locale }) },
    });
    if (count === 0) return false;
    await tx.coachStatusEvent.create({ data: { coachProfileId, from, to, actorId, reason: reason ?? null } });
    return true;
  });
}

/** The review history, newest first, with each actor's name. */
export async function listStatusEvents(coachProfileId: string) {
  const events = await prisma.coachStatusEvent.findMany({ where: { coachProfileId }, orderBy: { createdAt: 'desc' } });
  const actors = await prisma.user.findMany({
    where: { id: { in: [...new Set(events.map((e) => e.actorId))] } },
    select: { id: true, name: true },
  });
  const names = new Map(actors.map((a) => [a.id, a.name]));
  return events.map((e) => ({ ...e, actorName: names.get(e.actorId) ?? null }));
}
