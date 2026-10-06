import type { Attendee, BookingWithClass } from '@/prisma/models/booking'
import type { ClassWithHost } from '@/prisma/models/class'
import type { Client } from '@/prisma/models/client-profile'
import type { Coach } from '@/prisma/models/coach-profile'
import type { SessionRequestWithPeople } from '@/prisma/models/session-request'

// API response shapes. Each mapper keeps the record's own columns and only flattens its relations;
// dates need no mapping because NextResponse.json writes them as ISO strings.
// Relations holding a user record are always destructured out, so their password hash never leaks.

export const toClassDTO = ({ client, ...cls }: ClassWithHost) => ({
  ...cls,
  clientName: client.name,
  studioName: client.clientProfile?.studioName ?? null,
  isCoach: !!client.coachProfile,
})

export const toBookingDTO = ({ class: cls, ...booking }: BookingWithClass) => ({
  ...booking,
  class: toClassDTO(cls),
})

export const toAttendeeDTO = ({ id, createdAt, user }: Attendee) => ({
  bookingId: id,
  userId: user.id,
  name: user.name,
  email: user.email,
  bookedAt: createdAt,
})

export const toSessionRequestDTO = ({ user, coach, ...request }: SessionRequestWithPeople) => ({
  ...request,
  userName: user.name,
  userEmail: user.email,
  coachName: coach.name,
})

export const toCoachDTO = ({ id, name, coachProfile }: Coach) => ({
  ...coachProfile,
  id,
  userId: id,
  coachName: name,
})

export const toClientDTO = ({ id, name, clientProfile }: Client) => ({
  ...clientProfile,
  id,
  userId: id,
  clientName: name,
})
