import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const classes = await prisma.class.findMany({
    include: { client: { include: { clientProfile: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return NextResponse.json(classes.map((c: any) => ({
    id: c.id, title: c.title, type: c.type, description: c.description,
    date: c.date.toISOString(), durationMinutes: c.durationMinutes,
    city: c.city, address: c.address, capacity: c.capacity, spotsLeft: c.spotsLeft,
    imageUrl: c.imageUrl, clientId: c.clientId,
    clientName: c.client.name,
    studioName: c.client.clientProfile?.studioName ?? null,
    createdAt: c.createdAt.toISOString(),
  })))
}
