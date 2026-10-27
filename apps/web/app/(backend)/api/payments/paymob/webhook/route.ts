import { NextResponse } from 'next/server';
import { assertSignedIn, publicRoute, type RequestContext } from '@/lib/server/api';
import { settle } from '@/lib/server/payments/checkout';
import { paymob } from '@/lib/server/payments/paymob';

/** Paymob's server-to-server "transaction processed" callback. Paymob retries until it gets a 200, and settling twice is safe. */
async function webhook({ req, query }: RequestContext) {
  const body = await req.json().catch(() => null);
  const result = paymob.verifyCallback(body, query.get('hmac') ?? '');
  assertSignedIn(result, 'Bad signature');
  await settle(result);
  return NextResponse.json({ ok: true });
}

export const POST = publicRoute(webhook);
