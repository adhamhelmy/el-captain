import { NextResponse } from 'next/server';
import { assertAllowed, assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { blobInfo } from '@/lib/server/blob';
import { CERT_TITLE_MAX, MAX_CERTS, ownsUpload, UPLOAD_RULES } from '@/lib/shared/coach-rules';
import { toCertificationDTO } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { createCertification } from '@/prisma/models/certification';
import { findCoach } from '@/prisma/models/coach-profile';

/** Attaches an uploaded file to the profile. Type and size come from Blob, not from the browser. */
async function addCertification({ req, user, params: { id } }: AuthContext<{ id: string }>) {
  assertAllowed(user.id === id);

  const coach = await findCoach(id);
  assertFound(coach?.coachProfile);

  const profile = coach.coachProfile;
  assertNoConflict(profile.status !== 'PENDING', 'Profile is under review', ERROR_CODES.PROFILE_LOCKED);
  assertValid(profile.certifications.length < MAX_CERTS, 'Too many certifications', ERROR_CODES.INVALID_PROFILE);

  const { title, filePath, fileName } = await req.json();
  const name = typeof title === 'string' ? title.trim() : '';
  assertValid(name && name.length <= CERT_TITLE_MAX, 'Invalid title', ERROR_CODES.INVALID_PROFILE);
  assertValid(ownsUpload(id, 'certificate', filePath), 'Invalid file', ERROR_CODES.INVALID_UPLOAD);

  const info = await blobInfo(filePath);
  assertValid(info && UPLOAD_RULES.certificate.types.includes(info.contentType), 'Invalid file', ERROR_CODES.INVALID_UPLOAD);

  const cert = await createCertification(profile.id, {
    title: name,
    filePath,
    fileName: typeof fileName === 'string' && fileName.trim() ? fileName.trim().slice(0, 200) : filePath.split('/').pop()!,
    contentType: info.contentType,
    size: info.size,
  });
  return NextResponse.json(toCertificationDTO(cert), { status: 201 });
}

export const POST = protect(addCertification, ['COACH']);
