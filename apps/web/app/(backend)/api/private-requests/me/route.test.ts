import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/prisma/models/booking', () => ({ expireHolds: vi.fn() }));
vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn(async () => 'ACTIVE') }));
vi.mock('@/prisma/models/private-request', () => ({ listMemberRequests: vi.fn(), listCoachRequests: vi.fn() }));

import { GET } from './route';
import { expireHolds } from '@/prisma/models/booking';
import { listCoachRequests, listMemberRequests } from '@/prisma/models/private-request';
import { call, signInAs } from '@/test/api';
import { requestRow } from '@/test/sessions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listMemberRequests).mockResolvedValue([requestRow({ startsAt: new Date(Date.now() - 1000) })] as any);
  vi.mocked(listCoachRequests).mockResolvedValue([requestRow()] as any);
});

describe('GET /api/private-requests/me', () => {
  it("shows a member's sent requests, reporting a passed pending one as expired", async () => {
    signInAs('u1', 'USER');
    expect(await (await call(GET)).json()).toEqual([expect.objectContaining({ id: 'r1', status: 'EXPIRED' })]);
    expect(listMemberRequests).toHaveBeenCalledWith('u1');
  });

  it("shows a coach's received requests", async () => {
    signInAs('k1', 'COACH');
    expect(await (await call(GET)).json()).toEqual([expect.objectContaining({ status: 'PENDING' })]);
    expect(listCoachRequests).toHaveBeenCalledWith('k1');
  });

  it('tidies up lapsed holds first', async () => {
    signInAs('u1', 'USER');
    await call(GET);
    expect(vi.mocked(expireHolds).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(listMemberRequests).mock.invocationCallOrder[0]);
  });

  it.each([
    ['due, with the time to pay by', { status: 'PENDING_PAYMENT', holdUntil: 'soon', cancelledBy: null }, 'due'],
    ['lapsed when the hold ran out', { status: 'PENDING_PAYMENT', holdUntil: 'past', cancelledBy: null }, 'lapsed'],
    ['lapsed once tidied up', { status: 'CANCELLED', holdUntil: 'past', cancelledBy: null }, 'lapsed'],
    ['nothing once paid', { status: 'CONFIRMED', holdUntil: null, cancelledBy: null }, null],
    ['nothing when the coach cancelled', { status: 'CANCELLED', holdUntil: null, cancelledBy: 'COACH' }, null],
  ])('reports an accepted request as %s', async (_, booking, payment) => {
    const soon = new Date(Date.now() + 3_600_000);
    const holdUntil = booking.holdUntil === 'soon' ? soon : booking.holdUntil === 'past' ? new Date(Date.now() - 1000) : null;
    vi.mocked(listMemberRequests).mockResolvedValue([
      requestRow({ status: 'ACCEPTED', sessionId: 'x1', session: { bookings: [{ ...booking, holdUntil }] } }),
    ] as any);
    signInAs('u1', 'USER');
    const [r] = await (await call(GET)).json();
    expect(r.payment).toBe(payment);
    expect(r.payBy).toBe(payment === 'due' ? soon.toISOString() : null);
  });
});
