import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/prisma/models/booking', () => ({ findBooking: vi.fn(), cancelBooking: vi.fn() }))

import { PATCH } from './route'
import { cancelBooking, findBooking } from '@/prisma/models/booking'
import { call, signInAs } from '@/test/api'

const params = { id: 'b1' }

beforeEach(() => vi.clearAllMocks())

describe('PATCH /api/bookings/[id]/cancel', () => {
  it('returns 404 when the booking does not exist', async () => {
    signInAs('u1')
    vi.mocked(findBooking).mockResolvedValue(null)
    expect((await call(PATCH, { params })).status).toBe(404)
  })

  it("returns 403 for someone else's booking", async () => {
    signInAs('u1')
    vi.mocked(findBooking).mockResolvedValue({ id: 'b1', userId: 'u2', status: 'CONFIRMED' } as any)
    expect((await call(PATCH, { params })).status).toBe(403)
    expect(cancelBooking).not.toHaveBeenCalled()
  })

  it('returns 409 when already cancelled', async () => {
    signInAs('u1')
    vi.mocked(findBooking).mockResolvedValue({ id: 'b1', userId: 'u1', status: 'CANCELLED' } as any)
    expect((await call(PATCH, { params })).status).toBe(409)
  })

  it('cancels the user’s own booking', async () => {
    signInAs('u1')
    vi.mocked(findBooking).mockResolvedValue({ id: 'b1', userId: 'u1', status: 'CONFIRMED' } as any)
    expect((await call(PATCH, { params })).status).toBe(200)
    expect(cancelBooking).toHaveBeenCalledWith('b1')
  })
})
