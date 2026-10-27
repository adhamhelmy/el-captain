import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/lib/email/session-emails', () => ({ sendBookingConfirmed: vi.fn() }));
vi.mock('@/prisma/models/session', () => ({ findSession: vi.fn() }));
vi.mock('@/prisma/models/payment', () => ({
  openPayment: vi.fn(),
  findPayer: vi.fn(),
  createPayment: vi.fn(),
  attachCheckout: vi.fn(),
  settlePayment: vi.fn(),
  markRefund: vi.fn(),
  paidPayments: vi.fn(),
  setReturnUrl: vi.fn(),
}));
vi.mock('./paymob', () => ({
  toPiastres: (egp: number) => egp * 100,
  paymob: { createCheckout: vi.fn(), checkoutUrl: vi.fn((cs: string) => `checkout:${cs}`), refund: vi.fn() },
}));

import { sendBookingConfirmed } from '@/lib/email/session-emails';
import { attachCheckout, createPayment, findPayer, markRefund, openPayment, paidPayments, setReturnUrl, settlePayment } from '@/prisma/models/payment';
import { findSession } from '@/prisma/models/session';
import { sessionRow } from '@/test/sessions';
import { refundBookings, settle, startCheckout } from './checkout';
import { paymob } from './paymob';

const payer = { id: 'u1', name: 'Mona Adel', email: 'u@x.com', phone: null };
const result = { paymentId: 'p1', transactionId: 't1', success: true, pending: false, amountCents: 35000 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('APP_URL', 'https://app.test');
  vi.mocked(paymob.refund).mockReset().mockResolvedValue(undefined);
  vi.mocked(openPayment).mockResolvedValue(null);
  vi.mocked(findPayer).mockResolvedValue(payer as any);
  vi.mocked(createPayment).mockResolvedValue({ id: 'p1', amountCents: 35000 } as any);
  vi.mocked(paymob.createCheckout).mockResolvedValue({ intentionId: 'pi_1', clientSecret: 'cs_1', checkoutUrl: 'checkout:cs_1' });
});

describe('startCheckout', () => {
  it('records the payment, asks Paymob for a checkout and keeps its secret', async () => {
    expect(await startCheckout({ bookingId: 'b1', price: 350 }, 'u1', 'Football')).toBe('checkout:cs_1');
    expect(createPayment).toHaveBeenCalledWith({ bookingId: 'b1', memberId: 'u1', amountCents: 35000, returnUrl: null });
    expect(paymob.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: 'p1', amountCents: 35000, description: 'Football', customer: payer }),
    );
    const input = vi.mocked(paymob.createCheckout).mock.calls[0][0];
    expect(input.notificationUrl).toMatch(/\/api\/payments\/paymob\/webhook$/);
    expect(input.redirectionUrl).toMatch(/\/api\/payments\/paymob\/return$/);
    expect(attachCheckout).toHaveBeenCalledWith('p1', expect.objectContaining({ intentionId: 'pi_1', clientSecret: 'cs_1' }));
  });

  it('sends the member back to the open checkout instead of starting another', async () => {
    vi.mocked(openPayment).mockResolvedValue({ clientSecret: 'cs_old' } as any);
    expect(await startCheckout({ bookingId: 'b1', price: 350 }, 'u1', 'Football')).toBe('checkout:cs_old');
    expect(paymob.createCheckout).not.toHaveBeenCalled();
    expect(createPayment).not.toHaveBeenCalled();
    expect(setReturnUrl).not.toHaveBeenCalled();
  });

  it('keeps the app link to come back to', async () => {
    await startCheckout({ bookingId: 'b1', price: 350 }, 'u1', 'Football', 'exp://host/--/session/x1');
    expect(createPayment).toHaveBeenCalledWith(expect.objectContaining({ returnUrl: 'exp://host/--/session/x1' }));
  });

  it('reopened from another device, comes back to that device', async () => {
    vi.mocked(openPayment).mockResolvedValue({ id: 'p0', clientSecret: 'cs_old', returnUrl: null } as any);
    await startCheckout({ bookingId: 'b1', price: 350 }, 'u1', 'Football', 'elcaptain://session/x1');
    expect(setReturnUrl).toHaveBeenCalledWith('p0', 'elcaptain://session/x1');
  });
});

describe('settle', () => {
  it('emails the member once the booking is confirmed', async () => {
    const member = { id: 'u1', email: 'u@x.com', locale: 'ar' };
    vi.mocked(settlePayment).mockResolvedValue({ kind: 'confirmed', sessionId: 'x1', member });
    vi.mocked(findSession).mockResolvedValue(sessionRow() as any);
    await settle(result);
    expect(sendBookingConfirmed).toHaveBeenCalledWith(member, expect.objectContaining({ id: 'x1' }));
  });

  it('sends nothing when the payment was already settled', async () => {
    vi.mocked(settlePayment).mockResolvedValue({ kind: 'already', sessionId: 'x1' });
    await settle(result);
    expect(sendBookingConfirmed).not.toHaveBeenCalled();
    expect(paymob.refund).not.toHaveBeenCalled();
  });

  it('refunds a payment that came too late', async () => {
    vi.mocked(settlePayment).mockResolvedValue({ kind: 'refund', sessionId: 'x1', paymentId: 'p1', transactionId: 't1', amountCents: 35000 });
    await settle(result);
    expect(paymob.refund).toHaveBeenCalledWith('t1', 35000);
    expect(markRefund).toHaveBeenCalledWith('p1', true);
  });

  it('records a refund Paymob refused', async () => {
    vi.mocked(settlePayment).mockResolvedValue({ kind: 'refund', sessionId: 'x1', paymentId: 'p1', transactionId: 't1', amountCents: 35000 });
    vi.mocked(paymob.refund).mockRejectedValue(new Error('401'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await settle(result);
    expect(markRefund).toHaveBeenCalledWith('p1', false);
  });
});

describe('refundBookings', () => {
  it('refunds every paid payment on the cancelled bookings in full', async () => {
    vi.mocked(paidPayments).mockResolvedValue([
      { id: 'p1', providerTransactionId: 't1', amountCents: 35000 },
      { id: 'p2', providerTransactionId: 't2', amountCents: 50000 },
    ]);
    await refundBookings(['b1', 'b2', 'b3']);
    expect(paidPayments).toHaveBeenCalledWith(['b1', 'b2', 'b3']);
    expect(paymob.refund).toHaveBeenCalledWith('t1', 35000);
    expect(paymob.refund).toHaveBeenCalledWith('t2', 50000);
    expect(markRefund).toHaveBeenCalledWith('p1', true);
    expect(markRefund).toHaveBeenCalledWith('p2', true);
  });

  it('carries on past a refused refund and records it', async () => {
    vi.mocked(paidPayments).mockResolvedValue([
      { id: 'p1', providerTransactionId: 't1', amountCents: 35000 },
      { id: 'p2', providerTransactionId: 't2', amountCents: 50000 },
    ]);
    vi.mocked(paymob.refund).mockRejectedValueOnce(new Error('400'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(refundBookings(['b1', 'b2'])).resolves.toBeUndefined();
    expect(markRefund).toHaveBeenCalledWith('p1', false);
    expect(markRefund).toHaveBeenCalledWith('p2', true);
  });

  it('does nothing without bookings or payments (a free session)', async () => {
    await refundBookings([]);
    expect(paidPayments).not.toHaveBeenCalled();
    vi.mocked(paidPayments).mockResolvedValue([]);
    await refundBookings(['b1']);
    expect(paymob.refund).not.toHaveBeenCalled();
  });
});
