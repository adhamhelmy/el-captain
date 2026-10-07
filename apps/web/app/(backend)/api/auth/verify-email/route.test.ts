import { describe, it, expect, vi, beforeEach } from 'vitest'
import { call } from '@/test/api'

vi.mock('@/prisma/models/auth-token', () => ({ consumeToken: vi.fn() }))
vi.mock('@/prisma/models/user', () => ({ markEmailVerified: vi.fn() }))

import { POST } from './route'
import { consumeToken } from '@/prisma/models/auth-token'
import { markEmailVerified } from '@/prisma/models/user'

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 without a token', async () => {
    const res = await call(POST, { body: {} })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_token')
  })

  it('returns 400 for an unknown, used or expired token', async () => {
    vi.mocked(consumeToken).mockResolvedValue(null)
    const res = await call(POST, { body: { token: 'nope' } })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_token')
    expect(markEmailVerified).not.toHaveBeenCalled()
  })

  it('verifies the user the token belongs to', async () => {
    vi.mocked(consumeToken).mockResolvedValue('u1')
    const res = await call(POST, { body: { token: 'tok' } })
    expect(res.status).toBe(200)
    expect(consumeToken).toHaveBeenCalledWith('tok', 'VERIFY_EMAIL')
    expect(markEmailVerified).toHaveBeenCalledWith('u1')
  })
})
