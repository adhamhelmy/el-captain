import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toDTO(b: any) {
  const c = b.class
  return {
    id: b.id,
    status: b.status,
    classId: b.classId,
    createdAt: b.createdAt.toISOString(),
    class: {
      id: c.id, title: c.title, type: c.type, description: c.description,
      date: c.date.toISOString(), durationMinutes: c.durationMinutes,
      city: c.city, address: c.address, capacity: c.capacity, spotsLeft: c.spotsLeft,
      imageUrl: c.imageUrl, clientId: c.clientId,
      clientName: c.client.name,
      studioName: c.client.clientProfile?.studioName ?? null,
      createdAt: c.createdAt.toISOString(),
    },
  }
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { class: { include: { client: { include: { clientProfile: true } } } } },
    orderBy: { class: { date: 'asc' } },
  })

  return NextResponse.json(bookings.map(toDTO))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { classId } = await req.json()
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const cls = await prisma.class.findUnique({ where: { id: classId } })
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  const existing = await prisma.booking.findUnique({
    where: { userId_classId: { userId: session.user.id, classId } },
  })

  // Already confirmed — don't double-book
  if (existing?.status === 'CONFIRMED') {
    return NextResponse.json({ error: 'You already have an active booking for this class' }, { status: 409 })
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const updated = await tx.class.updateMany({
        where: { id: classId, spotsLeft: { gt: 0 } },
        data: { spotsLeft: { decrement: 1 } },
      })
      if (updated.count === 0) throw new Error('NO_SPOTS')

      if (existing?.status === 'CANCELLED') {
        // Re-activate cancelled booking
        return tx.booking.update({
          where: { id: existing.id },
          data: { status: 'CONFIRMED' },
          include: { class: { include: { client: { include: { clientProfile: true } } } } },
        })
      }

      return tx.booking.create({
        data: { userId: session.user.id, classId },
        include: { class: { include: { client: { include: { clientProfile: true } } } } },
      })
    })
    return NextResponse.json(toDTO(booking), { status: 201 })
  } catch (e: any) {
    if (e?.message === 'NO_SPOTS') {
      return NextResponse.json({ error: 'No spots available' }, { status: 409 })
    }
    throw e
  }
}
