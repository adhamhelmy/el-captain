'use client';
import { upload } from '@vercel/blob/client';
import { uploadPrefix, UPLOAD_RULES, type UploadKind } from '@/lib/coach-rules';

/** Keeps the original name readable but safe as a path segment. */
const safeName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .slice(-80) || 'file';

/**
 * Uploads one file straight to Blob and returns its pathname for the profile APIs.
 * Type and size are checked here first so the coach gets an instant message; the server checks again.
 */
export async function uploadFile(kind: UploadKind, userId: string, file: File) {
  const { types, maxBytes } = UPLOAD_RULES[kind];
  if (!types.includes(file.type) || file.size > maxBytes) return { ok: false as const, code: 'invalid_upload' as const };
  try {
    const blob = await upload(`${uploadPrefix(userId, kind)}${safeName(file.name)}`, file, {
      access: 'public',
      handleUploadUrl: '/api/uploads',
      clientPayload: kind,
    });
    return { ok: true as const, path: blob.pathname };
  } catch {
    return { ok: false as const, code: 'generic' as const };
  }
}
