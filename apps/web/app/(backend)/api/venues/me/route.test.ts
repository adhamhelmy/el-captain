import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/prisma/models/venue', () => ({ listVenues: vi.fn(), createVenue: vi.fn() }));

import { GET, POST } from './route';
import { createVenue, listVenues } from '@/prisma/models/venue';
import { call, signInAs } from '@/test/api';

const venue = { id: 'v1', coachId: 'k1', name: 'Zamalek Club', address: '26 July St', city: 'Cairo', mapUrl: null, archivedAt: null };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
});

describe('GET /api/venues/me', () => {
  it("lists the coach's venues", async () => {
    vi.mocked(listVenues).mockResolvedValue([venue] as any);
    expect(await (await call(GET)).json()).toEqual([
      { id: 'v1', name: 'Zamalek Club', address: '26 July St', city: 'Cairo', mapUrl: null, archived: false },
    ]);
    expect(listVenues).toHaveBeenCalledWith('k1');
  });

  it('is for coaches only', async () => {
    signInAs('u1', 'USER');
    expect((await call(GET)).status).toBe(403);
  });
});

describe('POST /api/venues/me', () => {
  it('saves a trimmed venue and treats an empty map link as none', async () => {
    vi.mocked(createVenue).mockResolvedValue(venue as any);
    const res = await call(POST, { body: { name: ' Zamalek Club ', address: '26 July St', city: 'Cairo', mapUrl: '' } });
    expect(res.status).toBe(201);
    expect(createVenue).toHaveBeenCalledWith('k1', { name: 'Zamalek Club', address: '26 July St', city: 'Cairo', mapUrl: null });
  });

  it('lists the fields that break a rule', async () => {
    const res = await call(POST, { body: { name: '', address: 'x', city: 'Cairo', mapUrl: 'http://x.com' } });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'invalid_venue', fields: ['name', 'mapUrl'] });
    expect(createVenue).not.toHaveBeenCalled();
  });
});
