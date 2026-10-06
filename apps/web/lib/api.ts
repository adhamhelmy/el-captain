import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, type Session } from 'next-auth'
import type { Role } from '@el-captain/types'
import { authOptions } from '@/lib/auth'

type Params = Record<string, string | string[]>

export type AuthUser = Session['user']

/** The URL's search params; missing values are undefined rather than null. */
export type Query = {
  get(key: string): string | undefined
  getAll(key: string): string[]
}

/** Which slice of a list to return, read from ?limit= and ?offset=. Matches the models' list options. */
export type Page = { take: number; skip: number }

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50

/** What a public handler is called with. */
export type RequestContext<P extends Params = Params> = {
  req: NextRequest
  params: P
  query: Query
  page: Page
}

/** What a protected handler is called with. */
export type AuthContext<P extends Params = Params> = RequestContext<P> & {
  user: AuthUser
}

/** Thrown inside a handler to answer with an error status. `code` lets the client tell errors apart. */
export class HttpError extends Error {
  constructor(readonly status: number, message: string, readonly code?: string) {
    super(message)
  }
}

/** 400 unless the request is valid. */
export function assertValid(condition: unknown, message: string, code?: string): asserts condition {
  if (!condition) throw new HttpError(400, message, code)
}

/** 403 unless the user may act on this, e.g. the record is theirs. */
export function assertAllowed(condition: boolean): asserts condition {
  if (!condition) throw new HttpError(403, 'Forbidden')
}

/** 404 unless the record exists. */
export function assertFound<T>(record: T | null | undefined, message = 'Not found'): asserts record is T {
  if (record == null) throw new HttpError(404, message)
}

/** 409 unless the request fits the current state, e.g. not booked twice. */
export function assertNoConflict(condition: unknown, message: string, code?: string): asserts condition {
  if (!condition) throw new HttpError(409, message, code)
}

function readQuery(req: NextRequest): Query {
  const { searchParams } = new URL(req.url)
  return {
    get: (key) => searchParams.get(key) ?? undefined,
    getAll: (key) => searchParams.getAll(key),
  }
}

/** The value as a whole number of at least min, or the fallback when it is missing or not a number. */
function toInt(value: string | undefined, fallback: number, min: number) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isNaN(n) ? fallback : Math.max(n, min)
}

function readPage(query: Query): Page {
  return {
    take: Math.min(toInt(query.get('limit'), DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE),
    skip: toInt(query.get('offset'), 0, 0),
  }
}

const error = (status: number, message: string, code?: string) =>
  NextResponse.json({ error: message, ...(code && { code }) }, { status })

/** Runs the handler for anyone, answering any HttpError it throws. */
export function publicRoute<P extends Params = Params>(handler: (ctx: RequestContext<P>) => Promise<Response>) {
  return async (req: NextRequest, { params }: { params: Promise<P> }) => {
    try {
      const query = readQuery(req)
      return await handler({ req, params: await params, query, page: readPage(query) })
    } catch (e) {
      if (e instanceof HttpError) return error(e.status, e.message, e.code)
      throw e
    }
  }
}

/**
 * Runs the handler only for a signed-in user (401) whose role is allowed (403),
 * answering any HttpError it throws.
 *
 * Always list the roles the route is for. Leave roles out only when every role may use the route;
 * ownership checks inside the handler do not replace the role list.
 */
export function protect<P extends Params = Params>(
  handler: (ctx: AuthContext<P>) => Promise<Response>,
  roles?: Role[],
) {
  return publicRoute<P>(async (ctx) => {
    const session = await getServerSession(authOptions)
    if (!session) throw new HttpError(401, 'Unauthorized')
    if (roles && !roles.includes(session.user.role)) throw new HttpError(403, 'Forbidden')

    return handler({ ...ctx, user: session.user })
  })
}
