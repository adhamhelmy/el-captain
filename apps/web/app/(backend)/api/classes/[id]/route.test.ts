import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/coach-guard', () => ({ assertActiveCoach: vi.fn() }));
vi.mock('@/prisma/models/class', () => ({
  findClass: vi.fn(),
  findClassWithHost: vi.fn(),
  updateClass: vi.fn(),
  deleteClass: vi.fn(),
}));

import { GET, PATCH, DELETE } from './route';
import { deleteClass, findClass, findClassWithHost, updateClass } from '@/prisma/models/class';
import { call, signInAs } from '@/test/api';

const cls = {
  id: 'c1',
  title: 'Yoga',
  clientId: 'host',
  date: new Date(),
  client: { name: 'Studio', clientProfile: { studioName: 'S' }, coachProfile: null },
};
const params = { id: 'c1' };

beforeEach(() => vi.clearAllMocks());

describe('GET /api/classes/[id]', () => {
  it('returns the class without signing in', async () => {
    vi.mocked(findClassWithHost).mockResolvedValue(cls as any);
    const res = await call(GET, { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'c1', clientName: 'Studio', studioName: 'S', isCoach: false });
  });

  it('returns 404 for an unknown class', async () => {
    vi.mocked(findClassWithHost).mockResolvedValue(null);
    expect((await call(GET, { params })).status).toBe(404);
  });
});

describe('PATCH /api/classes/[id]', () => {
  it('returns 403 for a USER before looking the class up', async () => {
    signInAs('u1', 'USER');
    expect((await call(PATCH, { params, body: {} })).status).toBe(403);
    expect(findClass).not.toHaveBeenCalled();
  });

  it('returns 404 when the class does not exist', async () => {
    signInAs('host', 'STUDIO');
    vi.mocked(findClass).mockResolvedValue(null);
    expect((await call(PATCH, { params, body: {} })).status).toBe(404);
  });

  it("returns 403 for another host's class", async () => {
    signInAs('other', 'STUDIO');
    vi.mocked(findClass).mockResolvedValue(cls as any);
    expect((await call(PATCH, { params, body: { title: 'New' } })).status).toBe(403);
    expect(updateClass).not.toHaveBeenCalled();
  });

  it('updates only the fields that were sent', async () => {
    signInAs('host', 'STUDIO');
    vi.mocked(findClass).mockResolvedValue(cls as any);
    vi.mocked(updateClass).mockResolvedValue(cls as any);
    const res = await call(PATCH, { params, body: { title: 'New', durationMinutes: '45' } });
    expect(res.status).toBe(200);
    expect(updateClass).toHaveBeenCalledWith('c1', { title: 'New', durationMinutes: 45 });
  });

  it("lets an admin update anyone's class", async () => {
    signInAs('admin', 'ADMIN');
    vi.mocked(findClass).mockResolvedValue(cls as any);
    vi.mocked(updateClass).mockResolvedValue(cls as any);
    expect((await call(PATCH, { params, body: { city: 'Giza' } })).status).toBe(200);
  });
});

describe('DELETE /api/classes/[id]', () => {
  it('deletes the host’s own class', async () => {
    signInAs('host', 'COACH');
    vi.mocked(findClass).mockResolvedValue(cls as any);
    expect((await call(DELETE, { params })).status).toBe(200);
    expect(deleteClass).toHaveBeenCalledWith('c1');
  });

  it("returns 403 for another host's class", async () => {
    signInAs('other', 'COACH');
    vi.mocked(findClass).mockResolvedValue(cls as any);
    expect((await call(DELETE, { params })).status).toBe(403);
    expect(deleteClass).not.toHaveBeenCalled();
  });
});
