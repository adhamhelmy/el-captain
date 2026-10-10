import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { toMemberCoachDTO } from '@/lib/server/dto';
import { listMemberCoaches } from '@/prisma/models/insights';

async function coaches({ user }: AuthContext) {
  return NextResponse.json((await listMemberCoaches(user.id)).map(toMemberCoachDTO));
}

export const GET = protect(coaches, ['USER']);
