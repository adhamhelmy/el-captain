import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));
vi.mock('@/prisma/models/coach-status', () => ({ lastStatusEvent: vi.fn() }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));

import { GET } from './route';
import { findCoach } from '@/prisma/models/coach-profile';
import { lastStatusEvent } from '@/prisma/models/coach-status';
import { call, signInAs } from '@/test/api';

const profile = {
  id: 'p1',
  userId: 'k1',
  status: 'REJECTED',
  submittedAt: null,
  bio: null,
  city: null,
  phone: null,
  locale: null,
  photoPath: null,
  instagram: 'https://www.instagram.com/m',
  tiktok: null,
  links: [],
  certifications: [],
  sports: [],
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/coaches/me/onboarding', () => {
  it('is for coaches only', async () => {
    signInAs('u1', 'USER');
    expect((await call(GET)).status).toBe(403);
  });

  it('returns the draft, what is missing and the latest reason', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(findCoach).mockResolvedValue({ id: 'k1', name: 'Mona', coachProfile: profile } as any);
    vi.mocked(lastStatusEvent).mockResolvedValue({ to: 'REJECTED', reason: 'Blurry photo' } as any);
    const json = await (await call(GET)).json();
    expect(json.coach).toMatchObject({ id: 'k1', status: 'REJECTED' });
    expect(json.missing).toEqual(['photo', 'bio', 'sports']);
    expect(json.reason).toBe('Blurry photo');
    expect(findCoach).toHaveBeenCalledWith('k1');
  });
});
