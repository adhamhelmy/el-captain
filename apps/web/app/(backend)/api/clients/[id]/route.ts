import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

function toDTO(user: any) {
  return {
    id: user.id,
    userId: user.id,
    clientName: user.name,
    studioName: user.clientProfile?.studioName ?? null,
    studioDescription: user.clientProfile?.studioDescription ?? null,
    city: user.clientProfile?.city ?? null,
    logoUrl: user.clientProfile?.logoUrl ?? null,
    website: user.clientProfile?.website ?? null,
    instagram: user.clientProfile?.instagram ?? null,
    phone: user.clientProfile?.phone ?? null,
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id, role: 'CLIENT' },
    include: { clientProfile: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(toDTO(user))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { studioName, studioDescription, city, logoUrl, website, instagram, phone, name } = body

  await prisma.$transaction(async (tx: Tx) => {
    if (name) await tx.user.update({ where: { id }, data: { name } })
    await tx.clientProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        studioName: studioName ?? 'My Studio',
        studioDescription,
        city,
        logoUrl,
        website,
        instagram,
        phone,
      },
      update: {
        ...(studioName !== undefined && { studioName }),
        ...(studioDescription !== undefined && { studioDescription }),
        ...(city !== undefined && { city }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(website !== undefined && { website }),
        ...(instagram !== undefined && { instagram }),
        ...(phone !== undefined && { phone }),
      },
    })
  })

  const updated = await prisma.user.findUnique({
    where: { id },
    include: { clientProfile: true },
  })
  return NextResponse.json(toDTO(updated))
}
