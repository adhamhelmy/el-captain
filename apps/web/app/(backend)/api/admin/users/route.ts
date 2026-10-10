import { NextResponse } from 'next/server';
import { assertValid, protect, type AuthContext } from '@/lib/server/api';
import { toAdminMemberDTO } from '@/lib/server/dto';
import { search } from '@/lib/server/query-filter';
import { listMembersForAdmin } from '@/prisma/models/member';
import { updateUserRole } from '@/prisma/models/user';

const ASSIGNABLE_ROLES = new Set(['ADMIN', 'STUDIO', 'USER']);

/** Members, newest first, optionally matching a name or email (?q=). Coaches have their own list. */
async function list({ query, page }: AuthContext) {
  const members = await listMembersForAdmin(search()(query), page);
  return NextResponse.json(members.map(toAdminMemberDTO));
}

async function changeRole({ req }: AuthContext) {
  const { userId, role } = await req.json();

  assertValid(userId && role, 'userId and role required');
  assertValid(ASSIGNABLE_ROLES.has(role), 'Invalid role');

  await updateUserRole(userId, role);
  return NextResponse.json({ success: true });
}

export const GET = protect(list, ['ADMIN']);
export const PATCH = protect(changeRole, ['ADMIN']);
