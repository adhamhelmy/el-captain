import type { Prisma } from '@prisma/client';
import { prisma } from '../client';

/** The member's booking on this session, confirmed or cancelled, or null. */
export function findBooking(sessionId: string, memberId: string) {
  return prisma.booking.findUnique({ where: { sessionId_memberId: { sessionId, memberId } } });
}

export type BookOutcome = { ok: true; newlyBooked: boolean } | { ok: false; reason: 'missing' | 'closed' | 'full' };

/**
 * Books a spot on a group session of an active coach, or reactivates a cancelled booking.
 * The session row is locked for the transaction, so two members can't both take the last spot.
 */
export function bookSession(sessionId: string, memberId: string, now = new Date()): Promise<BookOutcome> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Session" WHERE id = ${sessionId} FOR UPDATE`;
    const session = await tx.session.findUnique({
      where: { id: sessionId },
      select: { type: true, status: true, startsAt: true, capacity: true, coach: { select: { coachProfile: { select: { status: true } } } } },
    });
    if (!session) return { ok: false, reason: 'missing' };
    const coachActive = session.coach.coachProfile?.status === 'ACTIVE';
    if (session.type !== 'GROUP' || session.status !== 'SCHEDULED' || session.startsAt <= now || !coachActive) return { ok: false, reason: 'closed' };

    const key = { sessionId_memberId: { sessionId, memberId } };
    const existing = await tx.booking.findUnique({ where: key });
    if (existing?.status === 'CONFIRMED') return { ok: true, newlyBooked: false };
    const taken = await tx.booking.count({ where: { sessionId, status: 'CONFIRMED' } });
    if (taken >= session.capacity) return { ok: false, reason: 'full' };

    await tx.booking.upsert({ where: key, create: { sessionId, memberId }, update: { status: 'CONFIRMED', cancelledAt: null, cancelledBy: null } });
    return { ok: true, newlyBooked: true };
  });
}

/** The member cancels their own confirmed booking on a group session. False when there was none. */
export async function unbookSession(sessionId: string, memberId: string) {
  const { count } = await prisma.booking.updateMany({
    where: { sessionId, memberId, status: 'CONFIRMED', session: { type: 'GROUP' } },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MEMBER' },
  });
  return count > 0;
}

const withMember = { member: { select: { id: true, name: true, email: true } } } satisfies Prisma.BookingInclude;
export type AttendeeRow = Prisma.BookingGetPayload<{ include: typeof withMember }>;

/** Confirmed bookings, earliest first. */
export function listAttendees(sessionId: string) {
  return prisma.booking.findMany({ where: { sessionId, status: 'CONFIRMED' }, include: withMember, orderBy: { createdAt: 'asc' } });
}
