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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const classes = [
    { title: 'Morning Kickboxing', type: 'kickboxing', city: 'Cairo', address: '10 Tahrir Square', capacity: 15 },
    { title: 'Power Yoga', type: 'yoga', city: 'Cairo', address: '10 Tahrir Square', capacity: 10 },
    { title: 'Pilates Basics', type: 'pilates', city: 'Alexandria', address: '5 Corniche St', capacity: 12 },
  ];

  for (const c of classes) {
    await prisma.class.create({
      data: {
        ...c,
        description: `A great ${c.type} class for all levels.`,
        date: tomorrow,
        durationMinutes: 60,
        spotsLeft: c.capacity,
        clientId: client.id,
      },
    });
  }

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

  console.log('Seed complete. Users:', admin.email, client.email, user.email, coach.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
