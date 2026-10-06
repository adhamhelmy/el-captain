import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/prisma/models/user', () => ({ listUsers: vi.fn(), updateUserRole: vi.fn() }))

import { GET, PATCH } from './route'
import { listUsers, updateUserRole } from '@/prisma/models/user'
import { call, signInAs } from '@/test/api'

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/users', () => {
  it('returns 403 for a non-admin', async () => {
    signInAs('k1', 'COACH')
    expect((await call(GET)).status).toBe(403)
  })

  it('lists users for an admin', async () => {
    signInAs('admin', 'ADMIN')
    vi.mocked(listUsers).mockResolvedValue([{ id: 'u1', name: 'Ali' }] as any)
    expect(await (await call(GET)).json()).toEqual([{ id: 'u1', name: 'Ali' }])
  })
})

describe('PATCH /api/admin/users', () => {
  beforeEach(() => signInAs('admin', 'ADMIN'))

  it('returns 400 without userId or role', async () => {
    expect((await call(PATCH, { body: { userId: 'u1' } })).status).toBe(400)
  })

  it('returns 400 for a role that cannot be assigned', async () => {
    expect((await call(PATCH, { body: { userId: 'u1', role: 'COACH' } })).status).toBe(400)
    expect(updateUserRole).not.toHaveBeenCalled()
  })

  it('changes the role', async () => {
    expect((await call(PATCH, { body: { userId: 'u1', role: 'STUDIO' } })).status).toBe(200)
    expect(updateUserRole).toHaveBeenCalledWith('u1', 'STUDIO')
  })
})
