import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/lib/server/coach-guard', () => ({ assertActiveCoach: vi.fn() }));
vi.mock('@/prisma/models/private-request', () => ({ findRequest: vi.fn(), acceptRequest: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn() }));
vi.mock('@/lib/email/session-emails', () => ({ sendRequestAccepted: vi.fn() }));

import { POST } from './route';
import { sendRequestAccepted } from '@/lib/email/session-emails';
import { acceptRequest, findRequest } from '@/prisma/models/private-request';
import { findSession } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { requestRow, sessionRow } from '@/test/sessions';

const params = { id: 'r1' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
  vi.mocked(findRequest).mockResolvedValue(requestRow() as any);
  vi.mocked(findSession).mockResolvedValue(sessionRow({ id: 'x9', type: 'PRIVATE', capacity: 1 }) as any);
});

describe('POST /api/private-requests/[id]/accept', () => {
  it('accepts and emails the member', async () => {
    vi.mocked(acceptRequest).mockResolvedValue({ ok: true, sessionId: 'x9' });
    expect((await call(POST, { params, body: {} })).status).toBe(200);
    expect(acceptRequest).toHaveBeenCalledWith('r1', 'k1');
    expect(sendRequestAccepted).toHaveBeenCalledWith({ id: 'u1', email: 'u@x.com', locale: 'ar' }, expect.objectContaining({ id: 'x9' }));
  });

  it.each([
    ['closed', 'request_closed'],
    ['conflict', 'time_conflict'],
  ] as const)('answers %s with 409 %s', async (reason, code) => {
    vi.mocked(acceptRequest).mockResolvedValue({ ok: false, reason });
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code });
    expect(sendRequestAccepted).not.toHaveBeenCalled();
  });

  it("refuses another coach's request", async () => {
    signInAs('k2', 'COACH');
    expect((await call(POST, { params, body: {} })).status).toBe(403);
    expect(acceptRequest).not.toHaveBeenCalled();
  });
});
