import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { coachStats } from '@/prisma/models/insights';

async function stats({ user }: AuthContext) {
  await assertActiveCoach(user);
  return NextResponse.json(await coachStats(user.id));
}

export const GET = protect(stats, ['COACH']);
