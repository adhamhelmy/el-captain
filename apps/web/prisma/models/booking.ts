import type { Prisma } from '@prisma/client'
import { prisma } from '../client'
import { withHost } from './class'

const withClass = { class: { include: withHost } } satisfies Prisma.BookingInclude

export type BookingWithClass = Prisma.BookingGetPayload<{ include: typeof withClass }>

export function findBooking(id: string) {
  return prisma.booking.findUnique({ where: { id } })
}

/** The user's booking for the class in any status, or null if they never booked it. */
export function findUserBooking(userId: string, classId: string) {
  return prisma.booking.findUnique({ where: { userId_classId: { userId, classId } } })
}

/** The user's bookings with their classes, soonest class first. */
export function listUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: withClass,
    orderBy: { class: { date: 'asc' } },
  })
}

/** Confirmed bookings for the class with who booked them, earliest booking first. */
export function listClassAttendees(classId: string) {
  return prisma.booking.findMany({
    where: { classId, status: 'CONFIRMED' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Takes a spot in the class and confirms the user's booking, reusing a cancelled one.
 * Returns null when the class has no spots left.
 */
export function bookClass(userId: string, classId: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.class.updateMany({
      where: { id: classId, spotsLeft: { gt: 0 } },
      data: { spotsLeft: { decrement: 1 } },
    })
    if (count === 0) return null

    return tx.booking.upsert({
      where: { userId_classId: { userId, classId } },
      create: { userId, classId },
      update: { status: 'CONFIRMED' },
      include: withClass,
    })
  })
}

/** Cancels the booking and gives its spot back to the class. */
export function cancelBooking(id: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({ where: { id }, data: { status: 'CANCELLED' } })
    await tx.class.update({ where: { id: booking.classId }, data: { spotsLeft: { increment: 1 } } })
    return booking
  })
}

export type Attendee = Awaited<ReturnType<typeof listClassAttendees>>[number]
