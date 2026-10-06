import type { Class, Prisma } from '@prisma/client'
import { prisma } from '../client'

/** The class with the studio or coach hosting it. */
export const withHost = {
  client: { include: { clientProfile: true, coachProfile: true } },
} satisfies Prisma.ClassInclude

export type ClassWithHost = Prisma.ClassGetPayload<{ include: typeof withHost }>

export type ClassFields = Pick<Class, 'title' | 'type' | 'date' | 'durationMinutes' | 'city' | 'address' | 'capacity'>
  & Partial<Pick<Class, 'description' | 'imageUrl'>>

export type ClassFilters = {
  /** Only classes on or after this date. */
  from?: Date
  types?: string[]
  city?: string
  clientId?: string
  /** Matches title, type or description. */
  search?: string
}

export type ListOptions = {
  take?: number
  skip?: number
  orderBy?: Prisma.ClassOrderByWithRelationInput
}

function whereFilters({ from, types, city, clientId, search }: ClassFilters): Prisma.ClassWhereInput {
  return {
    ...(from && { date: { gte: from } }),
    ...(types?.length && { type: { in: types.map((t) => t.toLowerCase()), mode: 'insensitive' } }),
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
    ...(clientId && { clientId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }
}

export function findClass(id: string) {
  return prisma.class.findUnique({ where: { id } })
}

export function findClassWithHost(id: string) {
  return prisma.class.findUnique({ where: { id }, include: withHost })
}

/** Classes matching the filters, soonest first unless orderBy says otherwise. */
export function listClasses(filters: ClassFilters = {}, { take, skip, orderBy = { date: 'asc' } }: ListOptions = {}) {
  return prisma.class.findMany({ where: whereFilters(filters), include: withHost, orderBy, take, skip })
}

/** Creates a class hosted by clientId, with every spot open. */
export function createClass(clientId: string, fields: ClassFields) {
  return prisma.class.create({
    data: { ...fields, clientId, spotsLeft: fields.capacity },
    include: withHost,
  })
}

/** Undefined fields are left as they are. Capacity is fixed once the class exists. */
export function updateClass(id: string, fields: Partial<Omit<ClassFields, 'capacity'>>) {
  return prisma.class.update({ where: { id }, data: fields, include: withHost })
}

export function deleteClass(id: string) {
  return prisma.class.delete({ where: { id } })
}
