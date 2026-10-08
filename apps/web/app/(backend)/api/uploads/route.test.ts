import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@vercel/blob/client', () => ({ handleUpload: vi.fn() }));

import { handleUpload } from '@vercel/blob/client';
import { POST } from './route';
import { call, signInAs } from '@/test/api';

const body = { type: 'blob.generate-client-token', payload: { pathname: 'x', clientPayload: 'photo' } };

/** Runs the route and returns what onBeforeGenerateToken produced (or threw) for this path and kind. */
async function tokenFor(pathname: string, kind: string) {
  let options: any;
  vi.mocked(handleUpload).mockImplementation(async (o: any) => {
    options = await o.onBeforeGenerateToken(pathname, kind);
    return { type: 'blob.generate-client-token', clientToken: 't' } as any;
  });
  const res = await call(POST, { body });
  return { res, options };
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/uploads', () => {
  it('returns 401 when signed out and 403 for non-coaches', async () => {
    signInAs(null);
    expect((await call(POST, { body })).status).toBe(401);
    signInAs('u1', 'USER');
    expect((await call(POST, { body })).status).toBe(403);
  });

  it('limits a photo upload to images up to 5 MB in the coach’s own folder', async () => {
    signInAs('k1', 'COACH');
    const { res, options } = await tokenFor('coaches/k1/photo/me.jpg', 'photo');
    expect(res.status).toBe(200);
    expect(options).toMatchObject({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maximumSizeInBytes: 5 * 1024 * 1024,
      addRandomSuffix: true,
    });
  });

  it('allows PDFs up to 10 MB for certificates', async () => {
    signInAs('k1', 'COACH');
    const { options } = await tokenFor('coaches/k1/certs/c.pdf', 'certificate');
    expect(options.allowedContentTypes).toContain('application/pdf');
    expect(options.maximumSizeInBytes).toBe(10 * 1024 * 1024);
  });

  it.each([
    ['coaches/k2/photo/me.jpg', 'photo'],
    ['coaches/k1/photo/../../k2/photo/me.jpg', 'photo'],
    ['coaches/k1/certs/c.pdf', 'photo'],
    ['coaches/k1/photo/me.jpg', 'avatar'],
    ['coaches/k1/photo/me.jpg', 'toString'],
  ])('refuses %s as %s', async (path, kind) => {
    signInAs('k1', 'COACH');
    const { res } = await tokenFor(path, kind);
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('invalid_upload');
  });
});
