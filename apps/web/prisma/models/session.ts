import { randomUUID } from 'node:crypto';
import type { Prisma, SessionLevel } from '@prisma/client';
import type { Page } from '@/lib/server/api';
import type { When } from '@/lib/shared/session-rules';
import { prisma } from '../client';

/** What every session response carries: sport, venue, the coach's name and photo (and status, not sent), and the confirmed booking count. */
export const withDetails = {
  sport: true,
  venue: true,
  coach: { select: { id: true, name: true, coachProfile: { select: { photoPath: true, status: true } } } },
  _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
} satisfies Prisma.SessionInclude;

export type SessionWithDetails = Prisma.SessionGetPayload<{ include: typeof withDetails }>;

export type SessionFilter = { sportId?: string; q?: string; coachId?: string; from?: Date; to?: Date };

const insensitive = (q: string) => ({ contains: q, mode: 'insensitive' as const });

/** Upcoming group sessions of active coaches, soonest first. Private sessions are never listed. */
export function listOpenSessions({ sportId, q, coachId, from, to }: SessionFilter, { take, skip }: Page, now = new Date()) {
  return prisma.session.findMany({
    where: {
      type: 'GROUP',
      status: 'SCHEDULED',
      startsAt: { gt: from && from > now ? from : now, ...(to && { lt: to }) },
      coach: { coachProfile: { status: 'ACTIVE' } },
      ...(sportId && { sportId }),
      ...(coachId && { coachId }),
      ...(q && { OR: [{ title: insensitive(q) }, { coach: { name: insensitive(q) } }] }),
    },
    include: withDetails,
    orderBy: { startsAt: 'asc' },
    take,
    skip,
  });
}

export function findSession(id: string) {
  return prisma.session.findUnique({ where: { id }, include: withDetails });
}

export type GroupSessionBase = {
  coachId: string;
  sportId: string;
  venueId: string;
  level: SessionLevel;
  title: string;
  description: string | null;
  durationMin: number;
  price: number;
  capacity: number;
};

/** One group session per start, all in one transaction. Weekly copies share a series id. */
export function createGroupSessions(base: GroupSessionBase, starts: Date[]) {
  const seriesId = starts.length > 1 ? randomUUID() : null;
  return prisma.$transaction(
    starts.map((startsAt) => prisma.session.create({ data: { ...base, type: 'GROUP', startsAt, seriesId }, include: withDetails })),
  );
}

export type SessionUpdate = Partial<Omit<GroupSessionBase, 'coachId'> & { startsAt: Date }>;

export function updateSession(id: string, data: SessionUpdate) {
  return prisma.session.update({ where: { id }, data, include: withDetails });
}

/**
 * Cancels the session and every confirmed booking in one transaction.
 * Returns the members who were booked (for the emails), or null when it was already cancelled.
 */
export function cancelSession(id: string, by: 'COACH' | 'ADMIN', reason: string | null) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const { count } = await tx.session.updateMany({
      where: { id, status: 'SCHEDULED' },
      data: { status: 'CANCELLED', cancelledAt: now, cancelReason: reason },
    });
    if (count === 0) return null;
    const booked = await tx.booking.findMany({
      where: { sessionId: id, status: 'CONFIRMED' },
      select: { member: { select: { id: true, email: true, locale: true } } },
    });
    await tx.booking.updateMany({ where: { sessionId: id, status: 'CONFIRMED' }, data: { status: 'CANCELLED', cancelledAt: now, cancelledBy: by } });
    return booked.map((b) => b.member);
  });
}

const timeWindow = (when: When, now: Date) =>
  when === 'upcoming' ? { where: { startsAt: { gte: now } }, order: 'asc' as const } : { where: { startsAt: { lt: now } }, order: 'desc' as const };

/** All of a coach's sessions (group and private, cancelled included): upcoming soonest first, past latest first. */
export function listCoachSessions(coachId: string, when: When, { take, skip }: Page, now = new Date()) {
  const { where, order } = timeWindow(when, now);
  return prisma.session.findMany({ where: { coachId, ...where }, include: withDetails, orderBy: { startsAt: order }, take, skip });
}

/** Sessions the member holds a confirmed booking on. */
export function listMemberSessions(memberId: string, when: When, { take, skip }: Page, now = new Date()) {
  const { where, order } = timeWindow(when, now);
  return prisma.session.findMany({
    where: { bookings: { some: { memberId, status: 'CONFIRMED' } }, ...where },
    include: withDetails,
    orderBy: { startsAt: order },
    take,
    skip,
  });
}

export type AdminSessionFilter = { q?: string; status?: 'SCHEDULED' | 'CANCELLED'; when?: When };

/** Every session for admins: group and private, any status. Upcoming soonest first; otherwise latest first. */
export function listAdminSessions({ q, status, when }: AdminSessionFilter, { take, skip }: Page, now = new Date()) {
  const window = when ? { startsAt: when === 'upcoming' ? { gte: now } : { lt: now } } : {};
  return prisma.session.findMany({
    where: {
      ...window,
      ...(status && { status }),
      ...(q && { OR: [{ title: insensitive(q) }, { coach: { name: insensitive(q) } }] }),
    },
    include: withDetails,
    orderBy: { startsAt: when === 'upcoming' ? 'asc' : 'desc' },
    take,
    skip,
  });
}
