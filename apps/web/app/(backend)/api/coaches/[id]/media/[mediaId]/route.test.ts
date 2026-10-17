import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));
vi.mock('@/prisma/models/media', () => ({ findMedia: vi.fn(), updateMedia: vi.fn(), deleteMedia: vi.fn() }));
vi.mock('@/lib/server/blob', () => ({ deleteBlob: vi.fn(), blobUrlOrNull: (p: string) => `https://blob/${p}` }));
vi.mock('@/prisma/models/session', () => ({ countSessionsWithCover: vi.fn() }));

import { DELETE, PATCH } from './route';
import { findCoach } from '@/prisma/models/coach-profile';
import { deleteMedia, findMedia, updateMedia } from '@/prisma/models/media';
import { deleteBlob } from '@/lib/server/blob';
import { countSessionsWithCover } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';

const params = { id: 'k1', mediaId: 'm1' };
const coach = (status = 'ACTIVE') => ({ id: 'k1', coachProfile: { id: 'p1', status, sports: [{ sportId: 's1' }] } }) as any;
const item = { id: 'm1', kind: 'PHOTO', filePath: 'coaches/k1/media/a.jpg', caption: null, sportId: null, sport: null, durationSec: null };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
  vi.mocked(findCoach).mockResolvedValue(coach());
  vi.mocked(findMedia).mockResolvedValue(item as any);
  vi.mocked(countSessionsWithCover).mockResolvedValue(0);
  vi.mocked(updateMedia).mockImplementation(((_id: string, d: object) => Promise.resolve({ ...item, ...d })) as any);
});

describe('PATCH /api/coaches/[id]/media/[mediaId]', () => {
  it('changes the caption and sport', async () => {
    const res = await call(PATCH, { params, body: { caption: 'Sparring', sportId: 's1' } });
    expect(res.status).toBe(200);
    expect(findMedia).toHaveBeenCalledWith('m1', 'k1');
    expect(updateMedia).toHaveBeenCalledWith('m1', { caption: 'Sparring', sportId: 's1' });
  });

  it('refuses a sport the coach doesn’t teach', async () => {
    expect((await call(PATCH, { params, body: { sportId: 's9' } })).status).toBe(400);
  });

  it('returns 404 for another coach’s item', async () => {
    vi.mocked(findMedia).mockResolvedValue(null);
    expect((await call(PATCH, { params, body: {} })).status).toBe(404);
  });
});

describe('DELETE /api/coaches/[id]/media/[mediaId]', () => {
  it('deletes the row and the file', async () => {
    expect((await call(DELETE, { params })).status).toBe(204);
    expect(deleteMedia).toHaveBeenCalledWith('m1');
    expect(deleteBlob).toHaveBeenCalledWith('coaches/k1/media/a.jpg');
  });

  it('keeps the file while a session uses it as its cover', async () => {
    vi.mocked(countSessionsWithCover).mockResolvedValue(2);
    expect((await call(DELETE, { params })).status).toBe(204);
    expect(deleteMedia).toHaveBeenCalledWith('m1');
    expect(deleteBlob).not.toHaveBeenCalled();
  });

  it('is locked while under review', async () => {
    vi.mocked(findCoach).mockResolvedValue(coach('PENDING'));
    expect((await call(DELETE, { params })).status).toBe(409);
  });
});
