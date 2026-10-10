import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/lib/server/coach-guard', () => ({ assertActiveCoach: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn(), cancelSession: vi.fn() }));
vi.mock('@/lib/email/session-emails', () => ({ sendSessionCancelled: vi.fn() }));

import { POST } from './route';
import { cancelSession, findSession } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sendSessionCancelled } from '@/lib/email/session-emails';
import { sessionRow } from '@/test/sessions';

const params = { id: 'x1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findSession).mockResolvedValue(sessionRow() as any);
  vi.mocked(cancelSession).mockResolvedValue([{ id: 'u1', email: 'u@x.com', locale: 'ar' }]);
});

describe('POST /api/sessions/[id]/cancel', () => {
  it('lets the coach cancel with a trimmed reason', async () => {
    signInAs('k1', 'COACH');
    expect((await call(POST, { params, body: { reason: ' Injury ' } })).status).toBe(200);
    expect(cancelSession).toHaveBeenCalledWith('x1', 'COACH', 'Injury');
    expect(sendSessionCancelled).toHaveBeenCalledWith(
      [{ id: 'u1', email: 'u@x.com', locale: 'ar' }],
      expect.objectContaining({ id: 'x1' }),
      'Injury',
    );
  });

  it('lets an admin cancel any session', async () => {
    signInAs('a1', 'ADMIN');
    await call(POST, { params, body: {} });
    expect(cancelSession).toHaveBeenCalledWith('x1', 'ADMIN', null);
  });

  it('refuses another coach and members', async () => {
    signInAs('k2', 'COACH');
    expect((await call(POST, { params, body: {} })).status).toBe(403);
    signInAs('u1', 'USER');
    expect((await call(POST, { params, body: {} })).status).toBe(403);
  });

  it('refuses a session that already started or was cancelled', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(findSession).mockResolvedValue(sessionRow({ startsAt: new Date(Date.now() - 1000) }) as any);
    expect(await (await call(POST, { params, body: {} })).json()).toMatchObject({ code: 'session_closed' });
    vi.mocked(findSession).mockResolvedValue(sessionRow() as any);
    vi.mocked(cancelSession).mockResolvedValue(null);
    expect((await call(POST, { params, body: {} })).status).toBe(409);
  });

  it('rejects a reason over 1,000 characters', async () => {
    signInAs('k1', 'COACH');
    expect((await call(POST, { params, body: { reason: 'x'.repeat(1001) } })).status).toBe(400);
  });
});
