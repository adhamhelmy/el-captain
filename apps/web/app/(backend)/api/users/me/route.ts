import { NextResponse } from 'next/server';
import { assertFound, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { toMemberDTO } from '@/lib/server/dto';
import { NAME_MAX } from '@/lib/shared/coach-rules';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { cleanPhone, MAX_FAVOURITE_SPORTS } from '@/lib/shared/member-rules';
import { findMember, updateMember, type MemberUpdate } from '@/prisma/models/member';
import { countSports } from '@/prisma/models/sport';

const invalid = (ok: unknown, message: string) => assertValid(ok, message, ERROR_CODES.INVALID_PROFILE);

function name(value: unknown) {
  if (value === undefined) return undefined;
  const trimmed = typeof value === 'string' ? value.trim() : '';
  invalid(trimmed.length >= 1 && trimmed.length <= NAME_MAX, 'Invalid name');
  return trimmed;
}

/** "" or null clears the phone. */
function phone(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const cleaned = typeof value === 'string' ? cleanPhone(value) : null;
  invalid(cleaned, 'Invalid phone');
  return cleaned;
}

async function sportIds(value: unknown) {
  if (value === undefined) return undefined;
  invalid(Array.isArray(value) && value.length <= MAX_FAVOURITE_SPORTS && value.every((v) => typeof v === 'string'), 'Invalid sports');
  const ids = value as string[];
  invalid(new Set(ids).size === ids.length, 'Duplicate sports');
  invalid((await countSports(ids)) === ids.length, 'Unknown sport');
  return ids;
}

async function get({ user }: AuthContext) {
  const member = await findMember(user.id);
  assertFound(member);
  return NextResponse.json(toMemberDTO(member));
}

/** Saves the given parts of the member's own profile. The email can't be changed here. */
async function update({ req, user }: AuthContext) {
  const body = await req.json();
  invalid(body && typeof body === 'object', 'Invalid body');
  const changes: MemberUpdate = { name: name(body.name), phone: phone(body.phone), sportIds: await sportIds(body.sportIds) };
  const updated = await updateMember(user.id, changes);
  return NextResponse.json(toMemberDTO(updated));
}

export const GET = protect(get, ['USER']);
export const PATCH = protect(update, ['USER']);
