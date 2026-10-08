import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/blob', () => ({ head: vi.fn(), del: vi.fn() }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import { del, head } from '@vercel/blob';
import { blobInfo, blobUrl, blobUrlOrNull, deleteBlob, readBlob } from './blob';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_BLOB_BASE_URL', 'https://store.public.blob.vercel-storage.com/');
});

describe('blobUrl', () => {
  it('joins the store base URL and the path', () => {
    expect(blobUrl('coaches/u1/photo/a.jpg')).toBe('https://store.public.blob.vercel-storage.com/coaches/u1/photo/a.jpg');
    expect(blobUrlOrNull(null)).toBeNull();
  });
});

describe('blobInfo', () => {
  it('returns the type and size of an existing blob', async () => {
    vi.mocked(head).mockResolvedValue({ contentType: 'image/png', size: 10 } as any);
    expect(await blobInfo('coaches/u1/photo/a.png')).toEqual({ contentType: 'image/png', size: 10 });
  });
  it('returns null when the blob is missing', async () => {
    vi.mocked(head).mockRejectedValue(new Error('BlobNotFoundError'));
    expect(await blobInfo('coaches/u1/photo/a.png')).toBeNull();
  });
});

describe('deleteBlob', () => {
  it('skips empty paths and swallows errors', async () => {
    await deleteBlob(null);
    expect(del).not.toHaveBeenCalled();
    vi.mocked(del).mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(deleteBlob('coaches/u1/photo/a.png')).resolves.toBeUndefined();
  });
});

describe('readBlob', () => {
  it('returns the body, or a 502 HttpError when the store fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('PDF')),
    );
    expect(await new Response(await readBlob('coaches/u1/certs/a.pdf')).text()).toBe('PDF');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 })),
    );
    await expect(readBlob('coaches/u1/certs/a.pdf')).rejects.toMatchObject({ status: 502 });
    vi.unstubAllGlobals();
  });
});
