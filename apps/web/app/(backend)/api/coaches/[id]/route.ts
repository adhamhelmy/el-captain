import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toDTO(user: any) {
  return {
    id: user.id,
    userId: user.id,
    coachName: user.name,
    bio: user.coachProfile?.bio ?? null,
    specialties: user.coachProfile?.specialties ?? null,
    city: user.coachProfile?.city ?? null,
    photoUrl: user.coachProfile?.photoUrl ?? null,
    website: user.coachProfile?.website ?? null,
    instagram: user.coachProfile?.instagram ?? null,
    phone: user.coachProfile?.phone ?? null,
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id, role: 'COACH' },
    include: { coachProfile: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(toDTO(user))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user.id !== id && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, bio, specialties, city, photoUrl, website, instagram, phone } = await req.json()

  await prisma.$transaction(async (tx: any) => {
    if (name) await tx.user.update({ where: { id }, data: { name } })
    await tx.coachProfile.upsert({
      where: { userId: id },
      create: { userId: id, bio, specialties, city, photoUrl, website, instagram, phone },
      update: { bio, specialties, city, photoUrl, website, instagram, phone },
    })
  })

  const updated = await prisma.user.findUnique({ where: { id }, include: { coachProfile: true } })
  return NextResponse.json(toDTO(updated))
}
