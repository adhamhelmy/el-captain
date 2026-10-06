import { NextResponse } from 'next/server'
import { assertAllowed, assertFound, protect, publicRoute, type AuthContext, type RequestContext } from '@/lib/api'
import { toClientDTO } from '@/lib/dto'
import { findClient, updateClient } from '@/prisma/models/client-profile'

async function getStudio({ params: { id } }: RequestContext<{ id: string }>) {
  const user = await findClient(id)
  
  assertFound(user)
  return NextResponse.json(toClientDTO(user))
}

async function updateStudio({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  assertAllowed(user.id === id)

  const { name, studioName, studioDescription, city, logoUrl, website, instagram, phone } = await req.json()
  const updated = await updateClient(id, { name, studioName, studioDescription, city, logoUrl, website, instagram, phone })

  return NextResponse.json(toClientDTO(updated))
}

export const GET = publicRoute(getStudio)
export const PATCH = protect(updateStudio, ['STUDIO'])
