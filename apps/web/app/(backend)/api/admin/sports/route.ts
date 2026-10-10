import { NextResponse } from 'next/server';
import { assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { cleanSportName, isValidSportName, sportKey } from '@/lib/shared/coach-rules';
import { toSportDTO } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { createSport, findSportByKey, listSportsForAdmin } from '@/prisma/models/sport';

async function list() {
  const sports = await listSportsForAdmin();
  return NextResponse.json(sports.map((s) => ({ ...toSportDTO(s), coachCount: s._count.coaches })));
}

/** Sports an admin adds are approved straight away. */
async function add({ req }: AuthContext) {
  const body = await req.json();
  const nameEn = cleanSportName(body.nameEn);
  const nameAr = cleanSportName(body.nameAr) || null;

  assertValid(isValidSportName(nameEn), 'Invalid sport name', ERROR_CODES.INVALID_PROFILE);
  assertNoConflict(!(await findSportByKey(sportKey(nameEn))), 'Sport exists', ERROR_CODES.SPORT_EXISTS);

  const sport = await createSport({ nameEn, nameAr, status: 'APPROVED' });
  return NextResponse.json(toSportDTO(sport), { status: 201 });
}

export const GET = protect(list, ['ADMIN']);
export const POST = protect(add, ['ADMIN']);
