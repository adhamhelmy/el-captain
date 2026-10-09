import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/private-request', () => ({ findRequest: vi.fn(), cancelRequest: vi.fn() }));

import { POST } from './route';
import { cancelRequest, findRequest } from '@/prisma/models/private-request';
import { call, signInAs } from '@/test/api';
import { requestRow } from '@/test/sessions';

const params = { id: 'r1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findRequest).mockResolvedValue(requestRow() as any);
});

describe('POST /api/private-requests/[id]/cancel', () => {
  it('lets the member withdraw a pending request', async () => {
    signInAs('u1', 'USER');
    vi.mocked(cancelRequest).mockResolvedValue(true);
    expect((await call(POST, { params, body: {} })).status).toBe(200);
    expect(cancelRequest).toHaveBeenCalledWith('r1', 'u1');
  });

  it("refuses another member's request", async () => {
    signInAs('u2', 'USER');
    expect((await call(POST, { params, body: {} })).status).toBe(403);
  });

  it('answers 409 when it is no longer pending', async () => {
    signInAs('u1', 'USER');
    vi.mocked(cancelRequest).mockResolvedValue(false);
    expect((await call(POST, { params, body: {} })).status).toBe(409);
  });
});
