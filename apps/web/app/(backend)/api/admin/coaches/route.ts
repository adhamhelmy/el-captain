import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { toAdminCoachRowDTO } from '@/lib/server/dto';
import { many, oneOf, readFilter, search } from '@/lib/server/query-filter';
import { COACH_STATUSES } from '@/lib/shared/coach-rules';
import { listCoachesForAdmin } from '@/prisma/models/coach-profile';

/** ?status=, ?sport= (repeatable) and ?q= (name or email). */
const FILTER = { status: oneOf('status', COACH_STATUSES), sportIds: many('sport'), q: search() };

async function list({ query, page }: AuthContext) {
  const coaches = await listCoachesForAdmin(readFilter(query, FILTER), page);
  return NextResponse.json(coaches.map(toAdminCoachRowDTO));
}

export const GET = protect(list, ['ADMIN']);
