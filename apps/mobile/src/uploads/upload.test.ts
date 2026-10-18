import { configureApi } from '@/api/client';
import { uploadCheck, uploadFile, uploadPath } from './upload';

describe('uploadPath', () => {
  it("puts the file in the coach's folder for its kind, with a safe name", () => {
    expect(uploadPath('photo', 'u1', 'My Photo (1).JPG')).toBe('coaches/u1/photo/My-Photo-1-.JPG');
    expect(uploadPath('certificate', 'u1', 'شهادة.pdf')).toBe('coaches/u1/certs/-.pdf');
    expect(uploadPath('cover', 'u1', '')).toBe('coaches/u1/cover/file');
  });
});

describe('uploadCheck', () => {
  it('accepts allowed types within the size limit', () => {
    expect(uploadCheck('photo', 'image/jpeg', 1_000_000)).toBe(true);
    expect(uploadCheck('certificate', 'application/pdf', 9_000_000)).toBe(true);
  });
  it('refuses other types and files over the limit, and unknown sizes pass to the server', () => {
    expect(uploadCheck('photo', 'image/heic', 1_000)).toBe(false);
    expect(uploadCheck('photo', 'image/png', 6 * 1024 * 1024)).toBe(false);
    expect(uploadCheck('photo', 'image/png', undefined)).toBe(true);
  });
});

describe('uploadFile', () => {
  const file = { uri: 'file:///photo.jpg', name: 'me.jpg', type: 'image/jpeg', size: 1000 };
  beforeEach(() => {
    configureApi({ baseUrl: 'http://mac:3000', getToken: () => 'tok' });
  });

  it('gets a client token from /api/uploads, then puts the file to Blob with it', async () => {
    const calls: [string, RequestInit | undefined][] = [];
    globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      if (url === 'file:///photo.jpg') return { blob: async () => 'BYTES' };
      if (url.endsWith('/api/uploads')) return { ok: true, json: async () => ({ clientToken: 'vercel_blob_client_store1_abc' }) };
      return { ok: true, json: async () => ({ pathname: 'coaches/u1/photo/me-x1.jpg' }) };
    }) as unknown as typeof fetch;

    expect(await uploadFile('photo', 'u1', file)).toEqual({ ok: true, path: 'coaches/u1/photo/me-x1.jpg' });
    const [tokenUrl, token] = calls[0];
    expect(tokenUrl).toBe('http://mac:3000/api/uploads');
    expect(token?.headers).toMatchObject({ authorization: 'Bearer tok' });
    expect(JSON.parse(String(token?.body))).toEqual({
      type: 'blob.generate-client-token',
      payload: { pathname: 'coaches/u1/photo/me.jpg', clientPayload: 'photo', multipart: false },
    });
    const [putUrl, put] = calls[2];
    expect(putUrl).toBe('https://vercel.com/api/blob/?pathname=coaches%2Fu1%2Fphoto%2Fme.jpg');
    expect(put).toMatchObject({ method: 'PUT', body: 'BYTES' });
    expect(put?.headers).toMatchObject({
      authorization: 'Bearer vercel_blob_client_store1_abc',
      'x-vercel-blob-store-id': 'store1',
      'x-vercel-blob-access': 'public',
      'x-content-type': 'image/jpeg',
      'x-api-version': '12',
    });
  });

  it('reports a refused token or upload as a generic failure, and a wrong type before any call', async () => {
    globalThis.fetch = jest.fn(async (url: string) =>
      url.startsWith('file:') ? { blob: async () => 'B' } : { ok: false, json: async () => ({}) },
    ) as unknown as typeof fetch;
    expect(await uploadFile('photo', 'u1', file)).toEqual({ ok: false, code: 'generic' });
    expect(await uploadFile('photo', 'u1', { ...file, type: 'image/heic' })).toEqual({ ok: false, code: 'invalid_upload' });
  });
});
