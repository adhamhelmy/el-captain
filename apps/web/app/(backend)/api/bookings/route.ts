import { NextResponse } from 'next/server'
import { assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/api'
import { findClass } from '@/prisma/models/class'
import { toBookingDTO } from '@/lib/dto'
import { bookClass, findUserBooking, listUserBookings } from '@/prisma/models/booking'

async function listMyBookings({ user }: AuthContext) {
  const bookings = await listUserBookings(user.id)
  return NextResponse.json(bookings.map(toBookingDTO))
}

async function book({ req, user }: AuthContext) {
  const { classId } = await req.json()

  assertValid(classId, 'classId required')
  assertFound(await findClass(classId), 'Class not found')

  const existing = await findUserBooking(user.id, classId)
  assertNoConflict(existing?.status !== 'CONFIRMED', 'You already have an active booking for this class')

  const booking = await bookClass(user.id, classId)
  assertNoConflict(booking, 'No spots available')
  
  return NextResponse.json(toBookingDTO(booking), { status: 201 })
}

export const GET = protect(listMyBookings, ['USER'])
export const POST = protect(book, ['USER'])
