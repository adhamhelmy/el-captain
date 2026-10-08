import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/sport', () => ({ findSport: vi.fn(), mergeSport: vi.fn() }));

import { POST } from './route';
import { findSport, mergeSport } from '@/prisma/models/sport';
import { call, signInAs } from '@/test/api';

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('a1', 'ADMIN');
  vi.mocked(findSport).mockImplementation(((id: string) => Promise.resolve({ id, status: 'APPROVED' })) as any);
});

describe('POST /api/admin/sports/[id]/merge', () => {
  it('merges one sport into another', async () => {
    expect((await call(POST, { params: { id: 's9' }, body: { intoId: 's1' } })).status).toBe(200);
    expect(mergeSport).toHaveBeenCalledWith('s9', 's1');
  });

  it('only merges into an approved sport', async () => {
    vi.mocked(findSport).mockImplementation(((id: string) => Promise.resolve({ id, status: id === 's1' ? 'PENDING' : 'APPROVED' })) as any);
    expect((await call(POST, { params: { id: 's9' }, body: { intoId: 's1' } })).status).toBe(400);
    expect(mergeSport).not.toHaveBeenCalled();
  });

  it('refuses merging into itself or into a missing sport', async () => {
    expect((await call(POST, { params: { id: 's1' }, body: { intoId: 's1' } })).status).toBe(400);
    vi.mocked(findSport).mockImplementation(((id: string) => Promise.resolve(id === 's1' ? null : { id })) as any);
    expect((await call(POST, { params: { id: 's9' }, body: { intoId: 's1' } })).status).toBe(404);
    expect(mergeSport).not.toHaveBeenCalled();
  });
});
