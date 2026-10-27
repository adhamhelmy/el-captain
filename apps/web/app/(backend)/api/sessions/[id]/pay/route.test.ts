import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/bearer', () => ({ userFromBearer: vi.fn(async () => null) }));
vi.mock('@/prisma/models/booking', () => ({ findBooking: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn() }));
vi.mock('@/lib/server/payments/checkout', () => ({ startCheckout: vi.fn() }));

import { POST } from './route';
import { startCheckout } from '@/lib/server/payments/checkout';
import { findBooking } from '@/prisma/models/booking';
import { findSession } from '@/prisma/models/session';
import { call, signInAs } from '@/test/api';
import { sessionRow } from '@/test/sessions';

const params = { id: 'x1' };
const held = { id: 'b1', status: 'PENDING_PAYMENT', holdUntil: new Date(Date.now() + 60_000) };

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('u1');
  vi.mocked(findBooking).mockResolvedValue(held as any);
  vi.mocked(findSession).mockResolvedValue(sessionRow({ type: 'PRIVATE', capacity: 1, price: 800 }) as any);
  vi.mocked(startCheckout).mockResolvedValue('https://pay.test/checkout');
});

describe('POST /api/sessions/[id]/pay', () => {
  it('sends the member to pay for the spot they hold', async () => {
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ checkoutUrl: 'https://pay.test/checkout' });
    expect(findBooking).toHaveBeenCalledWith('x1', 'u1');
    expect(startCheckout).toHaveBeenCalledWith({ bookingId: 'b1', price: 800 }, 'u1', sessionRow().title, null);
  });

  it("passes on the app's link to come back to, but never a web address", async () => {
    await call(POST, { params, body: { returnUrl: 'elcaptain://session/x1' } });
    expect(vi.mocked(startCheckout).mock.calls[0][3]).toBe('elcaptain://session/x1');
    await call(POST, { params, body: { returnUrl: 'https://evil.example' } });
    expect(vi.mocked(startCheckout).mock.calls[1][3]).toBeNull();
  });

  it.each([
    ['the hold lapsed', { ...held, holdUntil: new Date(Date.now() - 1000) }],
    ['it is already paid', { ...held, status: 'CONFIRMED', holdUntil: null }],
    ['it was cancelled', { ...held, status: 'CANCELLED' }],
  ])('answers 409 payment_closed when %s, without calling Paymob', async (_, booking) => {
    vi.mocked(findBooking).mockResolvedValue(booking as any);
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'payment_closed' });
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it('answers 409 when the coach cancelled the session', async () => {
    vi.mocked(findSession).mockResolvedValue(sessionRow({ status: 'CANCELLED' }) as any);
    expect((await call(POST, { params, body: {} })).status).toBe(409);
  });

  it("answers 404 for a session the member holds nothing on (someone else's booking stays theirs)", async () => {
    vi.mocked(findBooking).mockResolvedValue(null);
    expect((await call(POST, { params, body: {} })).status).toBe(404);
  });

  it('answers 502 when Paymob is down', async () => {
    vi.mocked(startCheckout).mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await call(POST, { params, body: {} });
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ code: 'payment_unavailable' });
  });

  it('is for members only', async () => {
    signInAs('k1', 'COACH');
    expect((await call(POST, { params, body: {} })).status).toBe(403);
  });
});
