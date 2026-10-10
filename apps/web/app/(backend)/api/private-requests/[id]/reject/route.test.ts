import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/coach-guard', () => ({ assertActiveCoach: vi.fn() }));
vi.mock('@/prisma/models/private-request', () => ({ findRequest: vi.fn(), rejectRequest: vi.fn() }));
vi.mock('@/lib/email/session-emails', () => ({ sendRequestRejected: vi.fn() }));

import { POST } from './route';
import { sendRequestRejected } from '@/lib/email/session-emails';
import { findRequest, rejectRequest } from '@/prisma/models/private-request';
import { call, signInAs } from '@/test/api';
import { requestRow } from '@/test/sessions';

const params = { id: 'r1' };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('k1', 'COACH');
  vi.mocked(findRequest).mockResolvedValue(requestRow() as any);
});

describe('POST /api/private-requests/[id]/reject', () => {
  it('rejects with a trimmed note and emails the member', async () => {
    vi.mocked(rejectRequest).mockResolvedValue(true);
    expect((await call(POST, { params, body: { note: ' Fully booked ' } })).status).toBe(200);
    expect(rejectRequest).toHaveBeenCalledWith('r1', 'k1', 'Fully booked');
    expect(sendRequestRejected).toHaveBeenCalledWith(
      { id: 'u1', email: 'u@x.com', locale: 'ar' },
      expect.objectContaining({ id: 'r1' }),
      'Fully booked',
    );
  });

  it('answers 409 when it is no longer pending', async () => {
    vi.mocked(rejectRequest).mockResolvedValue(false);
    expect(await (await call(POST, { params, body: {} })).json()).toMatchObject({ code: 'request_closed' });
  });
});
