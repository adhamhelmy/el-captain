import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toDTO(c: any) {
  return {
    id: c.id,
    title: c.title,
    type: c.type,
    description: c.description,
    date: c.date.toISOString(),
    durationMinutes: c.durationMinutes,
    city: c.city,
    address: c.address,
    capacity: c.capacity,
    spotsLeft: c.spotsLeft,
    imageUrl: c.imageUrl,
    clientId: c.clientId,
    clientName: c.client.name,
    studioName: c.client.clientProfile?.studioName ?? null,
    createdAt: c.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const date = searchParams.get('date')
  const city = searchParams.get('city')

  const classes = await prisma.class.findMany({
    where: {
      ...(type ? { type: { contains: type, mode: 'insensitive' } } : {}),
      ...(date ? { date: { gte: new Date(date) } } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
    },
    include: { client: { include: { clientProfile: true } } },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(classes.map(toDTO))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, type, description, date, durationMinutes, city, address, capacity, imageUrl } = body

  if (!title || !type || !date || !durationMinutes || !city || !address || !capacity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const cls = await prisma.class.create({
    data: {
      title, type, description, date: new Date(date),
      durationMinutes: Number(durationMinutes),
      city, address,
      capacity: Number(capacity),
      spotsLeft: Number(capacity),
      imageUrl: imageUrl ?? null,
      clientId: session.user.id,
    },
    include: { client: { include: { clientProfile: true } } },
  })

  return NextResponse.json(toDTO(cls), { status: 201 })
}
