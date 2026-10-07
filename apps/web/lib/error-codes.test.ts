import { describe, it, expect } from 'vitest'
import { ERROR_CODES, pickError, RESET_PASSWORD_ERRORS } from './error-codes'

describe('pickError', () => {
  it('keeps a code the form knows', () => {
    expect(pickError(RESET_PASSWORD_ERRORS, ERROR_CODES.INVALID_TOKEN)).toBe('invalid_token')
  })
  it('falls back to generic for unknown or missing codes', () => {
    expect(pickError(RESET_PASSWORD_ERRORS, ERROR_CODES.EMAIL_TAKEN)).toBe('generic')
    expect(pickError(RESET_PASSWORD_ERRORS, undefined)).toBe('generic')
  })
})
