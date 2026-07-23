export type Role = 'ADMIN' | 'CLIENT' | 'COACH' | 'USER'
export type BookingStatus = 'CONFIRMED' | 'CANCELLED'
export type SessionRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export interface UserSession {
  id: string
  name: string
  email: string
  role: Role
}

export interface ClassDTO {
  id: string
  title: string
  type: string
  description: string | null
  date: string
  durationMinutes: number
  city: string
  address: string
  capacity: number
  spotsLeft: number
  imageUrl: string | null
  clientId: string
  clientName: string
  studioName: string | null
  isCoach: boolean
  createdAt: string
}

export interface BookingDTO {
  id: string
  status: BookingStatus
  classId: string
  class: ClassDTO
  createdAt: string
}

export interface SearchParams {
  q?: string
  types?: string[]
  date?: string
  city?: string
}

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

export interface CoachProfileDTO {
  id: string
  userId: string
  coachName: string
  bio: string | null
  specialties: string | null
  city: string | null
  photoUrl: string | null
  website: string | null
  instagram: string | null
  phone: string | null
}

export interface SessionRequestDTO {
  id: string
  message: string
  status: SessionRequestStatus
  userId: string
  userName: string
  userEmail: string
  coachId: string
  coachName: string
  createdAt: string
}
