export type Role = 'ADMIN' | 'CLIENT' | 'USER'
export type BookingStatus = 'CONFIRMED' | 'CANCELLED'

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
  date: string            // ISO string
  durationMinutes: number
  city: string
  address: string
  capacity: number
  spotsLeft: number
  imageUrl: string | null
  clientId: string
  clientName: string
  studioName: string | null
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
