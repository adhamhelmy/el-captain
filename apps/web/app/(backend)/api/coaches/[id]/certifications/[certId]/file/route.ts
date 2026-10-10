import { assertAllowed, assertFound, protect, type AuthContext } from '@/lib/server/api';
import { readBlob } from '@/lib/server/blob';
import { findCertification } from '@/prisma/models/certification';

/** The certificate file, for its coach and admins only. The storage URL never reaches the browser. */
async function certificateFile({ user, params: { id, certId } }: AuthContext<{ id: string; certId: string }>) {
  assertAllowed(user.id === id || user.role === 'ADMIN');
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

export const GET = protect(certificateFile, ['COACH', 'ADMIN']);
