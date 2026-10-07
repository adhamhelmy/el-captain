import { describe, it, expect, vi, beforeEach } from 'vitest'
import { call } from '@/test/api'

vi.mock('@/prisma/models/user', () => ({ findUserByEmail: vi.fn() }))
vi.mock('@/lib/auth-emails', () => ({ sendVerificationEmail: vi.fn() }))

import { POST } from './route'
import { findUserByEmail } from '@/prisma/models/user'
import { sendVerificationEmail } from '@/lib/auth-emails'

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('answers 200 for an unknown email without sending anything', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null)
    const res = await call(POST, { body: { email: 'x@y.com' } })
    expect(res.status).toBe(200)
    expect(sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('does not send to an account that is already verified', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({ id: 'u1', emailVerified: new Date() } as any)
    const res = await call(POST, { body: { email: 'x@y.com' } })
    expect(res.status).toBe(200)
    expect(sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('sends a new link to an unverified account', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({ id: 'u1', emailVerified: null } as any)
    const res = await call(POST, { body: { email: ' X@Y.com' } })
    expect(res.status).toBe(200)
    expect(findUserByEmail).toHaveBeenCalledWith('x@y.com')
    expect(sendVerificationEmail).toHaveBeenCalled()
  })

  it('skips the lookup for an invalid email, with the same answer', async () => {
    const res = await call(POST, { body: { email: 'nope' } })
    expect(res.status).toBe(200)
    expect(findUserByEmail).not.toHaveBeenCalled()
    expect(sendVerificationEmail).not.toHaveBeenCalled()
  })
})
