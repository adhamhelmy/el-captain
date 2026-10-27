import { assertFound, assertNoConflict } from '@/lib/server/api';
import { toMemberPaymentDTO } from '@/lib/server/dto';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import type { BookOutcome } from '@/prisma/models/booking';
import { latestPayment } from '@/prisma/models/payment';

const REFUSED = {
  full: ERROR_CODES.SESSION_FULL,
  closed: ERROR_CODES.SESSION_CLOSED,
  cashLimit: ERROR_CODES.CASH_LIMIT,
} as const;

/** Answers a refused booking or payment with its error. */
export function assertBooked(outcome: BookOutcome): asserts outcome is Extract<BookOutcome, { ok: true }> {
  if (outcome.ok) return;
  const { reason } = outcome;
  assertFound(reason === 'missing' ? null : reason);
  assertNoConflict(false, 'Cannot book', REFUSED[reason as Exclude<typeof reason, 'missing'>]);
}

/** How the member is paying for this booking, or null when nothing was paid or is owed. */
export async function bookingPayment(bookingId: string) {
  const p = await latestPayment(bookingId);
  return p ? toMemberPaymentDTO(p) : null;
}
