import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));
vi.mock('@/prisma/models/certification', () => ({ findCertification: vi.fn(), deleteCertification: vi.fn() }));
vi.mock('@/lib/blob', () => ({ deleteBlob: vi.fn() }));

import { DELETE } from './route';
import { findCoach } from '@/prisma/models/coach-profile';
import { deleteCertification, findCertification } from '@/prisma/models/certification';
import { deleteBlob } from '@/lib/blob';
import { call, signInAs } from '@/test/api';

const params = { id: 'k1', certId: 'c1' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
  vi.mocked(findCoach).mockResolvedValue({ id: 'k1', coachProfile: { id: 'p1', status: 'ACTIVE' } } as any);
  vi.mocked(findCertification).mockResolvedValue({ id: 'c1', filePath: 'coaches/k1/certs/a.pdf' } as any);
});

describe('DELETE /api/coaches/[id]/certifications/[certId]', () => {
  it('deletes the row and the file', async () => {
    expect((await call(DELETE, { params })).status).toBe(204);
    expect(findCertification).toHaveBeenCalledWith('c1', 'k1');
    expect(deleteCertification).toHaveBeenCalledWith('c1');
    expect(deleteBlob).toHaveBeenCalledWith('coaches/k1/certs/a.pdf');
  });

  it('returns 404 for a certificate of another coach', async () => {
    vi.mocked(findCertification).mockResolvedValue(null);
    expect((await call(DELETE, { params })).status).toBe(404);
  });

  it('is locked while under review', async () => {
    vi.mocked(findCoach).mockResolvedValue({ id: 'k1', coachProfile: { id: 'p1', status: 'PENDING' } } as any);
    expect((await call(DELETE, { params })).status).toBe(409);
  });
});
