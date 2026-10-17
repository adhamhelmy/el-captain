import { assertAllowed, assertFound, protect, type AuthContext } from '@/lib/server/api';
import { readBlob } from '@/lib/server/blob';
import { findCertification } from '@/prisma/models/certification';
import { findActiveCoach } from '@/prisma/models/coach-profile';

/**
 * The certificate file, for its coach, admins, and signed-in members viewing an approved coach's profile.
 * Other coaches and guests can't open it, and the storage URL never reaches the browser.
 */
async function certificateFile({ user, params: { id, certId } }: AuthContext<{ id: string; certId: string }>) {
  const member = user.role === 'USER';
  assertAllowed(user.id === id || user.role === 'ADMIN' || member);
  if (member) assertFound(await findActiveCoach(id));
  const cert = await findCertification(certId, id);
  assertFound(cert);

  return new Response(await readBlob(cert.filePath), {
    headers: {
      'Content-Type': cert.contentType,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(cert.fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const GET = protect(certificateFile, ['COACH', 'ADMIN', 'USER']);
