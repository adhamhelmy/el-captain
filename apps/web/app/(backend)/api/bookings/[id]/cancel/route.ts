import { NextResponse } from 'next/server'
import { assertAllowed, assertFound, assertNoConflict, protect, type AuthContext } from '@/lib/api'
import { cancelBooking, findBooking } from '@/prisma/models/booking'

async function cancel({ user, params: { id } }: AuthContext<{ id: string }>) {
  const booking = await findBooking(id)
  
  assertFound(booking)
  assertAllowed(booking.userId === user.id)
  assertNoConflict(booking.status !== 'CANCELLED', 'Already cancelled')

  await cancelBooking(id)
  return NextResponse.json({ success: true })
}

export const PATCH = protect(cancel, ['USER'])
