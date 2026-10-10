import { prisma } from '../client';
import { withDetails } from './session';

const DAY_MS = 86_400_000;
const confirmed = { status: 'CONFIRMED' as const };

/** Coach dashboard: bookings on the next 7 days, expected earnings and group fill rate over the last 30 days. */
export async function coachStats(coachId: string, now = new Date()) {
  const [bookingsNext7, past] = await Promise.all([
    prisma.booking.count({
      where: { ...confirmed, session: { coachId, status: 'SCHEDULED', startsAt: { gte: now, lt: new Date(now.getTime() + 7 * DAY_MS) } } },
    }),
    prisma.session.findMany({
      where: { coachId, status: 'SCHEDULED', startsAt: { gte: new Date(now.getTime() - 30 * DAY_MS), lt: now } },
      select: { type: true, price: true, capacity: true, _count: { select: { bookings: { where: confirmed } } } },
    }),
  ]);
  const earnings30 = past.reduce((sum, s) => sum + s.price * s._count.bookings, 0);
  const group = past.filter((s) => s.type === 'GROUP');
  const seats = group.reduce((sum, s) => sum + s.capacity, 0);
  const taken = group.reduce((sum, s) => sum + s._count.bookings, 0);
  return { bookingsNext7, earnings30, fillRate: seats ? Math.round((taken / seats) * 100) : null };
}

/** Members who booked this coach, with how many sessions and their last past visit; most recent visit first. */
export async function listCoachClients(coachId: string, now = new Date()) {
  const rows = await prisma.booking.findMany({
    where: { ...confirmed, session: { coachId } },
    select: { member: { select: { id: true, name: true, email: true } }, session: { select: { startsAt: true } } },
  });
  const byMember = new Map<string, { member: (typeof rows)[number]['member']; count: number; lastVisit: Date | null }>();
  for (const { member, session } of rows) {
    const entry = byMember.get(member.id) ?? { member, count: 0, lastVisit: null };
    entry.count++;
    if (session.startsAt < now && (!entry.lastVisit || session.startsAt > entry.lastVisit)) entry.lastVisit = session.startsAt;
    byMember.set(member.id, entry);
  }
  return [...byMember.values()].sort((a, b) => (b.lastVisit?.getTime() ?? 0) - (a.lastVisit?.getTime() ?? 0));
}

/** One client of this coach with their sessions together, or null when they never booked this coach. */
export async function findCoachClient(coachId: string, memberId: string) {
  const member = await prisma.user.findFirst({
    where: { id: memberId, bookings: { some: { ...confirmed, session: { coachId } } } },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
  if (!member) return null;
  const sessions = await prisma.session.findMany({
    where: { coachId, bookings: { some: { memberId, ...confirmed } } },
    include: withDetails,
    orderBy: { startsAt: 'desc' },
  });
  return { member, sessions };
}

/** Coaches of the member's past sessions, with how many sessions together; most first. */
export async function listMemberCoaches(memberId: string, now = new Date()) {
  const rows = await prisma.booking.findMany({
    where: { memberId, ...confirmed, session: { startsAt: { lt: now } } },
    select: { session: { select: { coach: { select: { id: true, name: true, coachProfile: { select: { photoPath: true, city: true } } } } } } },
  });
  const byCoach = new Map<string, { coach: { id: string; name: string; photoPath: string | null; city: string | null }; count: number }>();
  for (const { session } of rows) {
    const c = session.coach;
    const entry = byCoach.get(c.id) ?? {
      coach: { id: c.id, name: c.name, photoPath: c.coachProfile?.photoPath ?? null, city: c.coachProfile?.city ?? null },
      count: 0,
    };
    entry.count++;
    byCoach.set(c.id, entry);
  }
  return [...byCoach.values()].sort((a, b) => b.count - a.count);
}

/** Admin dashboard numbers. "Booked value" is the price of bookings made in the last 30 days, paid in person. */
export async function adminStats(now = new Date()) {
  const [members, activeCoaches, sessionsNext7, booked] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.coachProfile.count({ where: { status: 'ACTIVE' } }),
    prisma.session.count({ where: { status: 'SCHEDULED', startsAt: { gte: now, lt: new Date(now.getTime() + 7 * DAY_MS) } } }),
    prisma.booking.findMany({
      where: { ...confirmed, createdAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } },
      select: { session: { select: { price: true } } },
    }),
  ]);
  return { members, activeCoaches, sessionsNext7, bookedValue30: booked.reduce((sum, b) => sum + b.session.price, 0) };
}

/** The latest confirmed bookings, newest first. */
export function recentBookings(limit = 8) {
  return prisma.booking.findMany({
    where: confirmed,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      member: { select: { id: true, name: true } },
      session: { select: { id: true, title: true, type: true, sport: true } },
    },
  });
}

export type RecentBooking = Awaited<ReturnType<typeof recentBookings>>[number];
