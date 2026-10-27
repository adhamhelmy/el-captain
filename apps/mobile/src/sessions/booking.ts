import { canMemberCancel, sessionPhase } from '@el-captain/rules/session-rules';

type BookingInfo = {
  type: 'GROUP' | 'PRIVATE';
  status: string;
  startsAt: string;
  capacity: number;
  booked: number;
  bookedByMe: boolean;
  payBy?: string | null;
};

export type BookingState =
  | 'cancelled'
  | 'past'
  | 'logIn'
  | 'notMember'
  | 'full'
  | 'reserve'
  | 'pay'
  | 'bookedCanCancel'
  | 'bookedTooLate'
  | 'bookedPrivate';

/** What the payment return link reports in `?payment=`. */
export const PAYMENT_OUTCOMES = ['paid', 'pending', 'failed', 'refunded'] as const;
export type PaymentOutcome = (typeof PAYMENT_OUTCOMES)[number];

export const paymentOutcome = (value: unknown): PaymentOutcome | null => PAYMENT_OUTCOMES.find((o) => o === value) ?? null;

/**
 * What the session page's booking panel shows, following the web's SessionDetail panel.
 * Only members book; a signed-in coach or studio sees the price with no button.
 * A member holding an unpaid spot (`payBy`) is asked to pay for it.
 */
export function bookingState(s: BookingInfo, signedIn: boolean, now = new Date(), role = 'USER'): BookingState {
  const phase = sessionPhase(s, now);
  if (phase !== 'upcoming') return phase;
  if (s.bookedByMe) {
    if (s.type === 'PRIVATE') return 'bookedPrivate';
    return canMemberCancel(s.startsAt, now) ? 'bookedCanCancel' : 'bookedTooLate';
  }
  if (s.payBy) return 'pay';
  if (!signedIn) return 'logIn';
  if (role !== 'USER') return 'notMember';
  return s.booked >= s.capacity ? 'full' : 'reserve';
}
