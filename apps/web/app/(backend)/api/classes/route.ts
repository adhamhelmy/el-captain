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
  const types = searchParams.getAll('type')
  const date = searchParams.get('date')
  const city = searchParams.get('city')
  const clientId = searchParams.get('clientId')
  const q = searchParams.get('q')
  const limit = Math.min(Number(searchParams.get('limit') ?? 12), 50)
  const offset = Number(searchParams.get('offset') ?? 0)

  const classes = await prisma.class.findMany({
    where: {
      // default: show from start of today, or from the chosen date
      ...(!clientId ? {
        date: {
          gte: date ? new Date(date) : (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()
        }
      } : {}),
      ...(date && clientId ? { date: { gte: new Date(date) } } : {}),
      ...(types.length ? { type: { in: types.map(t => t.toLowerCase()), mode: 'insensitive' } } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      ...(clientId ? { clientId } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { type: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: { client: { include: { clientProfile: true } } },
    orderBy: { date: 'asc' },
    take: limit,
    skip: offset,
  })

  return NextResponse.json(classes.map(toDTO))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'CLIENT' && session.user.role !== 'ADMIN')) {
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
