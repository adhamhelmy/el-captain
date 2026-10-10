import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ listActiveCoaches: vi.fn() }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));

import { GET } from './route';
import { listActiveCoaches } from '@/prisma/models/coach-profile';
import { call } from '@/test/api';

const profile = {
  bio: 'b',
  city: 'Cairo',
  phone: '+20100',
  instagram: null,
  tiktok: null,
  photoPath: null,
  links: [],
  certifications: [],
  sports: [],
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/coaches', () => {
  it('lists approved coaches for anyone, without their phone', async () => {
    vi.mocked(listActiveCoaches).mockResolvedValue([{ id: 'k1', name: 'Mona', coachProfile: profile, venues: [] }] as any);
    const json = await (await call(GET)).json();
    expect(json).toEqual([expect.objectContaining({ id: 'k1', name: 'Mona', city: 'Cairo' })]);
    expect(json[0]).not.toHaveProperty('phone');
  });

  it('passes the sport and a trimmed name search', async () => {
    vi.mocked(listActiveCoaches).mockResolvedValue([]);
    await call(GET, { url: 'http://localhost/api/coaches?sport=s1&q=%20mo%20' });
    expect(listActiveCoaches).toHaveBeenCalledWith({ sportId: 's1', q: 'mo' }, expect.anything());
  });
});
