import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/prisma/models/session', () => ({ listAdminSessions: vi.fn() }));

import { GET } from './route';
import { listAdminSessions } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sessionRow } from '@/test/sessions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listAdminSessions).mockResolvedValue([sessionRow()] as any);
});

describe('GET /api/admin/sessions', () => {
  it('passes known filters and drops unknown ones', async () => {
    signInAs('a1', 'ADMIN');
    await call(GET, { url: 'http://localhost/api/admin/sessions?q=%20flow%20&status=CANCELLED&when=past' });
    expect(listAdminSessions).toHaveBeenCalledWith({ q: 'flow', status: 'CANCELLED', when: 'past' }, expect.anything());
    await call(GET, { url: 'http://localhost/api/admin/sessions?status=nope&when=later' });
    expect(listAdminSessions).toHaveBeenLastCalledWith({ q: undefined, status: undefined, when: undefined }, expect.anything());
  });

  it('is admin only', async () => {
    signInAs('k1', 'COACH');
    expect((await call(GET)).status).toBe(403);
  });
});
