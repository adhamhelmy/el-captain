import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { toVenueDTO } from '@/lib/server/dto';
import { readVenue } from '@/lib/server/venue-input';
import { assertCanManageVenues } from '@/lib/server/coach-guard';
import { createVenue, listVenues } from '@/prisma/models/venue';

/** The coach's venues, each with its count of upcoming sessions. */
async function list({ user }: AuthContext) {
  await assertCanManageVenues(user);
  return NextResponse.json((await listVenues(user.id)).map(({ _count, ...v }) => ({ ...toVenueDTO(v), upcoming: _count.sessions })));
}

async function add({ req, user }: AuthContext) {
  await assertCanManageVenues(user);
  const venue = await createVenue(user.id, readVenue(await req.json()));
  return NextResponse.json(toVenueDTO(venue), { status: 201 });
}

export const GET = protect(list, ['COACH']);
export const POST = protect(add, ['COACH']);
