import { NextResponse } from 'next/server';
import { assertFound, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { findSport, mergeSport } from '@/prisma/models/sport';

/** Folds a duplicate sport into the one to keep; its coaches move over. */
async function merge({ req, params: { id } }: AuthContext<{ id: string }>) {
  const { intoId } = await req.json();
  assertValid(typeof intoId === 'string' && intoId !== id, 'Pick another sport');
  assertFound(await findSport(id));

  const into = await findSport(intoId);
  assertFound(into);
  assertValid(into.status === 'APPROVED', 'Merge into an approved sport');

  await mergeSport(id, intoId);
  return NextResponse.json({ mergedInto: intoId });
}

export const POST = protect(merge, ['ADMIN']);
