import type { Prisma, SessionRequestStatus } from '@prisma/client'
import { prisma } from '../client'

const withPeople = { user: true, coach: true } satisfies Prisma.SessionRequestInclude

export type SessionRequestWithPeople = Prisma.SessionRequestGetPayload<{ include: typeof withPeople }>

export type SessionRequestFilters = { coachId?: string }

export function findSessionRequest(id: string) {
  return prisma.sessionRequest.findUnique({ where: { id } })
}

/** Requests matching the filters, newest first. */
export function listSessionRequests({ coachId }: SessionRequestFilters = {}) {
  return prisma.sessionRequest.findMany({
    where: { ...(coachId && { coachId }) },
    include: withPeople,
    orderBy: { createdAt: 'desc' },
  })
}

export function createSessionRequest(data: { userId: string; coachId: string; message: string }) {
  return prisma.sessionRequest.create({ data, include: withPeople })
}

export function updateSessionRequestStatus(id: string, status: SessionRequestStatus) {
  return prisma.sessionRequest.update({ where: { id }, data: { status }, include: withPeople })
}
