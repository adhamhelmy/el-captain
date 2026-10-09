import { NextResponse } from 'next/server';
import { assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { cleanSportName, isValidSportName, sportKey } from '@/lib/shared/coach-rules';
import { toSportDTO } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { findSport, findSportByKey, updateSport } from '@/prisma/models/sport';

/** Rename (either language) and/or approve a sport. */
async function edit({ req, params: { id } }: AuthContext<{ id: string }>) {
  const sport = await findSport(id);
  assertFound(sport);

  const body = await req.json();
  const data: { nameEn?: string; nameAr?: string | null; status?: 'APPROVED' } = {};

  if (body.nameEn !== undefined) {
    const nameEn = cleanSportName(body.nameEn);
    assertValid(isValidSportName(nameEn), 'Invalid sport name', ERROR_CODES.INVALID_PROFILE);

    const clash = await findSportByKey(sportKey(nameEn));
    assertNoConflict(!clash || clash.id === id, 'Sport exists', ERROR_CODES.SPORT_EXISTS);
    data.nameEn = nameEn;
  }
  if (body.nameAr !== undefined) data.nameAr = cleanSportName(body.nameAr) || null;
  if (body.approve === true) data.status = 'APPROVED';

  return NextResponse.json(toSportDTO(await updateSport(id, data)));
}

export const PATCH = protect(edit, ['ADMIN']);
