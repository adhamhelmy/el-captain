import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, protect, type AuthContext } from '@/lib/server/api';
import { deleteBlob } from '@/lib/server/blob';
import { toMediaDTO } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { findCoach } from '@/prisma/models/coach-profile';
import { deleteMedia, findMedia, updateMedia } from '@/prisma/models/media';
import { countSessionsWithCover } from '@/prisma/models/session';
import { readMediaDetails } from '../details';

type Ctx = AuthContext<{ id: string; mediaId: string }>;

/** The coach's profile and the item, after the ownership and review-lock checks. */
async function ownItem({ user, params: { id, mediaId } }: Ctx) {
  assertAllowed(user.id === id);
  const coach = await findCoach(id);
  assertFound(coach?.coachProfile);
  assertNoConflict(coach.coachProfile.status !== 'PENDING', 'Profile is under review', ERROR_CODES.PROFILE_LOCKED);
  const media = await findMedia(mediaId, id);
  assertFound(media);
  return { profile: coach.coachProfile, media };
}

/** Changes the caption and sport. */
async function editMedia(ctx: Ctx) {
  const { profile, media } = await ownItem(ctx);
  const details = readMediaDetails(await ctx.req.json(), profile.sports.map((s) => s.sportId));
  return NextResponse.json(toMediaDTO(await updateMedia(media.id, details)));
}

async function removeMedia(ctx: Ctx) {
  const { media } = await ownItem(ctx);
  await deleteMedia(media.id);
  // A session may use this photo as its cover; the file stays until nothing points at it.
  if ((await countSessionsWithCover(media.filePath)) === 0) await deleteBlob(media.filePath);
  return new Response(null, { status: 204 });
}

export const PATCH = protect(editMedia, ['COACH']);
export const DELETE = protect(removeMedia, ['COACH']);
