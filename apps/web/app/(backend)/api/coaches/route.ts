import { NextResponse } from 'next/server';
import { publicRoute, type RequestContext } from '@/lib/server/api';
import { toPublicCoachDTO } from '@/lib/server/dto';
import { readFilter, search, text } from '@/lib/server/query-filter';
import { listActiveCoaches } from '@/prisma/models/coach-profile';

const FILTER = { sportId: text('sport'), q: search() };

/** Approved coaches for members and guests, optionally for one sport (?sport=) or matching a name (?q=). */
async function list({ query, page }: RequestContext) {
  const coaches = await listActiveCoaches(readFilter(query, FILTER), page);
  return NextResponse.json(coaches.map(toPublicCoachDTO));
}

export const GET = publicRoute(list);
