import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/sport', () => ({ listSportsForAdmin: vi.fn(), findSportByKey: vi.fn(), createSport: vi.fn() }));

import { GET, POST } from './route';
import { createSport, findSportByKey, listSportsForAdmin } from '@/prisma/models/sport';
import { call, signInAs } from '@/test/api';

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('a1', 'ADMIN');
});

describe('/api/admin/sports', () => {
  it('lists with coach counts', async () => {
    vi.mocked(listSportsForAdmin).mockResolvedValue([{ id: 's1', nameEn: 'Yoga', nameAr: null, status: 'APPROVED', _count: { coaches: 3 } }] as any);
    expect(await (await call(GET)).json()).toEqual([{ id: 's1', nameEn: 'Yoga', nameAr: null, status: 'APPROVED', coachCount: 3 }]);
  });

  it('creates an approved sport', async () => {
    vi.mocked(findSportByKey).mockResolvedValue(null);
    vi.mocked(createSport).mockResolvedValue({ id: 's2', nameEn: 'Padel', nameAr: 'بادل', status: 'APPROVED' } as any);
    expect((await call(POST, { body: { nameEn: 'Padel', nameAr: 'بادل' } })).status).toBe(201);
    expect(createSport).toHaveBeenCalledWith({ nameEn: 'Padel', nameAr: 'بادل', status: 'APPROVED' });
  });

  it('refuses a duplicate', async () => {
    vi.mocked(findSportByKey).mockResolvedValue({ id: 's1' } as any);
    expect((await call(POST, { body: { nameEn: 'yoga' } })).status).toBe(409);
  });

  it('is admin only', async () => {
    signInAs('k1', 'COACH');
    expect((await call(GET)).status).toBe(403);
  });
});
