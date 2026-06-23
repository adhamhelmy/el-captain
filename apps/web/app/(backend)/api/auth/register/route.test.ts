import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { POST } from './route'
import { prisma } from '@/lib/prisma'

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when fields are missing', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 409 when email is taken', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as any)
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass', name: 'X', role: 'USER' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(409)
  })

  it('creates user and returns 201', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'cuid1', email: 'a@b.com', role: 'USER',
    } as any)
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass123', name: 'Ahmed', role: 'USER' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.role).toBe('USER')
  })
})
