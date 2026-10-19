import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { call } from '@/test/api'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => null) }))
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }))
vi.mock('@/prisma/models/user', () => ({ findUserByEmail: vi.fn(), findAccess: vi.fn() }))

import { GET, POST } from './route'
import { findAccess, findUserByEmail } from '@/prisma/models/user'

process.env.NEXTAUTH_SECRET = 'test-secret'

const account = async (over: object = {}) =>
  vi.mocked(findUserByEmail).mockResolvedValue({
    id: 'k1',
    name: 'Coach',
    email: 'k@b.com',
    role: 'COACH',
    passwordHash: await bcrypt.hash('Password123', 4),
    emailVerified: new Date(),
    suspendedAt: null,
    ...over,
  } as any)

describe('POST /api/auth/token', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(findAccess).mockResolvedValue({ suspended: false, coachStatus: 'PENDING', passwordChangedAt: null })
    await account()
  })

  it('returns a token and the user for the right password', async () => {
    const res = await call(POST, { body: { email: 'K@b.com ', password: 'Password123' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.token).toBe('string')
    expect(body.user).toEqual({ id: 'k1', name: 'Coach', email: 'k@b.com', role: 'COACH', coachStatus: 'PENDING' })
  })

  it('answers 401 without a code for a wrong password or unknown email', async () => {
    const wrong = await call(POST, { body: { email: 'k@b.com', password: 'nope' } })
    expect(wrong.status).toBe(401)
    expect((await wrong.json()).code).toBeUndefined()
    vi.mocked(findUserByEmail).mockResolvedValue(null)
    expect((await call(POST, { body: { email: 'x@b.com', password: 'Password123' } })).status).toBe(401)
  })

  it('answers 403 email_not_verified once the password matched', async () => {
    await account({ emailVerified: null })
    const res = await call(POST, { body: { email: 'k@b.com', password: 'Password123' } })
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('email_not_verified')
  })

  it('answers 403 account_suspended once the password matched', async () => {
    await account({ suspendedAt: new Date() })
    const res = await call(POST, { body: { email: 'k@b.com', password: 'Password123' } })
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('account_suspended')
  })

  it('answers 400 when fields are missing', async () => {
    expect((await call(POST, { body: { email: 'k@b.com' } })).status).toBe(400)
  })
})

describe('GET /api/auth/token', () => {
  beforeEach(() => vi.mocked(findAccess).mockResolvedValue({ suspended: false, coachStatus: 'ACTIVE', passwordChangedAt: null }))

  it('returns the current user for a valid bearer token, with a fresh coach status', async () => {
    await account()
    const { token } = await (await call(POST, { body: { email: 'k@b.com', password: 'Password123' } })).json()
    const res = await GET(new Request('http://localhost/api', { headers: { authorization: `Bearer ${token}` } }) as any, { params: Promise.resolve({}) })
    expect(res.status).toBe(200)
    expect((await res.json()).user).toMatchObject({ id: 'k1', role: 'COACH', coachStatus: 'ACTIVE' })
  })

  it('answers 401 without a token', async () => {
    expect((await call(GET)).status).toBe(401)
  })
})
