import { NextResponse } from 'next/server';
import { assertFound, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { toAdminMemberDTO } from '@/lib/server/dto';
import { findMember, setMemberSuspended } from '@/prisma/models/member';

async function get({ params: { id } }: AuthContext<{ id: string }>) {
  const member = await findMember(id);
  assertFound(member);
  return NextResponse.json(toAdminMemberDTO(member));
}

/** Suspends ({ suspended: true }) or reinstates a member. Coaches are suspended from their review page instead. */
async function update({ req, params: { id } }: AuthContext<{ id: string }>) {
  const { suspended } = await req.json();
  assertValid(typeof suspended === 'boolean', 'suspended must be true or false');

  const member = await setMemberSuspended(id, suspended);
  assertFound(member);
  return NextResponse.json(toAdminMemberDTO(member));
}

export const GET = protect(get, ['ADMIN']);
export const PATCH = protect(update, ['ADMIN']);
