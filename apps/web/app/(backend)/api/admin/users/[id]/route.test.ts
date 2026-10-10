import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/member', () => ({ findMember: vi.fn(), setMemberSuspended: vi.fn() }));

import { GET, PATCH } from './route';
import { findMember, setMemberSuspended } from '@/prisma/models/member';
import { call, signInAs } from '@/test/api';

const member = {
  id: 'u1',
  name: 'Ali',
  email: 'a@b.com',
  phone: null,
  passwordHash: 'x',
  suspendedAt: null,
  emailVerified: new Date(0),
  favouriteSports: [],
};
const params = { id: 'u1' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('admin', 'ADMIN');
  vi.mocked(findMember).mockResolvedValue(member as any);
});

describe('GET /api/admin/users/[id]', () => {
  it('returns the member without the password hash', async () => {
    const json = await (await call(GET, { params })).json();
    expect(json).toMatchObject({ id: 'u1', name: 'Ali', suspendedAt: null, emailVerified: true });
    expect(json).not.toHaveProperty('passwordHash');
  });

  it('is admin only', async () => {
    signInAs('u2', 'USER');
    expect((await call(GET, { params })).status).toBe(403);
  });

  it('returns 404 for an id that is not a member', async () => {
    vi.mocked(findMember).mockResolvedValue(null);
    expect((await call(GET, { params })).status).toBe(404);
  });
});

describe('PATCH /api/admin/users/[id]', () => {
  it('suspends a member', async () => {
    vi.mocked(setMemberSuspended).mockResolvedValue({ ...member, suspendedAt: new Date() } as any);
    expect((await call(PATCH, { params, body: { suspended: true } })).status).toBe(200);
    expect(setMemberSuspended).toHaveBeenCalledWith('u1', true);
  });

  it('needs a true or false', async () => {
    expect((await call(PATCH, { params, body: { suspended: 'yes' } })).status).toBe(400);
    expect(setMemberSuspended).not.toHaveBeenCalled();
  });

  it('returns 404 when the id is not a member', async () => {
    vi.mocked(setMemberSuspended).mockResolvedValue(null);
    expect((await call(PATCH, { params, body: { suspended: true } })).status).toBe(404);
  });
});
