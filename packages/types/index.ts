/** Platform user roles. */
export type Role = 'ADMIN' | 'CLIENT' | 'COACH' | 'USER'

/** Booking lifecycle status. */
export type BookingStatus = 'CONFIRMED' | 'CANCELLED'

/** Private session request lifecycle status. */
export type SessionRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

/** Minimal user data embedded in the NextAuth JWT session. */
export interface UserSession {
  id: string
  name: string
  email: string
  role: Role
}

/**
 * A fitness class as returned by the API.
 * Posted by a user with role CLIENT or COACH.
 */
export interface ClassDTO {
  id: string
  title: string
  /** Lowercase class type, e.g. "kickboxing", "yoga". */
  type: string
  description: string | null
  /** ISO 8601 date-time string. */
  date: string
  durationMinutes: number
  city: string
  address: string
  capacity: number
  spotsLeft: number
  imageUrl: string | null
  /** User ID of the posting CLIENT or COACH. */
  clientId: string
  /** Display name of the posting user. */
  clientName: string
  /** Studio name — set for CLIENT posts, null for COACH posts. */
  studioName: string | null
  /** True when the class was posted by a COACH (not a studio). */
  isCoach: boolean
  /** ISO 8601 date-time string. */
  createdAt: string
}

/** A user's booking for a class. */
export interface BookingDTO {
  id: string
  status: BookingStatus
  classId: string
  /** Full class details embedded in the booking. */
  class: ClassDTO
  /** ISO 8601 date-time string. */
  createdAt: string
}

/** Search/filter parameters for the class listing endpoint. */
export interface SearchParams {
  /** Keyword search against title, type, and description. */
  q?: string
  /** One or more class types (case-insensitive). */
  types?: string[]
  /** Filter to classes on or after this date (ISO string). */
  date?: string
  /** Filter by city (partial match). */
  city?: string
}

/** Public profile of a studio or gym owner (CLIENT role). */
export interface ClientProfileDTO {
  id: string
  userId: string
  clientName: string
  studioName: string | null
  bio: string | null
  location: string | null
  website: string | null
  instagram: string | null
  phone: string | null
}

/** Public profile of a private coach (COACH role). */
export interface CoachProfileDTO {
  id: string
  userId: string
  coachName: string
  bio: string | null
  /** Comma-separated or free-text list of coaching specialties. */
  specialties: string | null
  city: string | null
  photoUrl: string | null
  website: string | null
  instagram: string | null
  phone: string | null
}

/**
 * A USER's request for a private session with a COACH.
 * The coach accepts or declines; scheduling happens off-platform.
 */
export interface SessionRequestDTO {
  id: string
  /** The user's message describing what they're looking for. */
  message: string
  status: SessionRequestStatus
  userId: string
  userName: string
  userEmail: string
  coachId: string
  coachName: string
  /** ISO 8601 date-time string. */
  createdAt: string
}
