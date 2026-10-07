import { describe, it, expect, vi, beforeEach } from 'vitest'
import { call } from '@/test/api'

vi.mock('@/prisma/models/user', () => ({ findUserByEmail: vi.fn(), createUser: vi.fn() }))
vi.mock('@/lib/auth-emails', () => ({ sendVerificationEmail: vi.fn() }))

import { POST } from './route'
import { createUser, findUserByEmail } from '@/prisma/models/user'
import { sendVerificationEmail } from '@/lib/auth-emails'

const valid = { email: 'a@b.com', password: 'Password123', name: 'Ahmed', role: 'USER' }

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when fields are missing', async () => {
    const res = await call(POST, { body: { email: 'a@b.com' } })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('missing_fields')
  })

  it('returns 400 for a role that cannot self-register', async () => {
    const res = await call(POST, { body: { ...valid, role: 'ADMIN' } })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_role')
    expect(createUser).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid email', async () => {
    const res = await call(POST, { body: { ...valid, email: 'not-an-email' } })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_email')
    expect(createUser).not.toHaveBeenCalled()
  })

  it('returns 400 for a weak password', async () => {
    for (const password of ['Short1', 'password123', 'PASSWORD123', 'Password']) {
      const res = await call(POST, { body: { ...valid, password } })
      expect(res.status).toBe(400)
      expect((await res.json()).code).toBe('weak_password')
    }
    expect(createUser).not.toHaveBeenCalled()
  })

  it('returns 409 when email is taken', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({ id: '1' } as any)
    const res = await call(POST, { body: valid })
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('email_taken')
  })

  it('creates the user with a normalized email and sends the confirmation email', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null)
    vi.mocked(createUser).mockResolvedValue({ id: 'cuid1', email: 'a@b.com', role: 'USER' } as any)
    const res = await call(POST, { body: { ...valid, email: '  A@B.com ' } })
    expect(res.status).toBe(201)
    expect((await res.json()).role).toBe('USER')
    expect(findUserByEmail).toHaveBeenCalledWith('a@b.com')
    expect(vi.mocked(createUser).mock.calls[0][0]).toMatchObject({ email: 'a@b.com' })
    expect(vi.mocked(createUser).mock.calls[0][0].passwordHash).not.toBe('Password123')
    expect(sendVerificationEmail).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 'cuid1' }))
  })
})
