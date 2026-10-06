import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/prisma/models/session-request', () => ({ findSessionRequest: vi.fn(), updateSessionRequestStatus: vi.fn() }))

import { PATCH } from './route'
import { findSessionRequest, updateSessionRequestStatus } from '@/prisma/models/session-request'
import { call, signInAs } from '@/test/api'

const params = { id: 'r1' }

beforeEach(() => vi.clearAllMocks())

describe('PATCH /api/sessions/[id]', () => {
  it('returns 400 for an invalid status', async () => {
    signInAs('k1', 'COACH')
    expect((await call(PATCH, { params, body: { status: 'PENDING' } })).status).toBe(400)
  })

  it('returns 404 for an unknown request', async () => {
    signInAs('k1', 'COACH')
    vi.mocked(findSessionRequest).mockResolvedValue(null)
    expect((await call(PATCH, { params, body: { status: 'ACCEPTED' } })).status).toBe(404)
  })

  it('returns 403 when the request was sent to another coach', async () => {
    signInAs('k2', 'COACH')
    vi.mocked(findSessionRequest).mockResolvedValue({ id: 'r1', coachId: 'k1' } as any)
    expect((await call(PATCH, { params, body: { status: 'ACCEPTED' } })).status).toBe(403)
    expect(updateSessionRequestStatus).not.toHaveBeenCalled()
  })

  it('lets the coach accept it', async () => {
    signInAs('k1', 'COACH')
    vi.mocked(findSessionRequest).mockResolvedValue({ id: 'r1', coachId: 'k1' } as any)
    vi.mocked(updateSessionRequestStatus).mockResolvedValue({
      id: 'r1', status: 'ACCEPTED', user: { name: 'Ali', email: 'a@x.com' }, coach: { name: 'Mona' },
    } as any)
    const res = await call(PATCH, { params, body: { status: 'ACCEPTED' } })
    expect(res.status).toBe(200)
    expect(updateSessionRequestStatus).toHaveBeenCalledWith('r1', 'ACCEPTED')
    expect(await res.json()).toMatchObject({ status: 'ACCEPTED', coachName: 'Mona' })
  })
})
