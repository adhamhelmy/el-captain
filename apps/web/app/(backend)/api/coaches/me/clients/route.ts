import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { toCoachClientDTO } from '@/lib/server/dto';
import { assertActiveCoach } from '@/lib/server/coach-guard';
import { listCoachClients } from '@/prisma/models/insights';

async function clients({ user }: AuthContext) {
  await assertActiveCoach(user);
  return NextResponse.json((await listCoachClients(user.id)).map(toCoachClientDTO));
}

export const GET = protect(clients, ['COACH']);
