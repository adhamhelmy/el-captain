import type { Prisma } from '@prisma/client';
import { prisma } from '../client';

/** The member's booking on this session, confirmed or cancelled, or null. */
export function findBooking(sessionId: string, memberId: string) {
  return prisma.booking.findUnique({ where: { sessionId_memberId: { sessionId, memberId } } });
}

/** How long a booked spot is held while the member pays. */
export const HOLD_MS = 15 * 60_000;

/** A booking still waiting for payment whose hold hasn't lapsed. */
export const liveHold = (now: Date) => ({ status: 'PENDING_PAYMENT' as const, holdUntil: { gt: now } });

/** How long a member has to pay for a private session once the coach accepts (never past its start). */
export const PRIVATE_HOLD_MS = 24 * 60 * 60_000;

type Tx = Prisma.TransactionClient;

/** Cancels lapsed unpaid bookings, and the private sessions made for them, inside the caller's transaction. */
export async function sweepLapsedHolds(tx: Tx, now: Date) {
  const lapsed = await tx.booking.findMany({
    where: { status: 'PENDING_PAYMENT', holdUntil: { lte: now } },
    select: { id: true, sessionId: true, session: { select: { type: true } } },
  });
  if (lapsed.length === 0) return;
  await tx.booking.updateMany({ where: { id: { in: lapsed.map((b) => b.id) } }, data: { status: 'CANCELLED', cancelledAt: now } });
  const unpaidPrivate = lapsed.filter((b) => b.session.type === 'PRIVATE').map((b) => b.sessionId);
  if (unpaidPrivate.length > 0) {
    await tx.session.updateMany({ where: { id: { in: unpaidPrivate }, status: 'SCHEDULED' }, data: { status: 'CANCELLED', cancelledAt: now } });
  }
}

/**
 * Tidies up holds nobody paid for, so lists and calendars stop showing them and the coach's time is free.
 * Counting already ignores lapsed holds; this makes it stick. There's no cron, so busy routes call it.
 */
export function expireHolds(now = new Date()) {
  return prisma.$transaction((tx) => sweepLapsedHolds(tx, now));
}

export type AwaitingPayment = { bookingId: string; price: number };
export type BookOutcome =
  | { ok: true; newlyBooked: boolean; awaitingPayment: AwaitingPayment | null }
  | { ok: false; reason: 'missing' | 'closed' | 'full' };

/**
 * Books a spot on a group session of an active coach, or reactivates a cancelled booking.
 * A paid session's spot is held for HOLD_MS while the member pays; a free one is confirmed straight away.
 * The session row is locked for the transaction, so two members can't both take the last spot.
 */
export function bookSession(sessionId: string, memberId: string, now = new Date()): Promise<BookOutcome> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Session" WHERE id = ${sessionId} FOR UPDATE`;
    const session = await tx.session.findUnique({
      where: { id: sessionId },
      select: { type: true, status: true, startsAt: true, capacity: true, price: true, coach: { select: { coachProfile: { select: { status: true } } } } },
    });
    if (!session) return { ok: false, reason: 'missing' };
    const coachActive = session.coach.coachProfile?.status === 'ACTIVE';
    if (session.type !== 'GROUP' || session.status !== 'SCHEDULED' || session.startsAt <= now || !coachActive) return { ok: false, reason: 'closed' };

    const key = { sessionId_memberId: { sessionId, memberId } };
    const existing = await tx.booking.findUnique({ where: key });
    if (existing?.status === 'CONFIRMED') return { ok: true, newlyBooked: false, awaitingPayment: null };
    if (existing?.status === 'PENDING_PAYMENT' && existing.holdUntil && existing.holdUntil > now) {
      return { ok: true, newlyBooked: false, awaitingPayment: { bookingId: existing.id, price: session.price } };
    }
    const taken = await tx.booking.count({ where: { sessionId, memberId: { not: memberId }, OR: [{ status: 'CONFIRMED' }, liveHold(now)] } });
    if (taken >= session.capacity) return { ok: false, reason: 'full' };

    if (session.price === 0) {
      await tx.booking.upsert({ where: key, create: { sessionId, memberId }, update: { status: 'CONFIRMED', cancelledAt: null, cancelledBy: null, holdUntil: null } });
      return { ok: true, newlyBooked: true, awaitingPayment: null };
    }
    const holdUntil = new Date(now.getTime() + HOLD_MS);
    const booking = await tx.booking.upsert({
      where: key,
      create: { sessionId, memberId, status: 'PENDING_PAYMENT', holdUntil },
      update: { status: 'PENDING_PAYMENT', holdUntil, cancelledAt: null, cancelledBy: null },
    });
    return { ok: true, newlyBooked: true, awaitingPayment: { bookingId: booking.id, price: session.price } };
  });
}

/** The member cancels their own confirmed booking on a group session. Returns its id (for the refund), or null when there was none. */
export async function unbookSession(sessionId: string, memberId: string) {
  const where = { sessionId, memberId, status: 'CONFIRMED' as const, session: { type: 'GROUP' as const } };
  const booking = await prisma.booking.findFirst({ where, select: { id: true } });
  if (!booking) return null;
  const { count } = await prisma.booking.updateMany({
    where: { ...where, id: booking.id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'MEMBER' },
  });
  return count > 0 ? booking.id : null;
}

const withMember = { member: { select: { id: true, name: true, email: true } } } satisfies Prisma.BookingInclude;
export type AttendeeRow = Prisma.BookingGetPayload<{ include: typeof withMember }>;

/** Confirmed bookings, earliest first. */
export function listAttendees(sessionId: string) {
  return prisma.booking.findMany({ where: { sessionId, status: 'CONFIRMED' }, include: withMember, orderBy: { createdAt: 'asc' } });
}
