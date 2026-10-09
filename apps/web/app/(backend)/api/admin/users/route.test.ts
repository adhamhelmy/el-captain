import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }))
vi.mock('@/prisma/models/user', () => ({ updateUserRole: vi.fn() }))
vi.mock('@/prisma/models/member', () => ({ listMembersForAdmin: vi.fn() }))

import { GET, PATCH } from './route'
import { listMembersForAdmin } from '@/prisma/models/member'
import { updateUserRole } from '@/prisma/models/user'
import { call, signInAs } from '@/test/api'

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/users', () => {
  it('returns 403 for a non-admin', async () => {
    signInAs('k1', 'COACH')
    expect((await call(GET)).status).toBe(403)
  })

  it('lists members for an admin, with a trimmed search and no password hash', async () => {
    signInAs('admin', 'ADMIN')
    const member = { id: 'u1', name: 'Ali', email: 'a@b.com', phone: null, passwordHash: 'x', suspendedAt: null, favouriteSports: [] }
    vi.mocked(listMembersForAdmin).mockResolvedValue([member] as any)
    const json = await (await call(GET, { url: 'http://localhost/api/admin/users?q=%20ali%20' })).json()
    expect(json).toEqual([expect.objectContaining({ id: 'u1', name: 'Ali', suspendedAt: null })])
    expect(json[0]).not.toHaveProperty('passwordHash')
    expect(listMembersForAdmin).toHaveBeenCalledWith('ali', expect.anything())
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
