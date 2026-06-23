import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { class: { findMany: vi.fn(), create: vi.fn() } },
}))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { GET, POST } from './route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

const makeClass = () => ({
  id: 'c1', title: 'Yoga', type: 'yoga', description: null,
  date: new Date('2026-07-01T09:00:00Z'), durationMinutes: 60,
  city: 'Cairo', address: '10 St', capacity: 10, spotsLeft: 10,
  imageUrl: null, clientId: 'u1', createdAt: new Date(),
  client: { name: 'Studio', clientProfile: { studioName: 'My Studio' } },
})

describe('GET /api/classes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns classes as DTOs', async () => {
    vi.mocked(prisma.class.findMany).mockResolvedValue([makeClass()] as any)
    const req = new Request('http://localhost/api/classes')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].studioName).toBe('My Studio')
  })
})

describe('POST /api/classes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for non-CLIENT', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { role: 'USER', id: 'u1' } } as any)
    const req = new Request('http://localhost/api/classes', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('creates class for CLIENT', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { role: 'CLIENT', id: 'u1' } } as any)
    vi.mocked(prisma.class.create).mockResolvedValue(makeClass() as any)
    const req = new Request('http://localhost/api/classes', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Yoga', type: 'yoga', date: '2026-07-01T09:00:00Z',
        durationMinutes: 60, city: 'Cairo', address: '10 St', capacity: 10,
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
  })
})
