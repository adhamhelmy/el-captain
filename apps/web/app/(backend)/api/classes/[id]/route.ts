import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toDTO(c: any) {
  return {
    id: c.id, title: c.title, type: c.type, description: c.description,
    date: c.date.toISOString(), durationMinutes: c.durationMinutes,
    city: c.city, address: c.address, capacity: c.capacity, spotsLeft: c.spotsLeft,
    imageUrl: c.imageUrl, clientId: c.clientId,
    clientName: c.client.name,
    studioName: c.client.clientProfile?.studioName ?? null,
    createdAt: c.createdAt.toISOString(),
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: { client: { include: { clientProfile: true } } },
  })
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(toDTO(cls))
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cls = await prisma.class.findUnique({ where: { id: params.id } })
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = cls.clientId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const updated = await prisma.class.update({
    where: { id: params.id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.type && { type: body.type }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.date && { date: new Date(body.date) }),
      ...(body.durationMinutes && { durationMinutes: Number(body.durationMinutes) }),
      ...(body.city && { city: body.city }),
      ...(body.address && { address: body.address }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
    },
    include: { client: { include: { clientProfile: true } } },
  })

  return NextResponse.json(toDTO(updated))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cls = await prisma.class.findUnique({ where: { id: params.id } })
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = cls.clientId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.class.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
