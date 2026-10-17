import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/certification', () => ({ findCertification: vi.fn() }));
vi.mock('@/lib/server/blob', () => ({ readBlob: vi.fn() }));
vi.mock('@/prisma/models/coach-profile', () => ({ findActiveCoach: vi.fn() }));

import { GET } from './route';
import { findCertification } from '@/prisma/models/certification';
import { readBlob } from '@/lib/server/blob';
import { findActiveCoach } from '@/prisma/models/coach-profile';
import { call, signInAs } from '@/test/api';

const params = { id: 'k1', certId: 'c1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findCertification).mockResolvedValue({
    id: 'c1',
    filePath: 'coaches/k1/certs/a.pdf',
    fileName: 'My cert.pdf',
    contentType: 'application/pdf',
  } as any);
  vi.mocked(readBlob).mockResolvedValue(new Response('PDF').body!);
  vi.mocked(findActiveCoach).mockResolvedValue({ id: 'k1' } as any);
});

describe('GET /api/coaches/[id]/certifications/[certId]/file', () => {
  it('streams the file to its owner, never cached', async () => {
    signInAs('k1', 'COACH');
    const res = await call(GET, { params });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('PDF');
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-disposition')).toContain("filename*=UTF-8''My%20cert.pdf");
  });

  it('lets an admin read it', async () => {
    signInAs('a1', 'ADMIN');
    expect((await call(GET, { params })).status).toBe(200);
  });

  it('refuses other coaches', async () => {
    signInAs('k2', 'COACH');
    expect((await call(GET, { params })).status).toBe(403);
  });

  it('lets a signed-in member read an approved coach’s certificate, but not one still in review', async () => {
    signInAs('u1', 'USER');
    expect((await call(GET, { params })).status).toBe(200);
    expect(findActiveCoach).toHaveBeenCalledWith('k1');
    vi.mocked(findActiveCoach).mockResolvedValue(null);
    expect((await call(GET, { params })).status).toBe(404);
  });

  it('refuses guests', async () => {
    signInAs(null);
    expect((await call(GET, { params })).status).toBe(401);
  });

  it('passes on a 502 when the store fails', async () => {
    signInAs('k1', 'COACH');
    const { HttpError } = await import('@/lib/server/api');
    vi.mocked(readBlob).mockRejectedValue(new HttpError(502, 'File unavailable'));
    expect((await call(GET, { params })).status).toBe(502);
  });
});
