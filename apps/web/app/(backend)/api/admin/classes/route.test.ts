import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/prisma/models/class', () => ({ listClasses: vi.fn() }))

import { GET } from './route'
import { listClasses } from '@/prisma/models/class'
import { call, signInAs } from '@/test/api'

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/classes', () => {
  it('returns 403 for a non-admin', async () => {
    signInAs('s1', 'STUDIO')
    expect((await call(GET)).status).toBe(403)
  })

  it('lists every class, newest first', async () => {
    signInAs('admin', 'ADMIN')
    vi.mocked(listClasses).mockResolvedValue([])
    expect((await call(GET)).status).toBe(200)
    expect(listClasses).toHaveBeenCalledWith({}, { orderBy: { createdAt: 'desc' } })
  })
})
