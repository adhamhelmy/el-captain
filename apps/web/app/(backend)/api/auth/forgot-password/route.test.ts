import { describe, it, expect, vi, beforeEach } from 'vitest'
import { call } from '@/test/api'

vi.mock('@/prisma/models/user', () => ({ findUserByEmail: vi.fn() }))
vi.mock('@/lib/email/auth-emails', () => ({ sendResetEmail: vi.fn() }))

import { POST } from './route'
import { findUserByEmail } from '@/prisma/models/user'
import { sendResetEmail } from '@/lib/email/auth-emails'

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => vi.clearAllMocks())

  it('answers the same for an unknown email, without sending', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null)
    const res = await call(POST, { body: { email: 'x@y.com' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sendResetEmail).not.toHaveBeenCalled()
  })

  it('sends a reset link to an existing account', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({ id: 'u1', email: 'x@y.com' } as any)
    const res = await call(POST, { body: { email: 'X@y.com' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(findUserByEmail).toHaveBeenCalledWith('x@y.com')
    expect(sendResetEmail).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 'u1' }))
  })

  it('skips the lookup for an invalid email, with the same answer', async () => {
    const res = await call(POST, { body: { email: 'nope' } })
    expect(res.status).toBe(200)
    expect(findUserByEmail).not.toHaveBeenCalled()
    expect(sendResetEmail).not.toHaveBeenCalled()
  })
})
