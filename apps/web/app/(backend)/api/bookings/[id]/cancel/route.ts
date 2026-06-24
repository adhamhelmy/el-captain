import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 409 })

  await prisma.$transaction(async (tx: Tx) => {
    await tx.booking.update({ where: { id }, data: { status: 'CANCELLED' } })
    await tx.class.update({ where: { id: booking.classId }, data: { spotsLeft: { increment: 1 } } })
  })

  return NextResponse.json({ success: true })
}
