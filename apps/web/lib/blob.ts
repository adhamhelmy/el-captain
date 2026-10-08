import { del, head } from '@vercel/blob';
import { HttpError } from '@/lib/api';

/**
 * Vercel Blob access. The database keeps pathnames only; this is the one place they become URLs,
 * so moving storage later means changing this file and copying the files.
 */
const base = () => (process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? '').replace(/\/$/, '');

export const blobUrl = (path: string) => `${base()}/${path}`;
export const blobUrlOrNull = (path: string | null | undefined) => (path ? blobUrl(path) : null);

/** The stored file's type and size, or null when nothing is stored at that path. */
export async function blobInfo(path: string) {
  try {
    const { contentType, size } = await head(blobUrl(path));
    return { contentType, size };
  } catch {
    return null;
  }
}

/** Removes a replaced or deleted file. Logged, not thrown: the database change already happened. */
export async function deleteBlob(path: string | null | undefined) {
  if (!path) return;
  try {
    await del(blobUrl(path));
  } catch (e) {
    console.error(`[blob] deleting ${path} failed`, e);
  }
}

/** The file's contents, so a route can pass them on without ever revealing its URL. 502 when the store fails. */
export async function readBlob(path: string) {
  const res = await fetch(blobUrl(path), { cache: 'no-store' });
  if (!res.ok || !res.body) throw new HttpError(502, 'File unavailable');
  return res.body;
}
