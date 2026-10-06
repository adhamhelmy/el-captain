import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/prisma/models/class', () => ({ findClass: vi.fn() }))
vi.mock('@/prisma/models/booking', () => ({
  bookClass: vi.fn(),
  findUserBooking: vi.fn(),
  listUserBookings: vi.fn(),
}))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { GET, POST } from './route'
import { findClass } from '@/prisma/models/class'
import { bookClass, findUserBooking, listUserBookings } from '@/prisma/models/booking'
import { getServerSession } from 'next-auth'

const post = (body: object) =>
  POST(
    new Request('http://localhost/api/bookings', { method: 'POST', body: JSON.stringify(body) }) as any,
    { params: Promise.resolve({}) },
  )

const get = () => GET(new Request('http://localhost/api/bookings') as any, { params: Promise.resolve({}) })

describe('GET /api/bookings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for a role other than USER', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'c1', role: 'COACH' } } as any)
    const res = await get()
    expect(res.status).toBe(403)
    expect(listUserBookings).not.toHaveBeenCalled()
  })

  it("lists only the signed-in user's bookings", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER' } } as any)
    vi.mocked(listUserBookings).mockResolvedValue([])
    const res = await get()
    expect(res.status).toBe(200)
    expect(listUserBookings).toHaveBeenCalledWith('u1')
  })
})

describe('POST /api/bookings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not logged in', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await post({ classId: 'c1' })
    expect(res.status).toBe(401)
  })

  it('returns 403 when a non-USER tries to book', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'c1', role: 'COACH' } } as any)
    const res = await post({ classId: 'c1' })
    expect(res.status).toBe(403)
    expect(bookClass).not.toHaveBeenCalled()
  })

  it('returns 409 when the user already has a confirmed booking', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER' } } as any)
    vi.mocked(findClass).mockResolvedValue({ id: 'c1', spotsLeft: 5 } as any)
    vi.mocked(findUserBooking).mockResolvedValue({ id: 'b1', status: 'CONFIRMED' } as any)
    const res = await post({ classId: 'c1' })
    expect(res.status).toBe(409)
    expect(bookClass).not.toHaveBeenCalled()
  })

  it('returns 409 when no spots left', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER' } } as any)
    vi.mocked(findClass).mockResolvedValue({ id: 'c1', spotsLeft: 0 } as any)
    vi.mocked(findUserBooking).mockResolvedValue(null)
    vi.mocked(bookClass).mockResolvedValue(null)
    const res = await post({ classId: 'c1' })
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('No spots available')
  })

  it('books the class when spots are available', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER' } } as any)
    vi.mocked(findClass).mockResolvedValue({ id: 'c1', spotsLeft: 5 } as any)
    vi.mocked(findUserBooking).mockResolvedValue(null)
    const mockBooking = {
      id: 'b1', status: 'CONFIRMED', classId: 'c1', createdAt: new Date(),
      class: {
        id: 'c1', title: 'Yoga', type: 'yoga', description: null,
        date: new Date(), durationMinutes: 60, city: 'Cairo', address: 'St',
        capacity: 10, spotsLeft: 4, imageUrl: null, clientId: 'u2', createdAt: new Date(),
        client: { name: 'Studio', clientProfile: { studioName: 'X' } },
      },
    }
    vi.mocked(bookClass).mockResolvedValue(mockBooking as any)
    const res = await post({ classId: 'c1' })
    expect(res.status).toBe(201)
    expect(bookClass).toHaveBeenCalledWith('u1', 'c1')
  })
})
