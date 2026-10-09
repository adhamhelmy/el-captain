import bcrypt from 'bcryptjs';
import { prisma } from './client';

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@elcaptain.com' },
    update: {},
    create: {
      email: 'admin@elcaptain.com',
      passwordHash: await hash('admin123'),
      emailVerified: new Date(),
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'studio@elcaptain.com' },
    update: {},
    create: {
      email: 'studio@elcaptain.com',
      passwordHash: await hash('studio123'),
      emailVerified: new Date(),
      name: 'Cairo Fitness',
      role: 'STUDIO',
      clientProfile: {
        create: {
          studioName: 'Cairo Fitness',
          studioDescription: 'Premium fitness studio in Cairo',
          city: 'Cairo',
        },
      },
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@elcaptain.com' },
    update: {},
    create: {
      email: 'user@elcaptain.com',
      passwordHash: await hash('user123'),
      emailVerified: new Date(),
      name: 'Ahmed Ali',
      role: 'USER',
    },
  });

  const sports = [
    { key: 'yoga', nameEn: 'Yoga', nameAr: 'يوجا' },
    { key: 'circuit', nameEn: 'Circuit', nameAr: 'سيركيت' },
    { key: 'spin', nameEn: 'Spin', nameAr: 'سبينينج' },
    { key: 'climbing', nameEn: 'Climbing', nameAr: 'تسلّق' },
    { key: 'strength', nameEn: 'Strength', nameAr: 'تمارين قوة' },
  ];
  for (const s of sports) {
    await prisma.sport.upsert({ where: { key: s.key }, update: {}, create: { ...s, status: 'APPROVED' } });
  }

  const yoga = await prisma.sport.findUniqueOrThrow({ where: { key: 'yoga' } });
  const coach = await prisma.user.upsert({
    where: { email: 'coach@elcaptain.com' },
    update: {},
    create: {
      email: 'coach@elcaptain.com',
      passwordHash: await hash('coach123'),
      emailVerified: new Date(),
      name: 'Mona Coach',
      role: 'COACH',
      coachProfile: {
        create: {
          status: 'ACTIVE',
          bio: 'Yoga coach with ten years of teaching experience across Cairo studios and private clients.',
          instagram: 'https://www.instagram.com/elcaptain',
          tiktok: 'https://www.tiktok.com/@elcaptain',
          sports: { create: [{ sportId: yoga.id }] },
        },
      },
    },
  });

  // A venue and three group sessions next week, so the seeded coach has something on the calendar.
  const venue =
    (await prisma.venue.findFirst({ where: { coachId: coach.id } })) ??
    (await prisma.venue.create({ data: { coachId: coach.id, name: 'El Captain Studio', address: '10 Tahrir Square', city: 'Cairo' } }));
  if ((await prisma.session.count({ where: { coachId: coach.id } })) === 0) {
    for (const days of [2, 4, 6]) {
      const startsAt = new Date();
      startsAt.setUTCDate(startsAt.getUTCDate() + days);
      startsAt.setUTCHours(5, 0, 0, 0); // 07:00 or 08:00 in Cairo depending on the season
      await prisma.session.create({
        data: {
          coachId: coach.id,
          sportId: yoga.id,
          venueId: venue.id,
          type: 'GROUP',
          level: 'ALL_LEVELS',
          title: 'Sunrise Yoga Flow',
          description: 'A steady, breath-led flow to open the morning. Mats provided.',
          startsAt,
          durationMin: 60,
          price: 350,
          capacity: 12,
        },
      });
    }
  }
  await prisma.coachProfile.update({ where: { userId: coach.id }, data: { privatePrice: 800, privateDuration: 60 } });

  console.log('Seed complete. Users:', admin.email, client.email, user.email, coach.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
