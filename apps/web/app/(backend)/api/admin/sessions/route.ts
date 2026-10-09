import { NextResponse } from 'next/server';
import { protect, type AuthContext } from '@/lib/server/api';
import { toSessionDTO } from '@/lib/server/dto';
import { oneOf, readFilter, search } from '@/lib/server/query-filter';
import { WHENS } from '@/lib/shared/session-rules';
import { listAdminSessions } from '@/prisma/models/session';

const FILTER = { q: search(), status: oneOf('status', ['SCHEDULED', 'CANCELLED']), when: oneOf('when', WHENS) };

/** Every session, with ?q= (title or coach), ?status=SCHEDULED|CANCELLED, ?when=upcoming|past. */
async function list({ query, page }: AuthContext) {
  return NextResponse.json((await listAdminSessions(readFilter(query, FILTER), page)).map(toSessionDTO));
}

export const GET = protect(list, ['ADMIN']);
