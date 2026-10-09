import { vi } from 'vitest'
import { getServerSession } from 'next-auth'
import type { Role } from '@el-captain/types'

// Route tests mock these two modules, then use the helpers below:
//   vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
//   vi.mock('@/lib/server/auth', () => ({ authOptions: {} }))

type Handler = (req: any, ctx: { params: Promise<any> }) => Promise<Response>

/** Signs in a user with this id and role for the next requests, or signs out with null. */
export function signInAs(id: string | null, role: Role = 'USER') {
  vi.mocked(getServerSession).mockResolvedValue(id ? ({ user: { id, role } } as any) : null)
}

/** Calls a route handler the way Next does. */
export function call(handler: Handler, { params = {}, body, url = 'http://localhost/api' }: {
  params?: Record<string, string>
  body?: object
  url?: string
} = {}) {
  const init = body ? { method: 'POST', body: JSON.stringify(body) } : undefined
  return handler(new Request(url, init), { params: Promise.resolve(params) })
}
