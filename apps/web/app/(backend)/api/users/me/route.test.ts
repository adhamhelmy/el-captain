import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/member', () => ({ findMember: vi.fn(), updateMember: vi.fn() }));
vi.mock('@/prisma/models/sport', () => ({ countSports: vi.fn() }));

import { GET, PATCH } from './route';
import { findMember, updateMember } from '@/prisma/models/member';
import { countSports } from '@/prisma/models/sport';
import { call, signInAs } from '@/test/api';

const member = { id: 'u1', name: 'Ali', email: 'a@b.com', phone: null, createdAt: new Date(0), passwordHash: 'x', favouriteSports: [] };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('u1', 'USER');
  vi.mocked(findMember).mockResolvedValue(member as any);
  vi.mocked(updateMember).mockResolvedValue(member as any);
});

describe('GET /api/users/me', () => {
  it('returns the member without the password hash', async () => {
    const json = await (await call(GET)).json();
    expect(json).toMatchObject({ id: 'u1', name: 'Ali', email: 'a@b.com', sports: [] });
    expect(json).not.toHaveProperty('passwordHash');
  });

  it('is for members only', async () => {
    signInAs('k1', 'COACH');
    expect((await call(GET)).status).toBe(403);
  });
});

describe('PATCH /api/users/me', () => {
  it('saves a trimmed name, a cleaned phone and the favourite sports', async () => {
    vi.mocked(countSports).mockResolvedValue(2);
    const res = await call(PATCH, { body: { name: ' Ali ', phone: '+20 (100) 123-4567', sportIds: ['s1', 's2'], email: 'x@y.com' } });
    expect(res.status).toBe(200);
    expect(updateMember).toHaveBeenCalledWith('u1', { name: 'Ali', phone: '+201001234567', sportIds: ['s1', 's2'] });
  });

  it('clears an empty phone', async () => {
    await call(PATCH, { body: { phone: '' } });
    expect(updateMember).toHaveBeenCalledWith('u1', { name: undefined, phone: null, sportIds: undefined });
  });

  it.each([[{ name: '  ' }], [{ phone: '12ab' }], [{ phone: '123' }], [{ sportIds: ['s1', 's1'] }]])('rejects %j', async (body) => {
    vi.mocked(countSports).mockResolvedValue(1);
    const res = await call(PATCH, { body });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'invalid_profile' });
    expect(updateMember).not.toHaveBeenCalled();
  });

  it('rejects unknown sports', async () => {
    vi.mocked(countSports).mockResolvedValue(0);
    expect((await call(PATCH, { body: { sportIds: ['nope'] } })).status).toBe(400);
  });
});
