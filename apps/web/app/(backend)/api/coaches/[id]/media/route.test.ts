import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn() }));
vi.mock('@/prisma/models/media', () => ({ createMedia: vi.fn() }));
vi.mock('@/lib/server/blob', () => ({ blobInfo: vi.fn(), blobUrlOrNull: (p: string) => `https://blob/${p}` }));

import { POST } from './route';
import { findCoach } from '@/prisma/models/coach-profile';
import { createMedia } from '@/prisma/models/media';
import { blobInfo } from '@/lib/server/blob';
import { call, signInAs } from '@/test/api';

const params = { id: 'k1' };
const withMedia = (n: number, status = 'ACTIVE') =>
  ({
    id: 'k1',
    coachProfile: { id: 'p1', status, sports: [{ sportId: 's1' }], media: Array.from({ length: n }, (_, i) => ({ id: `m${i}` })) },
  }) as any;
const body = { filePath: 'coaches/k1/media/bag.jpg', caption: ' Heavy bag rounds ', sportId: 's1' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
  vi.mocked(findCoach).mockResolvedValue(withMedia(0));
  vi.mocked(blobInfo).mockResolvedValue({ contentType: 'image/jpeg', size: 1000 });
  vi.mocked(createMedia).mockImplementation(((_p: string, d: object) =>
    Promise.resolve({ id: 'm1', coachProfileId: 'p1', createdAt: new Date(), sport: null, ...d })) as any);
});

describe('POST /api/coaches/[id]/media', () => {
  it('saves a photo with the type and size Blob reports and a trimmed caption', async () => {
    const res = await call(POST, { params, body: { ...body, durationSec: 30 } });
    expect(res.status).toBe(201);
    expect(createMedia).toHaveBeenCalledWith('p1', {
      kind: 'PHOTO',
      filePath: body.filePath,
      contentType: 'image/jpeg',
      size: 1000,
      caption: 'Heavy bag rounds',
      sportId: 's1',
      durationSec: null,
    });
    const json = await res.json();
    expect(json).not.toHaveProperty('filePath');
    expect(json.url).toBe('https://blob/coaches/k1/media/bag.jpg');
  });

  it('saves a video with its rounded length, and no caption or sport when left empty', async () => {
    vi.mocked(blobInfo).mockResolvedValue({ contentType: 'video/mp4', size: 50 * 1024 * 1024 });
    const res = await call(POST, { params, body: { filePath: 'coaches/k1/media/clip.mp4', caption: '  ', sportId: '', durationSec: 74.6 } });
    expect(res.status).toBe(201);
    expect(createMedia).toHaveBeenCalledWith('p1', expect.objectContaining({ kind: 'VIDEO', caption: null, sportId: null, durationSec: 75 }));
  });

  it('refuses another coach', async () => {
    signInAs('k2', 'COACH');
    expect((await call(POST, { params, body })).status).toBe(403);
  });

  it('refuses paths outside the coach’s media folder and files that are not there', async () => {
    expect((await call(POST, { params, body: { ...body, filePath: 'coaches/k1/certs/x.jpg' } })).status).toBe(400);
    vi.mocked(blobInfo).mockResolvedValue(null);
    expect((await call(POST, { params, body })).status).toBe(400);
  });

  it('refuses other file types and photos over 10 MB', async () => {
    vi.mocked(blobInfo).mockResolvedValue({ contentType: 'application/pdf', size: 10 });
    expect((await call(POST, { params, body })).status).toBe(400);
    vi.mocked(blobInfo).mockResolvedValue({ contentType: 'image/png', size: 11 * 1024 * 1024 });
    expect((await call(POST, { params, body })).status).toBe(400);
  });

  it('refuses a sport the coach doesn’t teach and a caption over 120 characters', async () => {
    expect((await call(POST, { params, body: { ...body, sportId: 's9' } })).status).toBe(400);
    expect((await call(POST, { params, body: { ...body, caption: 'x'.repeat(121) } })).status).toBe(400);
  });

  it('stops at 24 items and while under review', async () => {
    vi.mocked(findCoach).mockResolvedValue(withMedia(24));
    expect((await call(POST, { params, body })).status).toBe(400);
    vi.mocked(findCoach).mockResolvedValue(withMedia(0, 'PENDING'));
    expect((await call(POST, { params, body })).status).toBe(409);
  });
});
