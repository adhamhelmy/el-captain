import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/payments/checkout', () => ({ settle: vi.fn() }));
vi.mock('@/lib/server/payments/paymob', () => ({ paymob: { verifyCallback: vi.fn() } }));

import { POST } from './route';
import { settle } from '@/lib/server/payments/checkout';
import { paymob } from '@/lib/server/payments/paymob';
import { call } from '@/test/api';

const result = { paymentId: 'p1', transactionId: 't1', success: true, pending: false, amountCents: 35000 };
const url = 'http://localhost/api/payments/paymob/webhook?hmac=abc';

beforeEach(() => vi.clearAllMocks());

describe('POST /api/payments/paymob/webhook', () => {
  it('settles a signed transaction', async () => {
    vi.mocked(paymob.verifyCallback).mockReturnValue(result);
    const body = { type: 'TRANSACTION', obj: { id: 1 } };
    const res = await call(POST, { url, body });
    expect(res.status).toBe(200);
    expect(paymob.verifyCallback).toHaveBeenCalledWith(body, 'abc');
    expect(settle).toHaveBeenCalledWith(result);
  });

  it('refuses a bad signature without touching anything', async () => {
    vi.mocked(paymob.verifyCallback).mockReturnValue(null);
    expect((await call(POST, { url, body: {} })).status).toBe(401);
    expect(settle).not.toHaveBeenCalled();
  });
});
