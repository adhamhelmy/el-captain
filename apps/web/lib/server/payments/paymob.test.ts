import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paymob, toPiastres, transactionHmac } from './paymob';

const SECRET = 'hmac_test';

/** A processed-callback transaction, trimmed to the fields we read. */
const obj = {
  id: 192036465,
  pending: false,
  amount_cents: 35000,
  success: true,
  is_auth: false,
  is_capture: false,
  is_standalone_payment: true,
  is_voided: false,
  is_refunded: false,
  is_3d_secure: true,
  integration_id: 4123456,
  has_parent_transaction: false,
  error_occured: false,
  currency: 'EGP',
  created_at: '2026-10-21T12:00:00.000000',
  owner: 302852,
  order: { id: 217503754, merchant_order_id: 'pay_1' },
  source_data: { pan: '2346', type: 'card', sub_type: 'MasterCard' },
};

const joined = [
  '35000', '2026-10-21T12:00:00.000000', 'EGP', 'false', 'false', '192036465', '4123456', 'true', 'false', 'false',
  'false', 'true', 'false', '217503754', '302852', 'false', '2346', 'MasterCard', 'card', 'true',
].join('');
const sign = (s: string) => createHmac('sha512', SECRET).update(s).digest('hex');

/** The same transaction as Paymob's redirect query: flat keys, all strings. */
const redirect = {
  id: '192036465', pending: 'false', amount_cents: '35000', success: 'true', is_auth: 'false', is_capture: 'false',
  is_standalone_payment: 'true', is_voided: 'false', is_refunded: 'false', is_3d_secure: 'true', integration_id: '4123456',
  has_parent_transaction: 'false', error_occured: 'false', currency: 'EGP', created_at: '2026-10-21T12:00:00.000000',
  owner: '302852', order: '217503754', merchant_order_id: 'pay_1', 'source_data.pan': '2346', 'source_data.type': 'card',
  'source_data.sub_type': 'MasterCard',
};

const fetchMock = vi.fn();
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) });
const checkoutInput = {
  paymentId: 'pay_1',
  amountCents: 35000,
  description: 'Football session',
  customer: { name: 'Mona Adel', email: 'mona@test.elcaptain.com', phone: null },
  notificationUrl: 'https://app.test/api/payments/paymob/webhook',
  redirectionUrl: 'https://app.test/payments/return',
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('PAYMOB_SECRET_KEY', 'sk_test');
  vi.stubEnv('PAYMOB_PUBLIC_KEY', 'pk_test');
  vi.stubEnv('PAYMOB_HMAC_SECRET', SECRET);
  vi.stubEnv('PAYMOB_CARD_INTEGRATION_ID', '4123456');
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('toPiastres', () => {
  it('converts whole pounds to piastres', () => {
    expect(toPiastres(350)).toBe(35000);
  });
});

describe('transactionHmac', () => {
  it('signs the 20 fields in Paymob order, booleans as true/false', () => {
    expect(transactionHmac(redirect, SECRET)).toBe(sign(joined));
  });
});

describe('verifyCallback', () => {
  const result = { paymentId: 'pay_1', transactionId: '192036465', success: true, pending: false, amountCents: 35000 };

  it('returns the transaction when the signature matches', () => {
    expect(paymob.verifyCallback({ type: 'TRANSACTION', obj }, sign(joined))).toEqual(result);
  });
  it('rejects a tampered field', () => {
    expect(paymob.verifyCallback({ type: 'TRANSACTION', obj: { ...obj, success: false } }, sign(joined))).toBeNull();
  });
  it('rejects a signature of the wrong length without throwing', () => {
    expect(paymob.verifyCallback({ type: 'TRANSACTION', obj }, 'abc')).toBeNull();
  });
  it('rejects a body without a transaction', () => {
    expect(paymob.verifyCallback({}, sign(joined))).toBeNull();
  });
});

describe('verifyRedirect', () => {
  it('returns the transaction for a signed query', () => {
    expect(paymob.verifyRedirect({ ...redirect, hmac: sign(joined) })).toMatchObject({ paymentId: 'pay_1', success: true });
  });
  it('rejects a tampered query', () => {
    expect(paymob.verifyRedirect({ ...redirect, amount_cents: '100', hmac: sign(joined) })).toBeNull();
  });
});

describe('createCheckout', () => {
  it('creates an intention and returns the unified checkout URL', async () => {
    fetchMock.mockResolvedValue(ok({ id: 'pi_test_1', client_secret: 'cs_1' }));
    const checkout = await paymob.createCheckout(checkoutInput);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://accept.paymob.com/v1/intention/');
    expect(init.headers.Authorization).toBe('Token sk_test');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      amount: 35000,
      currency: 'EGP',
      payment_methods: [4123456],
      special_reference: 'pay_1',
      notification_url: checkoutInput.notificationUrl,
      redirection_url: checkoutInput.redirectionUrl,
      items: [{ name: 'Football session', amount: 35000, quantity: 1 }],
    });
    expect(body.billing_data).toMatchObject({ first_name: 'Mona', last_name: 'Adel', email: 'mona@test.elcaptain.com', phone_number: 'NA' });
    expect(checkout).toEqual({
      intentionId: 'pi_test_1',
      clientSecret: 'cs_1',
      checkoutUrl: 'https://accept.paymob.com/unifiedcheckout/?publicKey=pk_test&clientSecret=cs_1',
    });
  });
  it('fails with the status when Paymob refuses', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => '{"detail":"bad"}' });
    await expect(paymob.createCheckout(checkoutInput)).rejects.toThrow(/400/);
  });
  it('names a missing env var instead of calling Paymob', async () => {
    vi.stubEnv('PAYMOB_SECRET_KEY', '');
    await expect(paymob.createCheckout(checkoutInput)).rejects.toThrow(/PAYMOB_SECRET_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('refund', () => {
  it('refunds the full amount of a transaction', async () => {
    fetchMock.mockResolvedValue(ok({ id: 1, success: true }));
    await paymob.refund('192036465', 35000);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://accept.paymob.com/api/acceptance/void_refund/refund');
    expect(init.headers.Authorization).toBe('Token sk_test');
    expect(JSON.parse(init.body)).toEqual({ transaction_id: 192036465, amount_cents: 35000 });
  });
  it('fails when Paymob refuses', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' });
    await expect(paymob.refund('192036465', 35000)).rejects.toThrow(/401/);
  });
});
