/** What booking code needs from a card payment provider. Paymob is the only one today. */

export type CheckoutInput = {
  /** Our Payment id; the provider echoes it back on callbacks. */
  paymentId: string;
  amountCents: number;
  description: string;
  customer: { name: string; email: string; phone: string | null };
  /** Server-to-server callback. */
  notificationUrl: string;
  /** Where the member's browser lands after paying. */
  redirectionUrl: string;
};

export type Checkout = { intentionId: string; clientSecret: string; checkoutUrl: string };

export type TransactionResult = { paymentId: string; transactionId: string; success: boolean; pending: boolean; amountCents: number };

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<Checkout>;
  /** The payment page for a checkout created earlier, so a member can go back to it. */
  checkoutUrl(clientSecret: string): string;
  /** The transaction in a server callback, or null when the signature doesn't match. */
  verifyCallback(body: unknown, hmac: string): TransactionResult | null;
  /** The transaction in the redirect query (signature included), or null when it doesn't match. */
  verifyRedirect(query: Record<string, string>): TransactionResult | null;
  refund(transactionId: string, amountCents: number): Promise<void>;
}
