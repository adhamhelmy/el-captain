import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { assertNoConflict, assertValid, protect, publicRoute, type AuthContext, type RequestContext } from '@/lib/api';
import { authOptions } from '@/lib/auth';
import { cleanSportName, isValidSportName, sportKey } from '@/lib/coach-rules';
import { toSportDTO } from '@/lib/dto';
import { ERROR_CODES } from '@/lib/error-codes';
import { createSport, findSportByKey, listVisibleSports } from '@/prisma/models/sport';

/** Sports to pick from. Pending sports are only listed for the coach who added them. */
async function list({ query }: RequestContext) {
  const session = await getServerSession(authOptions);
  const sports = await listVisibleSports(session?.user.id ?? null, query.get('q')?.trim() || undefined);
  return NextResponse.json(sports.map(toSportDTO));
}

/** A coach adds a sport that isn't listed. It stays hidden from others until an admin approves it. */
async function add({ req, user }: AuthContext) {
  const { name } = await req.json();
  const nameEn = cleanSportName(name);
  assertValid(isValidSportName(nameEn), 'Invalid sport name', ERROR_CODES.INVALID_PROFILE);

  const existing = await findSportByKey(sportKey(nameEn));
  assertNoConflict(!existing, 'Sport exists', ERROR_CODES.SPORT_EXISTS, existing ? { sport: toSportDTO(existing) } : undefined);

  const sport = await createSport({ nameEn, status: 'PENDING', createdById: user.id });
  return NextResponse.json(toSportDTO(sport), { status: 201 });
}

export const GET = publicRoute(list);
export const POST = protect(add, ['COACH']);
