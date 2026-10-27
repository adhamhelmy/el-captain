import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { paymentOutcome, type PaymentOutcome } from './booking';

/** The app's link to this session, which the server sends the in-app browser to after checkout (exp:// in Expo Go). */
export const sessionReturnUrl = (id: string) => Linking.createURL(`/session/${id}`);

/**
 * Opens Paymob's checkout in the in-app browser. It closes itself when the server sends it back to `returnUrl`,
 * and the outcome comes from that link. Null when the member closed the browser before paying.
 */
export async function payInBrowser(checkoutUrl: string, returnUrl: string): Promise<PaymentOutcome | null> {
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
  if (result.type !== 'success') return null;
  return paymentOutcome(Linking.parse(result.url).queryParams?.payment);
}
