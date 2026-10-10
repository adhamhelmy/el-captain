import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, protect, type AuthContext, type AuthUser } from '@/lib/server/api';
import { toVenueDTO } from '@/lib/server/dto';
import { readVenue } from '@/lib/server/venue-input';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { archiveVenue, findVenue, updateVenue } from '@/prisma/models/venue';

async function ownVenue(id: string, user: AuthUser) {
  await assertActiveCoach(user);
  const venue = await findVenue(id);
  assertFound(venue);
  assertAllowed(venue.coachId === user.id);
  return venue;
}

async function edit({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  await ownVenue(id, user);
  return NextResponse.json(toVenueDTO(await updateVenue(id, readVenue(await req.json()))));
}

async function archive({ user, params: { id } }: AuthContext<{ id: string }>) {
  await ownVenue(id, user);
  return NextResponse.json(toVenueDTO(await archiveVenue(id)));
}

export const PATCH = protect(edit, ['COACH']);
export const DELETE = protect(archive, ['COACH']);
