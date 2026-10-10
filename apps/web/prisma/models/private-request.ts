import type { Prisma } from '@prisma/client';
import { DURATION, endsAt, overlaps } from '@/lib/shared/session-rules';
import { prisma } from '../client';

const withDetails = {
  sport: true,
  venue: true,
  member: { select: { id: true, name: true, email: true, locale: true } },
  coach: { select: { id: true, name: true, email: true, coachProfile: { select: { locale: true } } } },
} satisfies Prisma.PrivateRequestInclude;

export type RequestWithDetails = Prisma.PrivateRequestGetPayload<{ include: typeof withDetails }>;

export type NewRequest = {
  memberId: string;
  coachId: string;
  venueId: string;
  sportId: string;
  startsAt: Date;
  durationMin: number;
  price: number;
  message: string | null;
};

export function createRequest(data: NewRequest) {
  return prisma.privateRequest.create({ data, include: withDetails });
}

export function findRequest(id: string) {
  return prisma.privateRequest.findUnique({ where: { id }, include: withDetails });
}

/** Whether the member is still waiting on this coach for an earlier request. */
export async function hasPendingRequest(memberId: string, coachId: string, now = new Date()) {
  return (await prisma.privateRequest.count({ where: { memberId, coachId, status: 'PENDING', startsAt: { gt: now } } })) > 0;
}

const RECENT = 100;

export function listMemberRequests(memberId: string) {
  return prisma.privateRequest.findMany({ where: { memberId }, include: withDetails, orderBy: { createdAt: 'desc' }, take: RECENT });
}

export function listCoachRequests(coachId: string) {
  return prisma.privateRequest.findMany({ where: { coachId }, include: withDetails, orderBy: { createdAt: 'desc' }, take: RECENT });
}

export type AcceptOutcome = { ok: true; sessionId: string } | { ok: false; reason: 'closed' | 'conflict' };

/**
 * The coach accepts: in one transaction, create the private session with the member already booked and link the request.
 * The coach's profile row is locked first, so two accepts for the same coach run one after the other and
 * can't both pass the clash check. Then the request row, so a member cancelling at the same moment can't race it.
 */
export function acceptRequest(id: string, coachId: string, now = new Date()): Promise<AcceptOutcome> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "CoachProfile" WHERE "userId" = ${coachId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "PrivateRequest" WHERE id = ${id} FOR UPDATE`;
    const r = await tx.privateRequest.findUnique({ where: { id } });
    if (r?.coachId !== coachId || r.status !== 'PENDING' || r.startsAt <= now) return { ok: false, reason: 'closed' };

    // Any scheduled session that could overlap starts less than the longest session before this one ends.
    const nearby = await tx.session.findMany({
      where: {
        coachId,
        status: 'SCHEDULED',
        startsAt: { gte: new Date(r.startsAt.getTime() - DURATION.max * 60_000), lt: endsAt(r.startsAt, r.durationMin) },
      },
      select: { startsAt: true, durationMin: true },
    });
    if (nearby.some((s) => overlaps(s, r))) return { ok: false, reason: 'conflict' };

    const sport = await tx.sport.findUniqueOrThrow({ where: { id: r.sportId }, select: { nameEn: true } });
    const session = await tx.session.create({
      data: {
        coachId,
        sportId: r.sportId,
        venueId: r.venueId,
        type: 'PRIVATE',
        title: sport.nameEn,
        description: r.message,
        startsAt: r.startsAt,
        durationMin: r.durationMin,
        price: r.price,
        capacity: 1,
        bookings: { create: { memberId: r.memberId } },
      },
    });
    await tx.privateRequest.update({ where: { id }, data: { status: 'ACCEPTED', respondedAt: now, sessionId: session.id } });
    return { ok: true, sessionId: session.id };
  });
}

/** False when the request isn't this coach's, isn't pending, or has expired. */
export async function rejectRequest(id: string, coachId: string, note: string | null, now = new Date()) {
  const { count } = await prisma.privateRequest.updateMany({
    where: { id, coachId, status: 'PENDING', startsAt: { gt: now } },
    data: { status: 'REJECTED', responseNote: note, respondedAt: now },
  });
  return count > 0;
}

/** The member withdraws a pending request. False when it isn't theirs or isn't pending. */
export async function cancelRequest(id: string, memberId: string, now = new Date()) {
  const { count } = await prisma.privateRequest.updateMany({
    where: { id, memberId, status: 'PENDING' },
    data: { status: 'CANCELLED', respondedAt: now },
  });
  return count > 0;
}
