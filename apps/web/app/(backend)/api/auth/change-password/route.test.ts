import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { call, signInAs } from '@/test/api'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }))
vi.mock('@/prisma/models/user', () => ({ findUserById: vi.fn(), updatePasswordHash: vi.fn() }))

import { POST } from './route'
import { findUserById, updatePasswordHash } from '@/prisma/models/user'

const body = { currentPassword: 'oldpassword', newPassword: 'NewPassword1' }

describe('POST /api/auth/change-password', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    signInAs('u1')
    vi.mocked(findUserById).mockResolvedValue({ id: 'u1', passwordHash: await bcrypt.hash('oldpassword', 4) } as any)
  })

  it('returns 401 when signed out', async () => {
    signInAs(null)
    const res = await call(POST, { body })
    expect(res.status).toBe(401)
  })

  it('returns 400 for a weak new password', async () => {
    const res = await call(POST, { body: { ...body, newPassword: 'short' } })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('weak_password')
  })

  it('returns 400 when the current password is wrong', async () => {
    const res = await call(POST, { body: { ...body, currentPassword: 'guess12345' } })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('wrong_password')
    expect(updatePasswordHash).not.toHaveBeenCalled()
  })

  it('changes the signed-in user’s password', async () => {
    const res = await call(POST, { body })
    expect(res.status).toBe(200)
    expect(findUserById).toHaveBeenCalledWith('u1')
    const [id, hash] = vi.mocked(updatePasswordHash).mock.calls[0]
    expect(id).toBe('u1')
    expect(await bcrypt.compare('NewPassword1', hash)).toBe(true)
  })
})
