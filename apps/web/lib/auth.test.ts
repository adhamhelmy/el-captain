import { beforeEach, describe, it, expect, vi } from 'vitest'
import bcrypt from 'bcryptjs'

vi.mock('@/prisma/models/user', () => ({ findUserByEmail: vi.fn() }))

import { authOptions } from './auth'
import { ERROR_CODES } from './error-codes'
import { findUserByEmail } from '@/prisma/models/user'

describe('authOptions', () => {
  it('uses jwt session strategy', () => {
    expect(authOptions.session?.strategy).toBe('jwt')
  })

  it('has credentials provider', () => {
    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0].id).toBe('credentials')
  })

  it('redirects sign-in to /login', () => {
    expect(authOptions.pages?.signIn).toBe('/login')
  })
})

describe('credentials authorize', () => {
  const authorize = (authOptions.providers[0] as any).options.authorize as (c: object) => Promise<unknown>

  beforeEach(async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: 'u1', name: 'A', email: 'a@b.com', role: 'USER',
      passwordHash: await bcrypt.hash('password123', 4), emailVerified: new Date(),
    } as any)
  })

  it('signs in with the right password, matching the email case-insensitively', async () => {
    expect(await authorize({ email: ' A@B.com', password: 'password123' })).toMatchObject({ id: 'u1' })
    expect(findUserByEmail).toHaveBeenCalledWith('a@b.com')
  })

  it('rejects an invalid email without looking it up', async () => {
    vi.mocked(findUserByEmail).mockClear()
    expect(await authorize({ email: 'nope', password: 'password123' })).toBeNull()
    expect(findUserByEmail).not.toHaveBeenCalled()
  })

  it('rejects a wrong password', async () => {
    expect(await authorize({ email: 'a@b.com', password: 'nope' })).toBeNull()
  })

  it('refuses an unverified email only once the password matched', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: 'u1', passwordHash: await bcrypt.hash('password123', 4), emailVerified: null,
    } as any)
    await expect(authorize({ email: 'a@b.com', password: 'password123' })).rejects.toThrow(ERROR_CODES.EMAIL_NOT_VERIFIED)
    expect(await authorize({ email: 'a@b.com', password: 'wrong' })).toBeNull()
  })
})
