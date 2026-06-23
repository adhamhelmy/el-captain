import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@elcaptain.com' },
    update: {},
    create: {
      email: 'admin@elcaptain.com',
      passwordHash: await hash('admin123'),
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  const client = await prisma.user.upsert({
    where: { email: 'studio@elcaptain.com' },
    update: {},
    create: {
      email: 'studio@elcaptain.com',
      passwordHash: await hash('studio123'),
      name: 'Cairo Fitness',
      role: 'CLIENT',
      clientProfile: {
        create: {
          studioName: 'Cairo Fitness',
          studioDescription: 'Premium fitness studio in Cairo',
          city: 'Cairo',
        },
      },
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@elcaptain.com' },
    update: {},
    create: {
      email: 'user@elcaptain.com',
      passwordHash: await hash('user123'),
      name: 'Ahmed Ali',
      role: 'USER',
    },
  })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  const classes = [
    { title: 'Morning Kickboxing', type: 'kickboxing', city: 'Cairo', address: '10 Tahrir Square', capacity: 15 },
    { title: 'Power Yoga', type: 'yoga', city: 'Cairo', address: '10 Tahrir Square', capacity: 10 },
    { title: 'Pilates Basics', type: 'pilates', city: 'Alexandria', address: '5 Corniche St', capacity: 12 },
  ]

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
    })
  }

  console.log('Seed complete. Users:', admin.email, client.email, user.email)
}

main().catch(console.error).finally(() => prisma.$disconnect())
