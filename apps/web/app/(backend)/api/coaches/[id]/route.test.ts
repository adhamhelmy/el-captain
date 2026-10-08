import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn(), findActiveCoach: vi.fn(), updateCoach: vi.fn() }));
vi.mock('@/prisma/models/sport', () => ({ countSports: vi.fn() }));
vi.mock('@/lib/blob', () => ({ blobInfo: vi.fn(), deleteBlob: vi.fn(), blobUrlOrNull: (p: string | null) => (p ? `https://b/${p}` : null) }));

import { GET, PATCH } from './route';
import { findActiveCoach, findCoach, updateCoach } from '@/prisma/models/coach-profile';
import { countSports } from '@/prisma/models/sport';
import { blobInfo, deleteBlob } from '@/lib/blob';
import { call, signInAs } from '@/test/api';

const profile = {
  id: 'p1',
  userId: 'k1',
  status: 'INCOMPLETE',
  submittedAt: null,
  bio: 'Boxing',
  city: null,
  phone: null,
  locale: null,
  photoPath: 'coaches/k1/photo/old.jpg',
  instagram: null,
  tiktok: null,
  links: [],
  certifications: [],
  sports: [],
};
const coach = { id: 'k1', name: 'Mona', coachProfile: profile };
const params = { id: 'k1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findCoach).mockResolvedValue(coach as any);
  vi.mocked(updateCoach).mockResolvedValue(coach as any);
});

describe('GET /api/coaches/[id]', () => {
  it('returns an active coach without storage paths', async () => {
    vi.mocked(findActiveCoach).mockResolvedValue({ ...coach, coachProfile: { ...profile, status: 'ACTIVE' } } as any);
    const json = await (await call(GET, { params })).json();
    expect(json).toMatchObject({ id: 'k1', userId: 'k1', coachName: 'Mona', bio: 'Boxing', photoUrl: 'https://b/coaches/k1/photo/old.jpg' });
    expect(json).not.toHaveProperty('photoPath');
    expect(json).not.toHaveProperty('locale');
  });

  it('only shows sports an admin has approved', async () => {
    const sports = [
      { sport: { id: 's1', nameEn: 'Yoga', nameAr: null, status: 'APPROVED' } },
      { sport: { id: 's2', nameEn: 'Krav Maga', nameAr: null, status: 'PENDING' } },
    ];
    vi.mocked(findActiveCoach).mockResolvedValue({ ...coach, coachProfile: { ...profile, status: 'ACTIVE', sports } } as any);
    const json = await (await call(GET, { params })).json();
    expect(json.sports.map((s: { id: string }) => s.id)).toEqual(['s1']);
  });

  it('returns 404 for an unknown or not yet active coach', async () => {
    vi.mocked(findActiveCoach).mockResolvedValue(null);
    expect((await call(GET, { params })).status).toBe(404);
  });
});

describe('PATCH /api/coaches/[id]', () => {
  it("returns 403 for another coach's profile", async () => {
    signInAs('k2', 'COACH');
    expect((await call(PATCH, { params, body: { bio: 'x' } })).status).toBe(403);
    expect(updateCoach).not.toHaveBeenCalled();
  });

  it("lets an admin update any coach's profile, even while pending", async () => {
    signInAs('admin', 'ADMIN');
    vi.mocked(findCoach).mockResolvedValue({ ...coach, coachProfile: { ...profile, status: 'PENDING' } } as any);
    expect((await call(PATCH, { params, body: { bio: 'x' } })).status).toBe(200);
    expect(updateCoach).toHaveBeenCalledWith('k1', expect.objectContaining({ bio: 'x' }));
  });

  it('locks the profile for the coach while it is under review', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(findCoach).mockResolvedValue({ ...coach, coachProfile: { ...profile, status: 'PENDING' } } as any);
    const res = await call(PATCH, { params, body: { bio: 'x' } });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('profile_locked');
  });

  it('normalizes socials and saves links and sports', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(countSports).mockResolvedValue(2);
    const body = {
      instagram: '@mona.fit',
      tiktok: '',
      links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/mona' }],
      sportIds: ['s1', 's2'],
    };
    expect((await call(PATCH, { params, body })).status).toBe(200);
    expect(updateCoach).toHaveBeenCalledWith('k1', {
      instagram: 'https://www.instagram.com/mona.fit',
      tiktok: null,
      links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/mona' }],
      sportIds: ['s1', 's2'],
    });
  });

  it.each([
    [{ bio: 'x'.repeat(1001) }],
    [{ bio: 42 }],
    [{ instagram: 'https://evil.com/x' }],
    [{ links: [{ label: 'x', url: 'http://plain.com' }] }],
    [{ links: [{ label: '', url: 'https://ok.com' }] }],
    [{ links: 'nope' }],
    [{ links: [null] }],
    [{ links: Array.from({ length: 6 }, () => ({ label: 'a', url: 'https://ok.com' })) }],
    [{ sportIds: Array.from({ length: 11 }, (_, i) => `s${i}`) }],
    [{ sportIds: ['s1', 's1'] }],
  ])('rejects invalid input %j', async (body) => {
    signInAs('k1', 'COACH');
    vi.mocked(countSports).mockResolvedValue(1);
    const res = await call(PATCH, { params, body });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('invalid_profile');
    expect(updateCoach).not.toHaveBeenCalled();
  });

  it('saves the name and city, trimmed, and clears an empty city', async () => {
    signInAs('k1', 'COACH');
    expect((await call(PATCH, { params, body: { name: ' Mona Ali ', city: ' Cairo ' } })).status).toBe(200);
    expect(updateCoach).toHaveBeenLastCalledWith('k1', { name: 'Mona Ali', city: 'Cairo' });
    await call(PATCH, { params, body: { city: '' } });
    expect(updateCoach).toHaveBeenLastCalledWith('k1', { city: null });
  });

  it.each([[''], ['   '], [null], [42], ['x'.repeat(81)]])('rejects the name %j', async (name) => {
    signInAs('k1', 'COACH');
    const res = await call(PATCH, { params, body: { name } });
    expect((await res.json()).code).toBe('invalid_profile');
    expect(updateCoach).not.toHaveBeenCalled();
  });

  it('rejects a city over 80 characters', async () => {
    signInAs('k1', 'COACH');
    const res = await call(PATCH, { params, body: { city: 'x'.repeat(81) } });
    expect((await res.json()).code).toBe('invalid_profile');
  });

  it('rejects unknown sport ids', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(countSports).mockResolvedValue(1);
    expect((await call(PATCH, { params, body: { sportIds: ['s1', 'nope'] } })).status).toBe(400);
  });

  it('accepts a new photo only from the coach’s folder, and deletes the old one', async () => {
    signInAs('k1', 'COACH');
    expect((await call(PATCH, { params, body: { photoPath: 'coaches/k2/photo/x.jpg' } })).status).toBe(400);

    vi.mocked(blobInfo).mockResolvedValue(null);
    expect((await call(PATCH, { params, body: { photoPath: 'coaches/k1/photo/new.jpg' } })).status).toBe(400);

    vi.mocked(blobInfo).mockResolvedValue({ contentType: 'image/jpeg', size: 10 });
    expect((await call(PATCH, { params, body: { photoPath: 'coaches/k1/photo/new.jpg' } })).status).toBe(200);
    expect(updateCoach).toHaveBeenCalledWith('k1', { photoPath: 'coaches/k1/photo/new.jpg' });
    expect(deleteBlob).toHaveBeenCalledWith('coaches/k1/photo/old.jpg');
  });

  it('refuses a stored photo that is not an image', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(blobInfo).mockResolvedValue({ contentType: 'application/pdf', size: 10 });
    expect((await call(PATCH, { params, body: { photoPath: 'coaches/k1/photo/new.pdf' } })).status).toBe(400);
  });
});
