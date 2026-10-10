import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { toRequestDTO } from '@/lib/server/dto';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { listCoachRequests, listMemberRequests } from '@/prisma/models/private-request';

/** A member's sent requests, or a coach's received ones, newest first. */
async function mine({ user }: AuthContext) {
  await assertActiveCoach(user);
  const list = user.role === 'COACH' ? await listCoachRequests(user.id) : await listMemberRequests(user.id);
  const now = new Date();
  return NextResponse.json(list.map((r) => toRequestDTO(r, now)));
}

export const GET = protect(mine, ['USER', 'COACH']);
