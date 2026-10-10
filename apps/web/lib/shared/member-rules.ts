/** Member profile rules shared by the profile page and the API. No server imports. */

export const MAX_FAVOURITE_SPORTS = 10;
/** E.164 allows at most 15 digits; anything under 7 is not a reachable number. */
export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;

/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits as their Latin twins, so a number typed on an Arabic keyboard counts. */
const latinDigits = (s: string) => s.replace(/[٠-٩۰-۹]/g, (d) => String(d.codePointAt(0)! & 0xf));

/**
 * A phone number as stored: an optional leading +, then digits only. Spaces, dashes, dots and brackets are dropped.
 * Null when it isn't a phone number.
 */
export function cleanPhone(input: string): string | null {
  const s = latinDigits(input.trim()).replace(/[\s\-.()]/g, '');
  const digits = s.replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return null;
  return digits.length >= PHONE_MIN_DIGITS && digits.length <= PHONE_MAX_DIGITS ? s : null;
}
