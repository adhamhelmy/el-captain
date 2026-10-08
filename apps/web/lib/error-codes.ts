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

/** The code if the form knows it, otherwise 'generic'. */
export const pickError = <C extends string>(known: readonly C[], code: string | undefined): C | 'generic' =>
  known.includes(code as C) ? (code as C) : 'generic';
