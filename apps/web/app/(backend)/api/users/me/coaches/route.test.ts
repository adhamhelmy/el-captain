import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/prisma/models/insights', () => ({ listMemberCoaches: vi.fn() }));

import { GET } from './route';
import { listMemberCoaches } from '@/prisma/models/insights';
import { call, signInAs } from '@/test/api';

beforeEach(() => vi.clearAllMocks());

describe('GET /api/users/me/coaches', () => {
  it("lists the member's coaches", async () => {
    signInAs('u1', 'USER');
    vi.mocked(listMemberCoaches).mockResolvedValue([{ coach: { id: 'k1', name: 'Mona', photoPath: null, city: 'Cairo' }, count: 2 }]);
    expect(await (await call(GET)).json()).toEqual([{ id: 'k1', name: 'Mona', photoUrl: null, city: 'Cairo', count: 2 }]);
  });
});
