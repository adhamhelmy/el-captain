import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { countPendingRequests } from '@/prisma/models/private-request';

/** How many private requests the coach still has to answer, for the nav badge. */
async function pending({ user }: AuthContext) {
  await assertActiveCoach(user);
  return NextResponse.json({ count: await countPendingRequests(user.id) });
}

export const GET = protect(pending, ['COACH']);
