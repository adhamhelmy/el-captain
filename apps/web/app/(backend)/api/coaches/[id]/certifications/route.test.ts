import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));
vi.mock('@/prisma/models/certification', () => ({ createCertification: vi.fn() }));
vi.mock('@/lib/server/blob', () => ({ blobInfo: vi.fn() }));

import { POST } from './route';
import { findCoach } from '@/prisma/models/coach-profile';
import { createCertification } from '@/prisma/models/certification';
import { blobInfo } from '@/lib/server/blob';
import { call, signInAs } from '@/test/api';

const params = { id: 'k1' };
const withCerts = (n: number, status = 'INCOMPLETE') =>
  ({ id: 'k1', coachProfile: { id: 'p1', status, certifications: Array.from({ length: n }, (_, i) => ({ id: `c${i}` })) } }) as any;
const body = { title: 'RYT 200', filePath: 'coaches/k1/certs/ryt.pdf', fileName: 'ryt.pdf' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
  vi.mocked(findCoach).mockResolvedValue(withCerts(0));
  vi.mocked(blobInfo).mockResolvedValue({ contentType: 'application/pdf', size: 1000 });
  vi.mocked(createCertification).mockImplementation(((_p: string, d: object) =>
    Promise.resolve({ id: 'c1', coachProfileId: 'p1', createdAt: new Date(), ...d })) as any);
});

describe('POST /api/coaches/[id]/certifications', () => {
  it('saves the certificate with the type and size Blob reports', async () => {
    const res = await call(POST, { params, body });
    expect(res.status).toBe(201);
    expect(createCertification).toHaveBeenCalledWith('p1', { ...body, contentType: 'application/pdf', size: 1000 });
    expect(await res.json()).not.toHaveProperty('filePath');
  });

  it('refuses another coach', async () => {
    signInAs('k2', 'COACH');
    expect((await call(POST, { params, body })).status).toBe(403);
  });

  it('refuses paths outside the coach’s certs folder and files that are not there', async () => {
    expect((await call(POST, { params, body: { ...body, filePath: 'coaches/k1/photo/x.jpg' } })).status).toBe(400);
    vi.mocked(blobInfo).mockResolvedValue(null);
    expect((await call(POST, { params, body })).status).toBe(400);
  });

  it('refuses a stored file of a type certificates may not have', async () => {
    vi.mocked(blobInfo).mockResolvedValue({ contentType: 'text/html', size: 10 });
    expect((await call(POST, { params, body })).status).toBe(400);
  });

  it('requires a title of at most 80 characters', async () => {
    expect((await call(POST, { params, body: { ...body, title: ' ' } })).status).toBe(400);
    expect((await call(POST, { params, body: { ...body, title: 'x'.repeat(81) } })).status).toBe(400);
  });

  it('stops at 10 certificates and while under review', async () => {
    vi.mocked(findCoach).mockResolvedValue(withCerts(10));
    expect((await call(POST, { params, body })).status).toBe(400);
    vi.mocked(findCoach).mockResolvedValue(withCerts(0, 'PENDING'));
    expect((await call(POST, { params, body })).status).toBe(409);
  });
});
