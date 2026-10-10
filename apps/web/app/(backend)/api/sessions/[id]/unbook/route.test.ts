import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/prisma/models/booking', () => ({ unbookSession: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn() }));

import { POST } from './route';
import { unbookSession } from '@/prisma/models/booking';
import { findSession } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sessionRow } from '@/test/sessions';

const params = { id: 'x1' };
const hour = 60 * 60 * 1000;

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('u1', 'USER');
  vi.mocked(unbookSession).mockResolvedValue(true);
});

describe('POST /api/sessions/[id]/unbook', () => {
  it('cancels a booking more than 2 hours ahead', async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ startsAt: new Date(Date.now() + 3 * hour) }) as any);
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ bookedByMe: false });
    expect(unbookSession).toHaveBeenCalledWith('x1', 'u1');
  });

  it('refuses inside the 2-hour window', async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ startsAt: new Date(Date.now() + hour) }) as any);
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'cancel_too_late' });
    expect(unbookSession).not.toHaveBeenCalled();
  });

  it('refuses a private session: only its coach cancels it', async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ type: 'PRIVATE', startsAt: new Date(Date.now() + 3 * hour) }) as any);
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'session_closed' });
    expect(unbookSession).not.toHaveBeenCalled();
  });

  it('returns 404 when the member had no booking', async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ startsAt: new Date(Date.now() + 3 * hour) }) as any);
    vi.mocked(unbookSession).mockResolvedValue(false);
    expect((await call(POST, { params, body: {} })).status).toBe(404);
  });
});
