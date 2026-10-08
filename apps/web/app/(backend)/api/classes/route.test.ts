import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/prisma/models/class', () => ({ listClasses: vi.fn(), createClass: vi.fn() }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/coach-guard', () => ({ assertActiveCoach: vi.fn() }));

import { GET, POST } from './route';
import { createClass, listClasses } from '@/prisma/models/class';
import { getServerSession } from 'next-auth';
import { assertActiveCoach } from '@/lib/coach-guard';
import { HttpError } from '@/lib/api';

const makeClass = () => ({
  id: 'c1',
  title: 'Yoga',
  type: 'yoga',
  description: null,
  date: new Date('2026-07-01T09:00:00Z'),
  durationMinutes: 60,
  city: 'Cairo',
  address: '10 St',
  capacity: 10,
  spotsLeft: 10,
  imageUrl: null,
  clientId: 'u1',
  createdAt: new Date(),
  client: { name: 'Studio', clientProfile: { studioName: 'My Studio' } },
});

describe('GET /api/classes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns classes as DTOs', async () => {
    vi.mocked(listClasses).mockResolvedValue([makeClass()] as any);
    const req = new Request('http://localhost/api/classes');
    const res = await GET(req as any, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].studioName).toBe('My Studio');
  });

  it('starts from today by default', async () => {
    vi.mocked(listClasses).mockResolvedValue([]);
    await GET(new Request('http://localhost/api/classes') as any, { params: Promise.resolve({}) });
    const [filters] = vi.mocked(listClasses).mock.calls[0];
    const from = filters?.from;
    expect(from?.getHours()).toBe(0);
    expect(from?.toDateString()).toBe(new Date().toDateString());
  });

  it('starts from the given date', async () => {
    vi.mocked(listClasses).mockResolvedValue([]);
    await GET(new Request('http://localhost/api/classes?date=2026-01-05') as any, { params: Promise.resolve({}) });
    expect(vi.mocked(listClasses).mock.calls[0][0]?.from).toEqual(new Date('2026-01-05'));
  });

  it("includes past classes in a host's own list", async () => {
    vi.mocked(listClasses).mockResolvedValue([]);
    await GET(new Request('http://localhost/api/classes?clientId=s1') as any, { params: Promise.resolve({}) });
    expect(vi.mocked(listClasses).mock.calls[0][0]).toMatchObject({ clientId: 's1', from: undefined });
  });
});

describe('POST /api/classes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 for non-STUDIO', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { role: 'USER', id: 'u1' } } as any);
    const req = new Request('http://localhost/api/classes', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req as any, { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });

  it('refuses a coach who is not approved yet', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { role: 'COACH', id: 'k1' } } as any);
    vi.mocked(assertActiveCoach).mockRejectedValueOnce(new HttpError(403, 'Coach not approved', 'coach_not_active'));
    const req = new Request('http://localhost/api/classes', { method: 'POST', body: JSON.stringify({ title: 't' }) });
    const res = await POST(req as any, { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('coach_not_active');
    expect(createClass).not.toHaveBeenCalled();
  });

  it('creates class for STUDIO', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { role: 'STUDIO', id: 'u1' } } as any);
    vi.mocked(createClass).mockResolvedValue(makeClass() as any);
    const req = new Request('http://localhost/api/classes', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Yoga',
        type: 'yoga',
        date: '2026-07-01T09:00:00Z',
        durationMinutes: 60,
        city: 'Cairo',
        address: '10 St',
        capacity: 10,
      }),
    });
    const res = await POST(req as any, { params: Promise.resolve({}) });
    expect(res.status).toBe(201);
  });
});
