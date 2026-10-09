import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/prisma/models/venue', () => ({ findVenue: vi.fn(), updateVenue: vi.fn(), archiveVenue: vi.fn() }));

import { DELETE, PATCH } from './route';
import { archiveVenue, findVenue, updateVenue } from '@/prisma/models/venue';
import { call, signInAs } from '@/test/api';

const venue = { id: 'v1', coachId: 'k1', name: 'Zamalek Club', address: '26 July St', city: 'Cairo', mapUrl: null, archivedAt: null };
const params = { id: 'v1' };
const body = { name: 'Zamalek Club', address: '26 July St', city: 'Giza', mapUrl: 'https://maps.app.goo.gl/x' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
  vi.mocked(findVenue).mockResolvedValue(venue as any);
  vi.mocked(updateVenue).mockResolvedValue({ ...venue, city: 'Giza' } as any);
  vi.mocked(archiveVenue).mockResolvedValue({ ...venue, archivedAt: new Date() } as any);
});

describe('PATCH /api/venues/[id]', () => {
  it('edits own venue', async () => {
    expect((await call(PATCH, { params, body })).status).toBe(200);
    expect(updateVenue).toHaveBeenCalledWith('v1', { ...body });
  });

  it("refuses another coach's venue", async () => {
    signInAs('k2', 'COACH');
    expect((await call(PATCH, { params, body })).status).toBe(403);
    expect(updateVenue).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown venue', async () => {
    vi.mocked(findVenue).mockResolvedValue(null);
    expect((await call(PATCH, { params, body })).status).toBe(404);
  });
});

describe('DELETE /api/venues/[id]', () => {
  it('archives own venue', async () => {
    const res = await call(DELETE, { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'v1', archived: true });
  });
});
