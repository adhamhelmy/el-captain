import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));
vi.mock('@/prisma/models/coach-status', () => ({ listStatusEvents: vi.fn() }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));

import { GET } from './route';
import { findCoach } from '@/prisma/models/coach-profile';
import { listStatusEvents } from '@/prisma/models/coach-status';
import { call, signInAs } from '@/test/api';

const profile = {
  id: 'p1',
  userId: 'k1',
  status: 'PENDING',
  submittedAt: null,
  bio: 'b',
  city: null,
  phone: null,
  locale: 'ar',
  photoPath: null,
  instagram: null,
  tiktok: null,
  links: [],
  certifications: [],
  sports: [],
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/admin/coaches/[id]', () => {
  it('returns the profile with email and history', async () => {
    signInAs('a1', 'ADMIN');
    vi.mocked(findCoach).mockResolvedValue({ id: 'k1', name: 'Mona', email: 'k@x.com', coachProfile: profile } as any);
    vi.mocked(listStatusEvents).mockResolvedValue([
      { id: 'e1', from: 'INCOMPLETE', to: 'PENDING', reason: null, actorId: 'k1', actorName: 'Mona', createdAt: new Date(0), coachProfileId: 'p1' },
    ] as any);
    const json = await (await call(GET, { params: { id: 'k1' } })).json();
    expect(json).toMatchObject({ id: 'k1', email: 'k@x.com', status: 'PENDING', history: [{ id: 'e1', to: 'PENDING', actorName: 'Mona' }] });
    expect(json.history[0]).not.toHaveProperty('coachProfileId');
  });

  it('returns 404 for an unknown coach', async () => {
    signInAs('a1', 'ADMIN');
    vi.mocked(findCoach).mockResolvedValue(null);
    expect((await call(GET, { params: { id: 'x' } })).status).toBe(404);
  });
});
