import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/payments/checkout', () => ({ settle: vi.fn() }));
vi.mock('@/lib/server/payments/paymob', () => ({ paymob: { verifyRedirect: vi.fn() } }));
vi.mock('@/prisma/models/payment', () => ({ paymentReturnUrl: vi.fn(async () => null) }));

import { GET } from './route';
import { settle } from '@/lib/server/payments/checkout';
import { paymob } from '@/lib/server/payments/paymob';
import { paymentReturnUrl } from '@/prisma/models/payment';
import { call } from '@/test/api';

const result = { paymentId: 'p1', transactionId: 't1', success: true, pending: false, amountCents: 35000 };
const url = 'http://localhost/api/payments/paymob/return?id=t1&success=true&hmac=abc';
const member = { id: 'u1', email: 'u@x.com', locale: 'en' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(paymob.verifyRedirect).mockReturnValue(result);
});

describe('GET /api/payments/paymob/return', () => {
  it.each([
    [{ kind: 'confirmed', sessionId: 's1', member }, 'paid'],
    [{ kind: 'already', sessionId: 's1' }, 'paid'],
    [{ kind: 'pending', sessionId: 's1' }, 'pending'],
    [{ kind: 'failed', sessionId: 's1' }, 'failed'],
    [{ kind: 'refund', sessionId: 's1', paymentId: 'p1', transactionId: 't1', amountCents: 35000 }, 'refunded'],
  ] as const)('settles and shows the session with the outcome (%o)', async (outcome, shown) => {
    vi.mocked(settle).mockResolvedValue(outcome);
    const res = await call(GET, { url });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe(`http://localhost/user/sessions/s1?payment=${shown}`);
    expect(paymob.verifyRedirect).toHaveBeenCalledWith({ id: 't1', success: 'true', hmac: 'abc' });
  });

  it('sends the member back to the app when checkout started there', async () => {
    vi.mocked(settle).mockResolvedValue({ kind: 'confirmed', sessionId: 's1', member });
    vi.mocked(paymentReturnUrl).mockResolvedValue('exp://192.168.1.5:8081/--/session/s1');
    const res = await call(GET, { url });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('exp://192.168.1.5:8081/--/session/s1?payment=paid');
    expect(paymentReturnUrl).toHaveBeenCalledWith('p1');
  });

  it('sends a forged or tampered return to my sessions without settling', async () => {
    vi.mocked(paymob.verifyRedirect).mockReturnValue(null);
    const res = await call(GET, { url });
    expect(res.headers.get('location')).toBe('http://localhost/user/sessions/me');
    expect(settle).not.toHaveBeenCalled();
  });
});
