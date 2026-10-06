import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/prisma/models/user', () => ({ findUserByEmail: vi.fn(), createUser: vi.fn() }))

import { POST } from './route'
import { createUser, findUserByEmail } from '@/prisma/models/user'

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when fields are missing', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }),
    })
    const res = await POST(req as any, { params: Promise.resolve({}) })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('missing_fields')
  })

  it('returns 400 for a role that cannot self-register', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass', name: 'X', role: 'ADMIN' }),
    })
    const res = await POST(req as any, { params: Promise.resolve({}) })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_role')
    expect(createUser).not.toHaveBeenCalled()
  })

  it('returns 409 when email is taken', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({ id: '1' } as any)
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass', name: 'X', role: 'USER' }),
    })
    const res = await POST(req as any, { params: Promise.resolve({}) })
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('email_taken')
  })

  it('creates user and returns 201', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null)
    vi.mocked(createUser).mockResolvedValue({
      id: 'cuid1', email: 'a@b.com', role: 'USER',
    } as any)
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass123', name: 'Ahmed', role: 'USER' }),
    })
    const res = await POST(req as any, { params: Promise.resolve({}) })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.role).toBe('USER')
  })
})
