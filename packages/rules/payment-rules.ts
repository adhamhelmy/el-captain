/** How a member can pay for a session, shared by the web, its API and the mobile app. */

export const PAYMENT_METHODS = ['card', 'cash'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** A member with this many cash sessions not yet marked paid can't choose cash again. */
export const CASH_UNPAID_LIMIT = 2;

/** The method in a book or pay request. None means card, which is what app versions before cash send. */
export function readPaymentMethod(value: unknown): PaymentMethod | null {
  if (value === undefined || value === null) return 'card';
  return PAYMENT_METHODS.includes(value as PaymentMethod) ? (value as PaymentMethod) : null;
}

/** The methods a paid session offers: card or cash at the session. A free one needs none. */
export const offeredMethods = (price: number): PaymentMethod[] => (price > 0 ? [...PAYMENT_METHODS] : []);
