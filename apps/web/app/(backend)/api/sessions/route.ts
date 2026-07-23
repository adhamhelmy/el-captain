import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toDTO(s: any) {
  return {
    id: s.id,
    message: s.message,
    status: s.status,
    userId: s.userId,
    userName: s.user.name,
    userEmail: s.user.email,
    coachId: s.coachId,
    coachName: s.coach.name,
    createdAt: s.createdAt.toISOString(),
  }
}

// POST /api/sessions — user sends a session request to a coach
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'USER') {
    return NextResponse.json({ error: 'Only users can request sessions' }, { status: 403 })
  }

  const { coachId, message } = await req.json()
  if (!coachId || !message?.trim()) {
    return NextResponse.json({ error: 'coachId and message are required' }, { status: 400 })
  }

  const coach = await prisma.user.findUnique({ where: { id: coachId, role: 'COACH' } })
  if (!coach) return NextResponse.json({ error: 'Coach not found' }, { status: 404 })

  const request = await prisma.sessionRequest.create({
    data: { coachId, userId: session.user.id, message },
    include: { user: true, coach: true },
  })

  return NextResponse.json(toDTO(request), { status: 201 })
}

// GET /api/sessions — coach sees their incoming requests
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'COACH' && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const requests = await prisma.sessionRequest.findMany({
    where: session.user.role === 'ADMIN' ? {} : { coachId: session.user.id },
    include: { user: true, coach: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requests.map(toDTO))
}
