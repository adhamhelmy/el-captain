import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/sessions/[id] — coach accepts or declines
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await req.json()
  if (!['ACCEPTED', 'DECLINED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const request = await prisma.sessionRequest.findUnique({ where: { id } })
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (request.coachId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.sessionRequest.update({
    where: { id },
    data: { status },
    include: { user: true, coach: true },
  })

  return NextResponse.json({
    id: updated.id,
    message: updated.message,
    status: updated.status,
    userId: updated.userId,
    userName: updated.user.name,
    userEmail: updated.user.email,
    coachId: updated.coachId,
    coachName: updated.coach.name,
    createdAt: updated.createdAt.toISOString(),
  })
}
