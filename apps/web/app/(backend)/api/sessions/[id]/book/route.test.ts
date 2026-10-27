import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/prisma/models/booking', () => ({ bookSession: vi.fn(), findBooking: vi.fn() }));
vi.mock('@/prisma/models/payment', () => ({ latestPayment: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn() }));
vi.mock('@/prisma/models/member', () => ({ setMemberLocale: vi.fn() }));
vi.mock('@/lib/email/session-emails', () => ({ sendBookingConfirmed: vi.fn() }));
vi.mock('@/lib/server/payments/checkout', () => ({ startCheckout: vi.fn() }));

import { POST } from './route';
import { bookSession, findBooking } from '@/prisma/models/booking';
import { latestPayment } from '@/prisma/models/payment';
import { setMemberLocale } from '@/prisma/models/member';
import { findSession } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sendBookingConfirmed } from '@/lib/email/session-emails';
import { startCheckout } from '@/lib/server/payments/checkout';
import { getServerSession } from 'next-auth';
const signInMember = () => vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER', email: 'u@x.com' } } as any);
import { sessionRow } from '@/test/sessions';

const params = { id: 'x1' };

beforeEach(() => {
  vi.clearAllMocks();
  signInMember();
  vi.mocked(findSession).mockResolvedValue(sessionRow() as any);
});

describe('POST /api/sessions/[id]/book', () => {
  it('books and remembers the member’s language', async () => {
    vi.mocked(bookSession).mockResolvedValue({ ok: true, newlyBooked: true, awaitingPayment: null });
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'x1', bookedByMe: true });
    expect(bookSession).toHaveBeenCalledWith('x1', 'u1', expect.any(Date), 'card');
    expect(setMemberLocale).toHaveBeenCalledWith('u1', 'en');
    expect(sendBookingConfirmed).toHaveBeenCalledWith({ id: 'u1', email: 'u@x.com', locale: 'en' }, expect.objectContaining({ id: 'x1' }), false);
  });

  it("doesn't email again when the member was already booked", async () => {
    vi.mocked(bookSession).mockResolvedValue({ ok: true, newlyBooked: false, awaitingPayment: null });
    await call(POST, { params, body: {} });
    expect(sendBookingConfirmed).not.toHaveBeenCalled();
  });

  it('holds a paid session and sends the member to pay, without confirming yet', async () => {
    const awaitingPayment = { bookingId: 'b1', price: 350 };
    vi.mocked(bookSession).mockResolvedValue({ ok: true, newlyBooked: true, awaitingPayment });
    vi.mocked(startCheckout).mockResolvedValue('https://accept.paymob.com/unifiedcheckout/?publicKey=pk&clientSecret=cs');
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ bookedByMe: false, checkoutUrl: expect.stringContaining('clientSecret=cs') });
    expect(startCheckout).toHaveBeenCalledWith(awaitingPayment, 'u1', sessionRow().title, null);
    expect(sendBookingConfirmed).not.toHaveBeenCalled();
  });

  it("passes on the app's link to come back to after paying", async () => {
    vi.mocked(bookSession).mockResolvedValue({ ok: true, newlyBooked: true, awaitingPayment: { bookingId: 'b1', price: 350 } });
    vi.mocked(startCheckout).mockResolvedValue('https://pay.test/checkout');
    await call(POST, { params, body: { returnUrl: 'exp://192.168.1.5:8081/--/session/x1' } });
    expect(vi.mocked(startCheckout).mock.calls[0][3]).toBe('exp://192.168.1.5:8081/--/session/x1');
  });

  it('answers 502 payment_unavailable when Paymob is down', async () => {
    vi.mocked(bookSession).mockResolvedValue({ ok: true, newlyBooked: true, awaitingPayment: { bookingId: 'b1', price: 350 } });
    vi.mocked(startCheckout).mockRejectedValue(new Error('Paymob /v1/intention/ failed: 500'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ code: 'payment_unavailable' });
  });

  it.each([
    ['full', 409, 'session_full'],
    ['closed', 409, 'session_closed'],
  ] as const)('answers %s with %i %s', async (reason, status, code) => {
    vi.mocked(bookSession).mockResolvedValue({ ok: false, reason });
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(status);
    expect(await res.json()).toMatchObject({ code });
  });

  it('books with cash straight away and says so', async () => {
    vi.mocked(bookSession).mockResolvedValue({ ok: true, newlyBooked: true, awaitingPayment: null });
    vi.mocked(findBooking).mockResolvedValue({ id: 'b1' } as any);
    vi.mocked(latestPayment).mockResolvedValue({ id: 'p1', provider: 'CASH', status: 'PENDING', amountCents: 35000 });
    const res = await call(POST, { params, body: { method: 'cash' } });
    expect(bookSession).toHaveBeenCalledWith('x1', 'u1', expect.any(Date), 'cash');
    expect(await res.json()).toMatchObject({ bookedByMe: true, payment: { method: 'cash', status: 'PENDING', amount: 350 } });
    expect(sendBookingConfirmed).toHaveBeenCalledWith(expect.anything(), expect.anything(), true);
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it("rejects InstaPay, which isn't offered", async () => {
    const res = await call(POST, { params, body: { method: 'instapay' } });
    expect(res.status).toBe(400);
    expect(bookSession).not.toHaveBeenCalled();
  });

  it('rejects an unknown method', async () => {
    const res = await call(POST, { params, body: { method: 'paypal' } });
    expect(res.status).toBe(400);
    expect(bookSession).not.toHaveBeenCalled();
  });

  it.each([
    ['cashLimit', 'cash_limit'],
  ] as const)('answers a refused %s with %s', async (reason, code) => {
    vi.mocked(bookSession).mockResolvedValue({ ok: false, reason });
    const res = await call(POST, { params, body: { method: 'cash' } });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code });
  });

  it('returns 404 for an unknown session', async () => {
    vi.mocked(bookSession).mockResolvedValue({ ok: false, reason: 'missing' });
    expect((await call(POST, { params, body: {} })).status).toBe(404);
  });

  it('is for members only', async () => {
    signInAs('k1', 'COACH');
    expect((await call(POST, { params, body: {} })).status).toBe(403);
  });
});
