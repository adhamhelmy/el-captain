import { NextResponse } from 'next/server';
import { publicRoute, type RequestContext } from '@/lib/server/api';
import { withOutcome } from '@/lib/server/payments/app-return';
import { settle } from '@/lib/server/payments/checkout';
import { paymob } from '@/lib/server/payments/paymob';
import { paymentReturnUrl } from '@/prisma/models/payment';

const SHOWN = { confirmed: 'paid', already: 'paid', pending: 'pending', failed: 'failed', refund: 'refunded' } as const;

/**
 * Where Paymob sends the member's browser after checkout. The query is signed like the webhook, so it settles
 * the payment too (the webhook can't reach a laptop in development), then shows the session with the outcome:
 * in the app when checkout was started there (which closes its in-app browser), otherwise on the web.
 */
async function back({ req }: RequestContext) {
  const query = Object.fromEntries(new URL(req.url).searchParams);
  const mine = () => NextResponse.redirect(new URL('/user/sessions/me', req.url), 303);
  const result = paymob.verifyRedirect(query);
  if (!result) return mine();
  const outcome = await settle(result);
  if (outcome.kind === 'ignored') return mine();
  const app = await paymentReturnUrl(result.paymentId);
  if (app) return NextResponse.redirect(withOutcome(app, SHOWN[outcome.kind]), 303);
  return NextResponse.redirect(new URL(`/user/sessions/${outcome.sessionId}?payment=${SHOWN[outcome.kind]}`, req.url), 303);
}

export const GET = publicRoute(back);
