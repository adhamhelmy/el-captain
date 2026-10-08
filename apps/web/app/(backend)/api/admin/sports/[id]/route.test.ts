import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/sport', () => ({ findSport: vi.fn(), findSportByKey: vi.fn(), updateSport: vi.fn() }));

import { PATCH } from './route';
import { findSport, findSportByKey, updateSport } from '@/prisma/models/sport';
import { call, signInAs } from '@/test/api';

const params = { id: 's9' };
const padel = { id: 's9', nameEn: 'Paddel', nameAr: null, key: 'paddel', status: 'PENDING' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('a1', 'ADMIN');
  vi.mocked(findSport).mockResolvedValue(padel as any);
  vi.mocked(updateSport).mockResolvedValue({ ...padel, nameEn: 'Padel', status: 'APPROVED' } as any);
});

describe('PATCH /api/admin/sports/[id]', () => {
  it('renames, adds the Arabic name and approves', async () => {
    vi.mocked(findSportByKey).mockResolvedValue(null);
    const res = await call(PATCH, { params, body: { nameEn: ' Padel ', nameAr: 'بادل', approve: true } });
    expect(res.status).toBe(200);
    expect(updateSport).toHaveBeenCalledWith('s9', { nameEn: 'Padel', nameAr: 'بادل', status: 'APPROVED' });
  });

  it('refuses a rename onto another sport’s name', async () => {
    vi.mocked(findSportByKey).mockResolvedValue({ id: 's1', key: 'yoga' } as any);
    const res = await call(PATCH, { params, body: { nameEn: 'YOGA' } });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('sport_exists');
  });

  it('allows changing only the case of its own name', async () => {
    vi.mocked(findSportByKey).mockResolvedValue(padel as any);
    expect((await call(PATCH, { params, body: { nameEn: 'PADDEL' } })).status).toBe(200);
  });

  it('returns 404 for an unknown sport', async () => {
    vi.mocked(findSport).mockResolvedValue(null);
    expect((await call(PATCH, { params, body: { approve: true } })).status).toBe(404);
  });
});
