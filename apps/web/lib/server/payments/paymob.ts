import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Checkout, CheckoutInput, PaymentProvider, TransactionResult } from './provider';

const BASE = 'https://accept.paymob.com';

/** Read at call time, so a missing key fails the request that needs it rather than the build. */
function env(name: 'PAYMOB_SECRET_KEY' | 'PAYMOB_PUBLIC_KEY' | 'PAYMOB_HMAC_SECRET' | 'PAYMOB_CARD_INTEGRATION_ID') {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const toPiastres = (egp: number) => Math.round(egp * 100);

/** The fields Paymob signs, in its order (alphabetical by key). Keys are the flat names of the redirect query. */
const SIGNED = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure',
  'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment', 'is_voided', 'order', 'owner', 'pending',
  'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
] as const;

/** A field as Paymob signs it: plain values as text, anything missing (or not a plain value) as empty. */
const text = (v: unknown) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : '');

/** SHA-512 HMAC over the signed fields joined with no separator. */
export function transactionHmac(fields: Record<string, unknown>, secret: string) {
  return createHmac('sha512', secret).update(SIGNED.map((k) => text(fields[k])).join('')).digest('hex');
}

function matches(fields: Record<string, unknown>, hmac: string) {
  const expected = Buffer.from(transactionHmac(fields, env('PAYMOB_HMAC_SECRET')));
  const given = Buffer.from(hmac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function toResult(f: Record<string, unknown>): TransactionResult {
  return {
    paymentId: text(f.merchant_order_id),
    transactionId: text(f.id),
    success: text(f.success) === 'true',
    pending: text(f.pending) === 'true',
    amountCents: Number(f.amount_cents),
  };
}

type CallbackTransaction = Record<string, unknown> & {
  order?: { id?: unknown; merchant_order_id?: unknown };
  source_data?: { pan?: unknown; sub_type?: unknown; type?: unknown };
  special_reference?: unknown;
};

/** Flattens the processed callback's `obj` into the redirect's key names. */
function flatten(obj: CallbackTransaction): Record<string, unknown> {
  const { order, source_data, ...rest } = obj;
  return {
    ...rest,
    order: order?.id,
    merchant_order_id: order?.merchant_order_id ?? obj.special_reference,
    'source_data.pan': source_data?.pan,
    'source_data.sub_type': source_data?.sub_type,
    'source_data.type': source_data?.type,
  };
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Token ${env('PAYMOB_SECRET_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Paymob ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function splitName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { first_name: first || 'NA', last_name: rest.join(' ') || 'NA' };
}

export const paymob: PaymentProvider = {
  async createCheckout(input: CheckoutInput): Promise<Checkout> {
    const integrationId = Number(env('PAYMOB_CARD_INTEGRATION_ID'));
    const data = await post('/v1/intention/', {
      amount: input.amountCents,
      currency: 'EGP',
      payment_methods: [integrationId],
      items: [{ name: input.description, amount: input.amountCents, quantity: 1 }],
      billing_data: {
        ...splitName(input.customer.name),
        email: input.customer.email,
        // Paymob rejects an intention without a phone number.
        phone_number: input.customer.phone || 'NA',
      },
      special_reference: input.paymentId,
      notification_url: input.notificationUrl,
      redirection_url: input.redirectionUrl,
    });
    const clientSecret = String(data.client_secret);
    return { intentionId: String(data.id), clientSecret, checkoutUrl: this.checkoutUrl(clientSecret) };
  },

  checkoutUrl(clientSecret) {
    return `${BASE}/unifiedcheckout/?publicKey=${encodeURIComponent(env('PAYMOB_PUBLIC_KEY'))}&clientSecret=${encodeURIComponent(clientSecret)}`;
  },

  verifyCallback(body, hmac) {
    const obj = (body as { obj?: CallbackTransaction } | null)?.obj;
    if (!obj || typeof obj !== 'object') return null;
    const fields = flatten(obj);
    return matches(fields, hmac) ? toResult(fields) : null;
  },

  verifyRedirect(query) {
    return query.hmac && matches(query, query.hmac) ? toResult(query) : null;
  },

  async refund(transactionId, amountCents) {
    await post('/api/acceptance/void_refund/refund', { transaction_id: Number(transactionId), amount_cents: amountCents });
  },
};
