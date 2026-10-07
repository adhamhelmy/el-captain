import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { call } from '@/test/api'

vi.mock('@/prisma/models/auth-token', () => ({ consumeToken: vi.fn() }))
vi.mock('@/prisma/models/user', () => ({ markEmailVerified: vi.fn(), updatePasswordHash: vi.fn() }))

import { POST } from './route'
import { consumeToken } from '@/prisma/models/auth-token'
import { markEmailVerified, updatePasswordHash } from '@/prisma/models/user'

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 without a token', async () => {
    const res = await call(POST, { body: { password: 'Password123' } })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_token')
  })

  it('returns 400 for a weak password without using the token up', async () => {
    const res = await call(POST, { body: { token: 'tok', password: 'short' } })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('weak_password')
    expect(consumeToken).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid or expired token', async () => {
    vi.mocked(consumeToken).mockResolvedValue(null)
    const res = await call(POST, { body: { token: 'tok', password: 'Password123' } })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_token')
    expect(updatePasswordHash).not.toHaveBeenCalled()
  })

  it('stores a hash of the new password and verifies the email', async () => {
    vi.mocked(consumeToken).mockResolvedValue('u1')
    const res = await call(POST, { body: { token: 'tok', password: 'Password123' } })
    expect(res.status).toBe(200)
    expect(consumeToken).toHaveBeenCalledWith('tok', 'RESET_PASSWORD')
    const [id, hash] = vi.mocked(updatePasswordHash).mock.calls[0]
    expect(id).toBe('u1')
    expect(await bcrypt.compare('Password123', hash)).toBe(true)
    expect(markEmailVerified).toHaveBeenCalledWith('u1')
  })
})
