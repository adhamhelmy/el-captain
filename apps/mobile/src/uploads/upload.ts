import { uploadPrefix, UPLOAD_RULES, type UploadKind } from '@el-captain/rules/coach-rules';
import { apiUrl, authHeaders } from '@/api/client';

/** Keeps the original name readable but safe as a path segment (as the web's upload.ts). */
const safeName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .slice(-80) || 'file';

export const uploadPath = (kind: UploadKind, userId: string, name: string) => `${uploadPrefix(userId, kind)}${safeName(name)}`;

/** Type and size checked here first so the coach gets an instant message; the server checks again. An unknown size passes. */
export function uploadCheck(kind: UploadKind, type: string, size: number | undefined) {
  const { types, maxBytes } = UPLOAD_RULES[kind];
  return types.includes(type) && (size === undefined || size <= maxBytes);
}

/** A file picked on the phone (image picker or document picker). */
export type PickedFile = { uri: string; name: string; type: string; size?: number };

export type UploadResult = { ok: true; path: string } | { ok: false; code: 'invalid_upload' | 'generic' };

/** Vercel Blob's API, as @vercel/blob calls it for a client upload (its SDK needs Node modules the phone lacks). */
const BLOB_API = 'https://vercel.com/api/blob';
const BLOB_API_VERSION = '12';

/** Our /api/uploads hands out a short-lived token for this one path, after checking the coach owns it. */
async function clientToken(pathname: string, kind: UploadKind) {
  const res = await fetch(apiUrl('/api/uploads'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname, clientPayload: kind, multipart: false } }),
  });
  if (!res.ok) throw new Error('token refused');
  return ((await res.json()) as { clientToken: string }).clientToken;
}

/**
 * Uploads one picked file straight to Blob, through the same token route as the web (/api/uploads),
 * and returns its pathname for the profile APIs.
 */
export async function uploadFile(kind: UploadKind, userId: string, file: PickedFile): Promise<UploadResult> {
  if (!uploadCheck(kind, file.type, file.size)) return { ok: false, code: 'invalid_upload' };
  try {
    const pathname = uploadPath(kind, userId, file.name);
    const token = await clientToken(pathname, kind);
    const body = await (await fetch(file.uri)).blob();
    const res = await fetch(`${BLOB_API}/?${new URLSearchParams({ pathname })}`, {
      method: 'PUT',
      body,
      headers: {
        authorization: `Bearer ${token}`,
        // A client token reads vercel_blob_client_<storeId>_<payload>.
        'x-vercel-blob-store-id': token.split('_')[3] ?? '',
        'x-vercel-blob-access': 'public',
        'x-content-type': file.type,
        'x-api-version': BLOB_API_VERSION,
      },
    });
    if (!res.ok) return { ok: false, code: 'generic' };
    return { ok: true, path: ((await res.json()) as { pathname: string }).pathname };
  } catch {
    return { ok: false, code: 'generic' };
  }
}
