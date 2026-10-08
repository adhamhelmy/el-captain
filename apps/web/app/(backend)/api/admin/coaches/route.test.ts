import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ listCoachesForAdmin: vi.fn() }));
vi.mock('@/lib/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));

import { GET } from './route';
import { listCoachesForAdmin } from '@/prisma/models/coach-profile';
import { call, signInAs } from '@/test/api';

beforeEach(() => vi.clearAllMocks());

describe('GET /api/admin/coaches', () => {
  it('filters by a known status and pages', async () => {
    signInAs('a1', 'ADMIN');
    vi.mocked(listCoachesForAdmin).mockResolvedValue([
      {
        id: 'k1',
        name: 'Mona',
        email: 'k@x.com',
        createdAt: new Date(0),
        coachProfile: { status: 'PENDING', submittedAt: null, photoPath: null, sports: [] },
      },
    ] as any);
    const res = await call(GET, { url: 'http://localhost/api/admin/coaches?status=PENDING&limit=5' });
    expect(await res.json()).toEqual([expect.objectContaining({ id: 'k1', name: 'Mona', email: 'k@x.com', status: 'PENDING', sports: [] })]);
    expect(listCoachesForAdmin).toHaveBeenCalledWith('PENDING', { take: 5, skip: 0 });
  });

  it('ignores an unknown status', async () => {
    signInAs('a1', 'ADMIN');
    vi.mocked(listCoachesForAdmin).mockResolvedValue([]);
    await call(GET, { url: 'http://localhost/api/admin/coaches?status=nope' });
    expect(listCoachesForAdmin).toHaveBeenCalledWith(undefined, expect.anything());
  });

  it('is admin only', async () => {
    signInAs('k1', 'COACH');
    expect((await call(GET)).status).toBe(403);
  });
});
