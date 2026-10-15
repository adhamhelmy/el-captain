/**
 * Extra test data on top of seed.ts: coaches in every review state, members, and a busy calendar for the seeded coach.
 * Every account here uses an @test.elcaptain.com email and the password "test1234".
 * Safe to run again: accounts are upserted and the calendar is only filled once.
 *
 * Run: npm run db:seed:test (after npm run db:seed)
 */
import type { CoachStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from './client';
const PASSWORD = 'test1234';
const DAY = 86_400_000;

/** A Cairo wall-clock time `days` from today, as a UTC instant. Cairo is UTC+3 in summer, +2 in winter; +2/+3 drift is fine for test data. */
function cairo(days: number, hour: number, minute = 0) {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour - 3, minute, 0, 0);
  return d;
}

type TestCoach = { email: string; name: string; status: CoachStatus; reason?: string; full: boolean };
type Sports = Record<'yoga' | 'circuit' | 'strength' | 'spin', { id: string }>;

const COACHES: TestCoach[] = [
  { email: 'onboarding@test.elcaptain.com', name: 'Tamer Onboarding', status: 'INCOMPLETE', full: false },
  {
    email: 'rejected@test.elcaptain.com',
    name: 'Rana Rejected',
    status: 'REJECTED',
    full: true,
    reason: "Your photo is a group shot, so members can't tell which one is you. Please upload a clear photo of your face.",
  },
  { email: 'pending@test.elcaptain.com', name: 'Omar Pending', status: 'PENDING', full: true },
  {
    email: 'suspended@test.elcaptain.com',
    name: 'Samy Suspended',
    status: 'SUSPENDED',
    full: true,
    reason: 'Several members reported sessions starting more than 30 minutes late. Reply to our email so we can sort this out together.',
  },
];

/** Eight members, upserted by email. */
async function seedMembers(passwordHash: string) {
  const memberNames = ['Sara Mahmoud', 'Omar Khaled', 'Nour Hassan', 'Youssef Adel', 'Laila Farouk', 'Karim Samir', 'Hana Tarek', 'Mostafa Nabil'];
  const members: { id: string }[] = [];
  for (const [i, name] of memberNames.entries()) {
    const email = `member${i + 1}@test.elcaptain.com`;
    members.push(
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name, passwordHash, emailVerified: new Date(), role: 'USER' },
      }),
    );
  }
  return members;
}

/** A member with no bookings, for the empty states (no coaches yet, no sessions yet). */
async function seedNewcomer(passwordHash: string) {
  const email = 'newcomer@test.elcaptain.com';
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Salma Newcomer', passwordHash, emailVerified: new Date(), role: 'USER' },
  });
}

/** The review history that explains each status, written once. */
async function seedStatusEvents(c: TestCoach, profileId: string, userId: string, adminId: string) {
  if (c.status === 'INCOMPLETE' || (await prisma.coachStatusEvent.count({ where: { coachProfileId: profileId } })) > 0) return;
  await prisma.coachStatusEvent.create({ data: { coachProfileId: profileId, from: 'INCOMPLETE', to: 'PENDING', actorId: userId } });
  if (c.status === 'REJECTED') {
    await prisma.coachStatusEvent.create({
      data: { coachProfileId: profileId, from: 'PENDING', to: 'REJECTED', reason: c.reason, actorId: adminId },
    });
  }
  if (c.status === 'SUSPENDED') {
    await prisma.coachStatusEvent.create({ data: { coachProfileId: profileId, from: 'PENDING', to: 'ACTIVE', actorId: adminId } });
    await prisma.coachStatusEvent.create({
      data: { coachProfileId: profileId, from: 'ACTIVE', to: 'SUSPENDED', reason: c.reason, actorId: adminId },
    });
  }
}

/** One coach in the given review state, with a venue when the profile is filled in. */
async function seedCoach(c: TestCoach, passwordHash: string, adminId: string, sports: Sports) {
  const { circuit, strength } = sports;
  const user = await prisma.user.upsert({
    where: { email: c.email },
    update: {},
    create: {
      email: c.email,
      name: c.name,
      passwordHash,
      emailVerified: new Date(),
      role: 'COACH',
      coachProfile: {
        create: {
          status: c.status,
          ...(c.full && {
            bio: 'Ten years coaching boxing and conditioning in Cairo. My sessions are hard but friendly: clear technique first, then we turn up the pace.',
            city: 'Zamalek, Cairo',
            instagram: 'https://www.instagram.com/elcaptain',
            sports: { create: [{ sportId: circuit.id }, { sportId: strength.id }] },
          }),
          ...(c.status !== 'INCOMPLETE' && { submittedAt: new Date(Date.now() - DAY) }),
        },
      },
    },
    include: { coachProfile: true },
  });
  const profile = user.coachProfile!;
  if (c.full && (await prisma.venue.count({ where: { coachId: user.id } })) === 0) {
    await prisma.venue.create({ data: { coachId: user.id, name: 'Zamalek Gym', address: '12 Brazil St', city: 'Cairo' } });
  }
  await seedStatusEvents(c, profile.id, user.id, adminId);
}

/** A busy calendar for the seeded coach: sessions, bookings and private requests. Filled once. */
async function seedCalendar(members: { id: string }[], sports: Sports) {
  const { yoga, circuit, strength, spin } = sports;
  const coach = await prisma.user.findUniqueOrThrow({ where: { email: 'coach@elcaptain.com' }, include: { coachProfile: true } });
  const marker = 'Test: Evening Circuit';
  if (await prisma.session.findFirst({ where: { coachId: coach.id, title: marker } })) {
    console.log('Test calendar already there; accounts refreshed.');
    return 0;
  }
  for (const s of [circuit, strength, spin]) {
    await prisma.coachSport.upsert({
      where: { coachProfileId_sportId: { coachProfileId: coach.coachProfile!.id, sportId: s.id } },
      update: {},
      create: { coachProfileId: coach.coachProfile!.id, sportId: s.id },
    });
  }
  await prisma.coachProfile.update({ where: { id: coach.coachProfile!.id }, data: { city: coach.coachProfile!.city ?? 'Zamalek, Cairo' } });

  const studio = (await prisma.venue.findFirst({ where: { coachId: coach.id, archivedAt: null } }))!;
  const park = await prisma.venue.create({
    data: { coachId: coach.id, name: 'Test: Al-Azhar Park Lawn', address: 'Salah Salem St', city: 'Cairo', mapUrl: 'https://maps.app.goo.gl/test' },
  });

  type Plan = {
    title: string;
    sportId: string;
    venueId: string;
    days: number;
    hour: number;
    minute?: number;
    dur: number;
    price: number;
    cap: number;
    booked: number;
  };
  const plans: Plan[] = [];
  // Three weeks back to three weeks ahead, at fixed day offsets from today (not fixed weekdays):
  // evening circuit on +1 and +3, spin on +2, morning strength on +5 of each week.
  for (let week = -3; week <= 3; week++) {
    plans.push(
      {
        title: marker,
        sportId: circuit.id,
        venueId: studio.id,
        days: week * 7 + 1,
        hour: 18,
        minute: 30,
        dur: 60,
        price: 300,
        cap: 12,
        booked: week < 0 ? 10 : 6 + week,
      },
      {
        title: 'Test: Evening Circuit',
        sportId: circuit.id,
        venueId: studio.id,
        days: week * 7 + 3,
        hour: 18,
        minute: 30,
        dur: 60,
        price: 300,
        cap: 12,
        booked: week === 0 ? 12 : 5,
      },
      {
        title: 'Test: Saturday Strength',
        sportId: strength.id,
        venueId: park.id,
        days: week * 7 + 5,
        hour: 8,
        dur: 90,
        price: 400,
        cap: 8,
        booked: week <= 0 ? 8 : 3,
      },
      { title: 'Test: Spin Express', sportId: spin.id, venueId: studio.id, days: week * 7 + 2, hour: 7, dur: 45, price: 250, cap: 10, booked: 4 },
    );
  }
  for (const p of plans) {
    const session = await prisma.session.create({
      data: {
        coachId: coach.id,
        sportId: p.sportId,
        venueId: p.venueId,
        type: 'GROUP',
        level: 'ALL_LEVELS',
        title: p.title,
        description: 'Test session made by seed-test.ts.',
        startsAt: cairo(p.days, p.hour, p.minute),
        durationMin: p.dur,
        price: p.price,
        capacity: p.cap,
      },
    });
    const takers = members.slice(0, Math.min(p.booked, members.length));
    for (const m of takers) await prisma.booking.create({ data: { sessionId: session.id, memberId: m.id } });
  }

  // Private requests: three waiting, one accepted (with its private session), one declined.
  const ask = (m: number, days: number, hour: number, message: string | null) => ({
    memberId: members[m].id,
    coachId: coach.id,
    venueId: studio.id,
    sportId: yoga.id,
    startsAt: cairo(days, hour),
    durationMin: 60,
    price: 800,
    message,
  });
  await prisma.privateRequest.createMany({
    data: [
      ask(0, 2, 10, 'Knee rehab, slow pace please.'),
      ask(1, 4, 16, null),
      ask(2, 6, 11, 'Preparing for a half marathon.'),
      { ...ask(3, 1, 12, null), status: 'REJECTED', responseNote: 'Fully booked that day.', respondedAt: new Date() },
    ],
  });
  const privateSession = await prisma.session.create({
    data: {
      coachId: coach.id,
      sportId: yoga.id,
      venueId: studio.id,
      type: 'PRIVATE',
      title: 'Private yoga',
      startsAt: cairo(3, 13),
      durationMin: 60,
      price: 800,
      capacity: 1,
      bookings: { create: { memberId: members[4].id } },
    },
  });
  await prisma.privateRequest.create({
    data: { ...ask(4, 3, 13, 'Flexibility work.'), status: 'ACCEPTED', respondedAt: new Date(), sessionId: privateSession.id },
  });

  return plans.length + 1;
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('seed-test.ts adds fake accounts; it never runs in production.');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@elcaptain.com' } });
  const [yoga, circuit, strength, spin] = await Promise.all(
    ['yoga', 'circuit', 'strength', 'spin'].map((key) => prisma.sport.findUniqueOrThrow({ where: { key } })),
  );
  const sports = { yoga, circuit, strength, spin };

  const members = await seedMembers(passwordHash);
  await seedNewcomer(passwordHash);
  for (const c of COACHES) await seedCoach(c, passwordHash, admin.id, sports);
  const sessions = await seedCalendar(members, sports);
  console.log(`Test data ready: ${members.length} members, ${COACHES.length} coaches, ${sessions} new sessions. Password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
