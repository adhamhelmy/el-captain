import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/api';
import { toAdminCoachRowDTO } from '@/lib/dto';
import { isCoachStatus } from '@/lib/coach-rules';
import { listCoachesForAdmin } from '@/prisma/models/coach-profile';

async function list({ query, page }: AuthContext) {
  const status = query.get('status');
  const coaches = await listCoachesForAdmin(isCoachStatus(status) ? status : undefined, page);
  return NextResponse.json(coaches.map(toAdminCoachRowDTO));
}

export const GET = protect(list, ['ADMIN']);
