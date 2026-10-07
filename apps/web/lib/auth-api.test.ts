import { afterEach, describe, it, expect, vi } from 'vitest'
import { changePassword, forgotPassword, register, resendVerification, resetPassword, verifyEmail } from './auth-api'

afterEach(() => vi.unstubAllGlobals())

const reply = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }))

describe('auth-api', () => {
  it('POSTs JSON to the right route', async () => {
    const fetch = reply(200, { ok: true })
    vi.stubGlobal('fetch', fetch)
    await register({ email: 'a@b.com' })
    await verifyEmail('t')
    await resendVerification('a@b.com')
    await forgotPassword('a@b.com')
    await resetPassword('t', 'password123')
    await changePassword('old', 'new')
    expect(fetch.mock.calls.map(([path]) => path)).toEqual([
      '/api/auth/register',
      '/api/auth/verify-email',
      '/api/auth/resend-verification',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/change-password',
    ])
    expect(fetch.mock.calls[4][1]).toMatchObject({ method: 'POST', body: '{"token":"t","password":"password123"}' })
  })
  it('returns ok on success', async () => {
    vi.stubGlobal('fetch', reply(200, { ok: true }))
    expect(await verifyEmail('t')).toEqual({ ok: true })
  })
  it('returns the error code on failure', async () => {
    vi.stubGlobal('fetch', reply(400, { error: 'x', code: 'invalid_token' }))
    expect(await verifyEmail('t')).toEqual({ ok: false, code: 'invalid_token' })
  })
  it('handles a body that is not JSON', async () => {
    vi.stubGlobal('fetch', reply(500))
    expect(await verifyEmail('t')).toEqual({ ok: false, code: undefined })
  })
  it('handles a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await verifyEmail('t')).toEqual({ ok: false })
  })
})
