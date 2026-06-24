import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cls = await prisma.class.findUnique({ where: { id } })
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = cls.clientId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const bookings = await prisma.booking.findMany({
    where: { classId: id, status: 'CONFIRMED' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(bookings.map((b: any) => ({
    bookingId: b.id,
    userId: b.user.id,
    name: b.user.name,
    email: b.user.email,
    bookedAt: b.createdAt.toISOString(),
  })))
}
