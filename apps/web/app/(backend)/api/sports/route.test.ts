import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/sport', () => ({ listVisibleSports: vi.fn(), findSportByKey: vi.fn(), createSport: vi.fn() }));

import { GET, POST } from './route';
import { createSport, findSportByKey, listVisibleSports } from '@/prisma/models/sport';
import { call, signInAs } from '@/test/api';

const yoga = { id: 's1', nameEn: 'Yoga', nameAr: 'يوجا', key: 'yoga', status: 'APPROVED', createdById: null, createdAt: new Date() };

beforeEach(() => vi.clearAllMocks());

describe('GET /api/sports', () => {
  it('lists for anyone, including the signed-in coach’s own pending sports', async () => {
    signInAs(null);
    vi.mocked(listVisibleSports).mockResolvedValue([yoga] as any);
    const res = await call(GET, { url: 'http://localhost/api/sports?q=yo' });
    expect(await res.json()).toEqual([{ id: 's1', nameEn: 'Yoga', nameAr: 'يوجا', status: 'APPROVED' }]);
    expect(listVisibleSports).toHaveBeenCalledWith(null, 'yo');

    signInAs('k1', 'COACH');
    await call(GET, { url: 'http://localhost/api/sports' });
    expect(listVisibleSports).toHaveBeenLastCalledWith('k1', undefined);
  });
});

describe('POST /api/sports', () => {
  it('is for coaches only', async () => {
    signInAs('u1', 'USER');
    expect((await call(POST, { body: { name: 'Padel' } })).status).toBe(403);
  });

  it('creates a pending sport owned by the coach', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(findSportByKey).mockResolvedValue(null);
    vi.mocked(createSport).mockResolvedValue({ ...yoga, id: 's9', nameEn: 'Padel', nameAr: null, status: 'PENDING' } as any);
    const res = await call(POST, { body: { name: '  Padel ' } });
    expect(res.status).toBe(201);
    expect(findSportByKey).toHaveBeenCalledWith('padel');
    expect(createSport).toHaveBeenCalledWith({ nameEn: 'Padel', status: 'PENDING', createdById: 'k1' });
  });

  it('answers 409 with the existing sport for a duplicate name', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(findSportByKey).mockResolvedValue(yoga as any);
    const res = await call(POST, { body: { name: ' YOGA ' } });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'sport_exists', sport: { id: 's1', nameEn: 'Yoga' } });
    expect(createSport).not.toHaveBeenCalled();
  });

  it.each(['', 'x', 'x'.repeat(41), 42])('rejects the name %j', async (name) => {
    signInAs('k1', 'COACH');
    const res = await call(POST, { body: { name } });
    expect(res.status).toBe(400);
  });
});
