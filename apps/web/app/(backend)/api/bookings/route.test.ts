import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    class: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { POST } from './route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

describe('POST /api/bookings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not logged in', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ classId: 'c1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 409 when no spots left', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER' } } as any)
    vi.mocked(prisma.class.findUnique).mockResolvedValue({ id: 'c1', spotsLeft: 0 } as any)
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ classId: 'c1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('No spots available')
  })

  it('creates booking via transaction when spots available', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER' } } as any)
    vi.mocked(prisma.class.findUnique).mockResolvedValue({ id: 'c1', spotsLeft: 5 } as any)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null)
    const mockBooking = {
      id: 'b1', status: 'CONFIRMED', classId: 'c1', createdAt: new Date(),
      class: {
        id: 'c1', title: 'Yoga', type: 'yoga', description: null,
        date: new Date(), durationMinutes: 60, city: 'Cairo', address: 'St',
        capacity: 10, spotsLeft: 4, imageUrl: null, clientId: 'u2', createdAt: new Date(),
        client: { name: 'Studio', clientProfile: { studioName: 'X' } },
      },
    }
    vi.mocked(prisma.$transaction).mockResolvedValue(mockBooking as any)
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ classId: 'c1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})
