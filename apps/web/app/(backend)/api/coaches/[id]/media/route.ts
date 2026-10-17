import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { blobInfo } from '@/lib/server/blob';
import { toMediaDTO } from '@/lib/server/dto';
import { MAX_MEDIA, mediaKindOf, ownsUpload, UPLOAD_RULES } from '@/lib/shared/coach-rules';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { findCoach } from '@/prisma/models/coach-profile';
import { createMedia } from '@/prisma/models/media';
import { readDuration, readMediaDetails } from './details';

/** Attaches an uploaded photo or video to the profile. Kind, type and size come from Blob, not from the browser. */
async function addMedia({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  assertAllowed(user.id === id);

  const coach = await findCoach(id);
  assertFound(coach?.coachProfile);

  const profile = coach.coachProfile;
  assertNoConflict(profile.status !== 'PENDING', 'Profile is under review', ERROR_CODES.PROFILE_LOCKED);
  assertValid(profile.media.length < MAX_MEDIA, 'Too many photos and videos', ERROR_CODES.INVALID_PROFILE);

  const body = await req.json();
  const details = readMediaDetails(body, profile.sports.map((s) => s.sportId));
  // Photos and videos share a folder, so either kind's rule checks the path.
  assertValid(ownsUpload(id, 'mediaPhoto', body.filePath), 'Invalid file', ERROR_CODES.INVALID_UPLOAD);

  const info = await blobInfo(body.filePath);
  const kind = info && mediaKindOf(info.contentType);
  assertValid(info && kind && info.size <= UPLOAD_RULES[kind].maxBytes, 'Invalid file', ERROR_CODES.INVALID_UPLOAD);

  const video = kind === 'mediaVideo';
  const media = await createMedia(profile.id, {
    ...details,
    kind: video ? 'VIDEO' : 'PHOTO',
    filePath: body.filePath,
    contentType: info.contentType,
    size: info.size,
    durationSec: video ? readDuration(body.durationSec) : null,
  });
  return NextResponse.json(toMediaDTO(media), { status: 201 });
}

export const POST = protect(addMedia, ['COACH']);
