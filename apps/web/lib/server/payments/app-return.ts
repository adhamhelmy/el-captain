/** Links the app can be opened with: its own scheme, or Expo Go's while partners test. */
const APP_SCHEMES = new Set(['elcaptain:', 'exp:', 'exps:']);

/**
 * The app's return link from a checkout request, or null when there is none or it isn't an app link.
 * Never a web address, so the return route can't be used to send someone to another site.
 */
export function appReturnUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 500) return null;
  try {
    return APP_SCHEMES.has(new URL(value).protocol) ? value : null;
  } catch {
    return null;
  }
}

/** The app link with the payment outcome added, for the session screen to show. */
export function withOutcome(returnUrl: string, shown: string) {
  const url = new URL(returnUrl);
  url.searchParams.set('payment', shown);
  return url.toString();
}
