/** Account rules shared by the forms and the API, so the browser and the server agree. No server imports. */

export const MIN_PASSWORD_LENGTH = 8
/** bcrypt only reads the first 72 bytes, so anything longer would be silently cut off. */
export const MAX_PASSWORD_BYTES = 72
/** A letter and a number, in any language, so Arabic letters and digits (١٢٣) count. */
const PASSWORD_RULES = [/\p{L}/u, /\p{Nd}/u]
/** Letters with no upper or lower case, like Arabic. */
const CASELESS_LETTER = /\p{Lo}/u
/** Asked only when every letter has a case (English, for example), since Arabic has no capitals. */
const MIXED_CASE = [/\p{Lu}/u, /\p{Ll}/u]

export const isStrongPassword = (password: unknown): password is string =>
  typeof password === 'string' &&
  password.length >= MIN_PASSWORD_LENGTH &&
  new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES &&
  PASSWORD_RULES.every((rule) => rule.test(password)) &&
  (CASELESS_LETTER.test(password) || MIXED_CASE.every((rule) => rule.test(password)))

/** The longest address email standards allow. */
export const MAX_EMAIL_LENGTH = 254
/** Something before the @, a domain with at least one dot, no spaces. Deliberately simple, not the full email standard. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/** Expects an already normalized email. */
export const isValidEmail = (email: string) => email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email)

/** Emails are stored trimmed and lowercased, so "Foo@x.com " and "foo@x.com" are one account. */
export const normalizeEmail = (email: unknown) =>
  typeof email === 'string' ? email.trim().toLowerCase() : ''

/** Roles anyone can sign up as. ADMIN is never self-service. */
export const SIGNUP_ROLES = new Set(['USER', 'COACH', 'STUDIO'])
