import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, protect, type AuthContext, type AuthUser } from '@/lib/server/api';
import { toVenueDTO } from '@/lib/server/dto';
import { readVenue } from '@/lib/server/venue-input';
import { assertCanManageVenues } from '@/lib/server/coach-guard';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { archiveVenueKeepingOne, findVenue, updateVenue } from '@/prisma/models/venue';

async function ownVenue(id: string, user: AuthUser) {
  await assertCanManageVenues(user);
  const venue = await findVenue(id);
  assertFound(venue);
  assertAllowed(venue.coachId === user.id);
  return venue;
}

async function edit({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  await ownVenue(id, user);
  return NextResponse.json(toVenueDTO(await updateVenue(id, readVenue(await req.json()))));
}

/** A coach always keeps at least one venue they can run sessions at. */
async function archive({ user, params: { id } }: AuthContext<{ id: string }>) {
  await ownVenue(id, user);
  const archived = await archiveVenueKeepingOne(id, user.id);
  assertNoConflict(archived, 'Keep at least one location', ERROR_CODES.LAST_VENUE);
  return NextResponse.json(toVenueDTO(archived));
}

export const PATCH = protect(edit, ['COACH']);
export const DELETE = protect(archive, ['COACH']);
