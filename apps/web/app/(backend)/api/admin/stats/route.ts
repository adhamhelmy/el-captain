import { NextResponse } from 'next/server';
import { protect } from '@/lib/server/api';
import { adminStats } from '@/prisma/models/insights';

async function stats() {
  return NextResponse.json(await adminStats());
}

export const GET = protect(stats, ['ADMIN']);
