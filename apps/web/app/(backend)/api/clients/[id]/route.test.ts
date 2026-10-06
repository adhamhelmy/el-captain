import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/prisma/models/client-profile', () => ({ findClient: vi.fn(), updateClient: vi.fn() }))

import { GET, PATCH } from './route'
import { findClient, updateClient } from '@/prisma/models/client-profile'
import { call, signInAs } from '@/test/api'

const studio = { id: 's1', name: 'Gym', clientProfile: { id: 'p1', userId: 's1', studioName: 'Gym', city: 'Cairo' } }
const params = { id: 's1' }

beforeEach(() => vi.clearAllMocks())

describe('GET /api/clients/[id]', () => {
  it('returns the studio profile with the user id as its id', async () => {
    vi.mocked(findClient).mockResolvedValue(studio as any)
    const res = await call(GET, { params })
    expect(await res.json()).toEqual({ id: 's1', userId: 's1', clientName: 'Gym', studioName: 'Gym', city: 'Cairo' })
  })

  it('returns 404 for an unknown studio', async () => {
    vi.mocked(findClient).mockResolvedValue(null)
    expect((await call(GET, { params })).status).toBe(404)
  })
})

describe('PATCH /api/clients/[id]', () => {
  it("returns 403 for another studio's profile", async () => {
    signInAs('s2', 'STUDIO')
    expect((await call(PATCH, { params, body: { city: 'Giza' } })).status).toBe(403)
    expect(updateClient).not.toHaveBeenCalled()
  })

  it('updates the studio’s own profile', async () => {
    signInAs('s1', 'STUDIO')
    vi.mocked(updateClient).mockResolvedValue(studio as any)
    expect((await call(PATCH, { params, body: { city: 'Giza' } })).status).toBe(200)
    expect(updateClient).toHaveBeenCalledWith('s1', expect.objectContaining({ city: 'Giza' }))
  })
})
