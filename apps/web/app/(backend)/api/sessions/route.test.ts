import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/coach-profile', () => ({ findActiveCoach: vi.fn() }));
vi.mock('@/prisma/models/session-request', () => ({ createSessionRequest: vi.fn(), listSessionRequests: vi.fn() }));
vi.mock('@/lib/coach-guard', () => ({ assertActiveCoach: vi.fn() }));

import { GET, POST } from './route';
import { findActiveCoach } from '@/prisma/models/coach-profile';
import { createSessionRequest, listSessionRequests } from '@/prisma/models/session-request';
import { call, signInAs } from '@/test/api';

const request = {
  id: 'r1',
  message: 'Hi',
  status: 'PENDING',
  userId: 'u1',
  coachId: 'k1',
  createdAt: new Date(),
  user: { name: 'Ali', email: 'a@x.com', passwordHash: 'secret' },
  coach: { name: 'Mona', passwordHash: 'secret' },
};

beforeEach(() => vi.clearAllMocks());

describe('POST /api/sessions', () => {
  it('returns 400 without a message', async () => {
    signInAs('u1');
    expect((await call(POST, { body: { coachId: 'k1', message: '  ' } })).status).toBe(400);
  });

  it('returns 404 for an unknown or not yet approved coach', async () => {
    signInAs('u1');
    vi.mocked(findActiveCoach).mockResolvedValue(null);
    expect((await call(POST, { body: { coachId: 'k1', message: 'Hi' } })).status).toBe(404);
  });

  it('sends the request without exposing password hashes', async () => {
    signInAs('u1');
    vi.mocked(findActiveCoach).mockResolvedValue({ id: 'k1' } as any);
    vi.mocked(createSessionRequest).mockResolvedValue(request as any);
    const res = await call(POST, { body: { coachId: 'k1', message: 'Hi' } });
    expect(res.status).toBe(201);
    expect(createSessionRequest).toHaveBeenCalledWith({ coachId: 'k1', userId: 'u1', message: 'Hi' });
    const data = await res.json();
    expect(data).toMatchObject({ id: 'r1', userName: 'Ali', userEmail: 'a@x.com', coachName: 'Mona' });
    expect(JSON.stringify(data)).not.toContain('secret');
  });
});

describe('GET /api/sessions', () => {
  it('shows a coach only the requests sent to them', async () => {
    signInAs('k1', 'COACH');
    vi.mocked(listSessionRequests).mockResolvedValue([request] as any);
    expect((await call(GET)).status).toBe(200);
    expect(listSessionRequests).toHaveBeenCalledWith({ coachId: 'k1' });
  });

  it('shows an admin every request', async () => {
    signInAs('admin', 'ADMIN');
    vi.mocked(listSessionRequests).mockResolvedValue([]);
    await call(GET);
    expect(listSessionRequests).toHaveBeenCalledWith({});
  });
});
