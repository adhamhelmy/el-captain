import { NextResponse } from 'next/server'
import { assertAllowed, assertFound, protect, publicRoute, type AuthContext, type RequestContext } from '@/lib/api'
import { toCoachDTO } from '@/lib/dto'
import { findCoach, updateCoach } from '@/prisma/models/coach-profile'

async function getCoach({ params: { id } }: RequestContext<{ id: string }>) {
  const user = await findCoach(id)
  
  assertFound(user)
  return NextResponse.json(toCoachDTO(user))
}

async function updateCoachProfile({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  assertAllowed(user.id === id || user.role === 'ADMIN')

  const { name, bio, specialties, city, photoUrl, website, instagram, phone } = await req.json()
  const updated = await updateCoach(id, { name, bio, specialties, city, photoUrl, website, instagram, phone })

  return NextResponse.json(toCoachDTO(updated))
}

export const GET = publicRoute(getCoach)
export const PATCH = protect(updateCoachProfile, ['COACH', 'ADMIN'])
