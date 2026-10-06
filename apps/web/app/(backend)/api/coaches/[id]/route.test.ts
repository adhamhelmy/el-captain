import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/prisma/models/coach-profile', () => ({ findCoach: vi.fn(), updateCoach: vi.fn() }))

import { GET, PATCH } from './route'
import { findCoach, updateCoach } from '@/prisma/models/coach-profile'
import { call, signInAs } from '@/test/api'

const coach = { id: 'k1', name: 'Mona', coachProfile: { id: 'p1', userId: 'k1', bio: 'Boxing' } }
const params = { id: 'k1' }

beforeEach(() => vi.clearAllMocks())

describe('GET /api/coaches/[id]', () => {
  it('returns the coach profile with the user id as its id', async () => {
    vi.mocked(findCoach).mockResolvedValue(coach as any)
    const res = await call(GET, { params })
    expect(await res.json()).toEqual({ id: 'k1', userId: 'k1', coachName: 'Mona', bio: 'Boxing' })
  })

  it('returns 404 for an unknown coach', async () => {
    vi.mocked(findCoach).mockResolvedValue(null)
    expect((await call(GET, { params })).status).toBe(404)
  })
})

describe('PATCH /api/coaches/[id]', () => {
  it("returns 403 for another coach's profile", async () => {
    signInAs('k2', 'COACH')
    expect((await call(PATCH, { params, body: { bio: 'x' } })).status).toBe(403)
    expect(updateCoach).not.toHaveBeenCalled()
  })

  it("lets an admin update any coach's profile", async () => {
    signInAs('admin', 'ADMIN')
    vi.mocked(updateCoach).mockResolvedValue(coach as any)
    expect((await call(PATCH, { params, body: { bio: 'x' } })).status).toBe(200)
    expect(updateCoach).toHaveBeenCalledWith('k1', expect.objectContaining({ bio: 'x' }))
  })
})
