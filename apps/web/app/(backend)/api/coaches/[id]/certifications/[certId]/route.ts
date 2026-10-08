import { assertAllowed, assertFound, assertNoConflict, protect, type AuthContext } from '@/lib/api';
import { deleteBlob } from '@/lib/blob';
import { ERROR_CODES } from '@/lib/error-codes';
import { deleteCertification, findCertification } from '@/prisma/models/certification';
import { findCoach } from '@/prisma/models/coach-profile';

async function removeCertification({ user, params: { id, certId } }: AuthContext<{ id: string; certId: string }>) {
  assertAllowed(user.id === id);

  const coach = await findCoach(id);
  assertFound(coach?.coachProfile);
  assertNoConflict(coach.coachProfile.status !== 'PENDING', 'Profile is under review', ERROR_CODES.PROFILE_LOCKED);

  const cert = await findCertification(certId, id);
  assertFound(cert);

  await deleteCertification(cert.id);
  await deleteBlob(cert.filePath);
  return new Response(null, { status: 204 });
}

export const DELETE = protect(removeCertification, ['COACH']);
