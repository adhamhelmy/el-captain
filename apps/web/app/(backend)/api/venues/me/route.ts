import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { toVenueDTO } from '@/lib/server/dto';
import { readVenue } from '@/lib/server/venue-input';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { createVenue, listVenues } from '@/prisma/models/venue';

async function list({ user }: AuthContext) {
  await assertActiveCoach(user);
  return NextResponse.json((await listVenues(user.id)).map(toVenueDTO));
}

async function add({ req, user }: AuthContext) {
  await assertActiveCoach(user);
  const venue = await createVenue(user.id, readVenue(await req.json()));
  return NextResponse.json(toVenueDTO(venue), { status: 201 });
}

export const GET = protect(list, ['COACH']);
export const POST = protect(add, ['COACH']);
