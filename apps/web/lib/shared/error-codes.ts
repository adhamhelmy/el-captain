/** Error codes the API sends back as `code`, so the browser can show the right message. No server imports. */
export const ERROR_CODES = {
  MISSING_FIELDS: 'missing_fields',
  INVALID_ROLE: 'invalid_role',
  EMAIL_TAKEN: 'email_taken',
  INVALID_EMAIL: 'invalid_email',
  WEAK_PASSWORD: 'weak_password',
  INVALID_TOKEN: 'invalid_token',
  WRONG_PASSWORD: 'wrong_password',
  /** signIn() reports this as `error` when the password is right but the email isn't confirmed yet. */
  EMAIL_NOT_VERIFIED: 'email_not_verified',
  /** Upload of the wrong type or size, or a file path outside the coach's own folder. */
  INVALID_UPLOAD: 'invalid_upload',
  /** Submit with required profile fields missing; the response also lists them as `missing`. */
  PROFILE_INCOMPLETE: 'profile_incomplete',
  /** The coach edited their profile while it is under review. */
  PROFILE_LOCKED: 'profile_locked',
  INVALID_STATUS_TRANSITION: 'invalid_status_transition',
  /** A sport with the same name exists; the response carries it as `sport`. */
  SPORT_EXISTS: 'sport_exists',
  /** A profile field failed validation (too long, bad link, bad handle, too many items). */
  INVALID_PROFILE: 'invalid_profile',
  REASON_REQUIRED: 'reason_required',
  /** A coach action that needs an approved coach. */
  COACH_NOT_ACTIVE: 'coach_not_active',
  /** An admin suspended the account. signIn() reports it as `error`; the APIs answer 403 with it. */
  ACCOUNT_SUSPENDED: 'account_suspended',
  /** The session has no spots left. */
  SESSION_FULL: 'session_full',
  /** The session started, was cancelled, or isn't open for booking (e.g. a private session). */
  SESSION_CLOSED: 'session_closed',
  /** A member tried to cancel inside the 2-hour window. */
  CANCEL_TOO_LATE: 'cancel_too_late',
  /** The coach already has a session at that time. */
  TIME_CONFLICT: 'time_conflict',
  /** The private request is no longer pending, or its time has passed. */
  REQUEST_CLOSED: 'request_closed',
  /** The coach doesn't take private requests, or already has one pending from this member. */
  PRIVATE_UNAVAILABLE: 'private_unavailable',
  /** A session field breaks a rule; the response lists them as `fields`. */
  INVALID_SESSION: 'invalid_session',
  /** A venue field breaks a rule; the response lists them as `fields`. */
  INVALID_VENUE: 'invalid_venue',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** The codes each form has its own message for. Anything else shows the generic error. */
export const REGISTER_ERRORS = [
  ERROR_CODES.MISSING_FIELDS,
  ERROR_CODES.INVALID_ROLE,
  ERROR_CODES.INVALID_EMAIL,
  ERROR_CODES.EMAIL_TAKEN,
  ERROR_CODES.WEAK_PASSWORD,
] as const;
export const RESET_PASSWORD_ERRORS = [ERROR_CODES.INVALID_TOKEN, ERROR_CODES.WEAK_PASSWORD] as const;
export const CHANGE_PASSWORD_ERRORS = [ERROR_CODES.WRONG_PASSWORD, ERROR_CODES.WEAK_PASSWORD, ERROR_CODES.MISSING_FIELDS] as const;

/** The login form's message keys: next-auth hands back the error code as a string. */
const SIGN_IN_ERRORS = {
  [ERROR_CODES.EMAIL_NOT_VERIFIED]: 'emailNotVerified',
  [ERROR_CODES.ACCOUNT_SUSPENDED]: 'accountSuspended',
} as const;
export type SignInError = (typeof SIGN_IN_ERRORS)[keyof typeof SIGN_IN_ERRORS] | 'invalidLogin';

/** The login message for a sign-in error code; anything unknown is a wrong email or password. */
export const signInError = (code: string): SignInError => SIGN_IN_ERRORS[code as keyof typeof SIGN_IN_ERRORS] ?? 'invalidLogin';

/** The code if the form knows it, otherwise 'generic'. */
export const pickError = <C extends string>(known: readonly C[], code: string | undefined): C | 'generic' =>
  known.includes(code as C) ? (code as C) : 'generic';
