import { NextResponse } from 'next/server'
import { assertFound, assertValid, protect, type AuthContext } from '@/lib/api'
import { findCoach } from '@/prisma/models/coach-profile'
import { toSessionRequestDTO } from '@/lib/dto'
import { createSessionRequest, listSessionRequests } from '@/prisma/models/session-request'

/** A user asks a coach for a session. */
async function request({ req, user }: AuthContext) {
  const { coachId, message } = await req.json()
  assertValid(coachId && message?.trim(), 'coachId and message are required')
  assertFound(await findCoach(coachId), 'Coach not found')

  const created = await createSessionRequest({ coachId, userId: user.id, message })
  return NextResponse.json(toSessionRequestDTO(created), { status: 201 })
}

/** A coach sees the requests sent to them; an admin sees all of them. */
async function list({ user }: AuthContext) {
  const requests = await listSessionRequests(user.role === 'ADMIN' ? {} : { coachId: user.id })
  return NextResponse.json(requests.map(toSessionRequestDTO))
}

export const POST = protect(request, ['USER'])
export const GET = protect(list, ['COACH', 'ADMIN'])
