/**
 * Mock data ported from docs/designs/ec-data.js.
 * The UI is built against this until the API/schema matches the designs.
 * Categories and levels are keys and dates are ISO; components localize them (lib/session-text).
 */
import { APP_TZ } from '@/i18n/locale'

export type CoachStatus = 'active' | 'pending' | 'suspended' | 'rejected'
export type SessionType = 'group' | 'private'
export type SessionStatus = 'upcoming' | 'past' | 'cancelled'

export interface Coach {
  id: number
  /** Names read the same in both languages; `nameAr` is the Arabic spelling. */
  name: string
  nameAr: string
  initials: string
  specialty: Category
  location: string
  rating: number
  reviews: number
  rate: number
  status: CoachStatus
  joined: string
  email: string
  clients: number
  revenue: number
  bio: string
}

export interface Session {
  id: number
  title: string
  category: Category
  coachId: number
  type: SessionType
  level: Level
  duration: number
  price: number
  capacity: number
  booked: number
  start: string
  status: SessionStatus
  description: string
}

export interface User {
  id: number
  name: string
  initials: string
  email: string
  phone: string
  joined: string
  status: 'active' | 'suspended'
  lastActive: string
}

export interface Booking {
  id: number
  userId: number
  sessionId: number
  at?: string
}

export type Category = 'yoga' | 'circuit' | 'spin' | 'climbing' | 'strength'
export const CATEGORIES: readonly Category[] = ['yoga', 'circuit', 'spin', 'climbing', 'strength']
export type Level = 'allLevels' | 'beginner' | 'intermediate' | 'private'
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export const DAYS: readonly DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/** Fixed "now" for the mock, so relative times ("2 hours ago") are stable and hydrate cleanly. */
export const NOW = '2026-10-05T09:00:00-06:00'
const WEEK_START_DAY = 5 // Monday 2026-10-05, the mock's current week
const OFFSET = '-06:00' // Denver, daylight time in Sep–Oct

const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: APP_TZ })
export const weekdayKey = (iso: string) => weekdayFmt.format(new Date(iso)).toLowerCase() as DayKey

/** ISO start for a weekday + 'HH:mm' in the mock's current week. */
export const startFor = (day: DayKey, time: string) =>
  `2026-10-${String(WEEK_START_DAY + DAYS.indexOf(day)).padStart(2, '0')}T${time}:00${OFFSET}`

/** Signed-in mock identities, one per role. */
export const ME = { user: 1, coach: 1 }

export const coaches: Coach[] = [
  { id: 1, name: 'Mariam Adel', nameAr: 'مريم عادل', initials: 'MA', specialty: 'yoga', location: 'Denver, CO', rating: 4.9, reviews: 128, rate: 800, status: 'active', joined: '2026-01-15T12:00:00-07:00', email: 'mariam@elcaptain.app', clients: 64, revenue: 156000, bio: 'Flow and restorative yoga coach. Eight years teaching breath-led flows for every level, from first-timers to athletes in recovery.' },
  { id: 2, name: 'Karim Nabil', nameAr: 'كريم نبيل', initials: 'KN', specialty: 'circuit', location: 'Boulder, CO', rating: 4.7, reviews: 86, rate: 750, status: 'active', joined: '2026-02-15T12:00:00-07:00', email: 'karim@elcaptain.app', clients: 41, revenue: 104500, bio: 'Former collegiate sprinter running high-intensity circuits built on strength and conditioning fundamentals.' },
  { id: 3, name: 'Nour Hassan', nameAr: 'نور حسن', initials: 'NH', specialty: 'spin', location: 'Denver, CO', rating: 4.8, reviews: 203, rate: 650, status: 'active', joined: '2025-12-15T12:00:00-07:00', email: 'nour@elcaptain.app', clients: 97, revenue: 200500, bio: 'Climb-and-sprint rides set to loud playlists. Certified indoor cycling instructor since 2019.' },
  { id: 4, name: 'Omar Fathy', nameAr: 'عمر فتحي', initials: 'OF', specialty: 'climbing', location: 'Golden, CO', rating: 5.0, reviews: 14, rate: 900, status: 'pending', joined: '2026-09-15T12:00:00-06:00', email: 'omar@elcaptain.app', clients: 6, revenue: 15500, bio: 'Route-setter and climbing coach focused on footwork, route reading, and efficient movement on the wall.' },
  { id: 5, name: 'Salma Ashraf', nameAr: 'سلمى أشرف', initials: 'SA', specialty: 'strength', location: 'Aurora, CO', rating: 4.9, reviews: 41, rate: 700, status: 'pending', joined: '2026-09-15T12:00:00-06:00', email: 'salma@elcaptain.app', clients: 18, revenue: 35250, bio: 'Barbell and bodyweight coach helping beginners build real strength with good form.' },
]

type SessionRow = [number, string, Category, number, SessionType, Level, number, number, number, number, string, SessionStatus, string]
const toSession = ([id, title, category, coachId, type, level, duration, price, capacity, booked, start, status, description]: SessionRow): Session =>
  ({ id, title, category, coachId, type, level, duration, price, capacity, booked, start, status, description })

export const sessions: Session[] = ([
  [1, 'Sunrise Yoga Flow', 'yoga', 1, 'group', 'allLevels', 60, 350, 16, 12, '2026-10-05T06:30:00-06:00', 'upcoming', 'A steady, breath-led flow to open the morning. Sun salutations, standing balances, and a long savasana. Mats provided.'],
  [2, 'Summit Circuit', 'circuit', 2, 'group', 'intermediate', 45, 400, 12, 10, '2026-10-06T17:45:00-06:00', 'upcoming', 'Interval stations built around strength and conditioning. Coach-led pacing with modifications for every move.'],
  [3, 'Power Spin Ascent', 'spin', 3, 'group', 'allLevels', 50, 300, 20, 11, '2026-10-07T07:00:00-06:00', 'upcoming', 'Climb-and-sprint intervals set to a rising playlist. Bikes are fitted on arrival, so get there 10 minutes early.'],
  [4, 'Climbing Technique', 'climbing', 4, 'private', 'private', 60, 900, 1, 0, '2026-10-08T16:00:00-06:00', 'upcoming', 'Personal coaching on footwork, route reading, and efficient movement. Booking reserves the full hour with Omar.'],
  [5, 'Strength Foundations', 'strength', 5, 'group', 'beginner', 55, 300, 14, 8, '2026-10-08T18:00:00-06:00', 'upcoming', 'Barbell and bodyweight fundamentals for first-timers and returners. Small group size keeps the coaching hands-on.'],
  [6, 'Private Yoga Reset', 'yoga', 1, 'private', 'private', 60, 800, 1, 0, '2026-10-09T10:00:00-06:00', 'upcoming', 'A tailored one-on-one session. Pick the focus: mobility, deep stretch, or breathwork.'],
  [7, 'Evening Restore', 'yoga', 1, 'group', 'allLevels', 60, 300, 16, 5, '2026-10-09T19:15:00-06:00', 'upcoming', 'Slow, supported postures and long holds to close out the week.'],
  [8, 'Sunrise Yoga Flow', 'yoga', 1, 'group', 'allLevels', 60, 350, 16, 16, '2026-09-28T06:30:00-06:00', 'past', 'A steady, breath-led flow to open the morning.'],
  [9, 'Summit Circuit', 'circuit', 2, 'group', 'intermediate', 45, 400, 12, 12, '2026-09-29T17:45:00-06:00', 'past', 'Interval stations built around strength and conditioning.'],
  [10, 'Power Spin Ascent', 'spin', 3, 'group', 'allLevels', 50, 300, 20, 18, '2026-09-23T07:00:00-06:00', 'past', 'Climb-and-sprint intervals set to a rising playlist.'],
  [11, 'Climbing Technique', 'climbing', 4, 'private', 'private', 60, 900, 1, 1, '2026-09-18T16:00:00-06:00', 'past', 'Personal coaching on footwork and route reading.'],
  [12, 'Private Yoga Reset', 'yoga', 1, 'private', 'private', 60, 800, 1, 1, '2026-09-25T10:00:00-06:00', 'past', 'A tailored one-on-one session.'],
] as SessionRow[]).map(toSession)

export const users: User[] = [
  { id: 1, name: 'Jordan Lee', initials: 'JL', email: 'jordan@icloud.com', phone: '(303) 555-0142', joined: '2026-02-15T12:00:00-07:00', status: 'active', lastActive: '2026-10-05T07:00:00-06:00' },
  { id: 2, name: 'Priya Nair', initials: 'PN', email: 'priya@icloud.com', phone: '(303) 555-0187', joined: '2026-03-15T12:00:00-07:00', status: 'active', lastActive: '2026-10-04T18:00:00-06:00' },
  { id: 3, name: 'Sam Okafor', initials: 'SO', email: 'sam@icloud.com', phone: '(720) 555-0110', joined: '2026-01-15T12:00:00-07:00', status: 'active', lastActive: '2026-10-05T07:00:00-06:00' },
  { id: 4, name: 'Wren Castillo', initials: 'WC', email: 'wren@icloud.com', phone: '(720) 555-0199', joined: '2026-06-15T12:00:00-06:00', status: 'suspended', lastActive: '2026-08-30T12:00:00-06:00' },
  { id: 5, name: 'Ana Ruiz', initials: 'AR', email: 'ana@icloud.com', phone: '(303) 555-0123', joined: '2026-04-15T12:00:00-06:00', status: 'active', lastActive: '2026-10-03T12:00:00-06:00' },
  { id: 6, name: 'Kofi Mensah', initials: 'KM', email: 'kofi@icloud.com', phone: '(720) 555-0175', joined: '2026-07-15T12:00:00-06:00', status: 'active', lastActive: '2026-10-05T07:00:00-06:00' },
]

export const bookings: Booking[] = ([
  [1, 1, '2026-10-05T07:00:00-06:00'], [1, 2, '2026-10-04T09:00:00-06:00'], [1, 8], [1, 10], [1, 11], [2, 1, '2026-10-05T06:00:00-06:00'], [2, 8], [2, 12], [3, 8], [3, 9],
  [3, 7, '2026-10-05T04:00:00-06:00'], [5, 6, '2026-10-05T08:00:00-06:00'], [5, 12], [6, 3, '2026-10-05T08:40:00-06:00'], [6, 10], [4, 9],
] as [number, number, string?][]).map(([userId, sessionId, at], i) => ({ id: i + 1, userId, sessionId, at }))

export const coach = (id: number | string) => coaches.find(c => c.id === +id)
export const session = (id: number | string) => sessions.find(s => s.id === +id)
export const user = (id: number | string) => users.find(u => u.id === +id)

export const fill = (s: Session) => `${s.booked}/${s.capacity}`

export const sessionsOfCoach = (id: number) => sessions.filter(s => s.coachId === id)
export const sessionsOfUser = (id: number) => bookings.filter(b => b.userId === id).map(b => session(b.sessionId)!)
export const attendees = (sessionId: number) => bookings.filter(b => b.sessionId === sessionId).map(b => user(b.userId)!)
export const userSpent = (id: number) => sessionsOfUser(id).reduce((a, s) => a + s.price, 0)

export interface Client extends User {
  count: number
  last: string | null
  history: Session[]
}

/** Distinct users with bookings on this coach's sessions. */
export function clientsOfCoach(coachId: number): Client[] {
  const m = new Map<number, Client>()
  bookings.forEach(b => {
    const s = session(b.sessionId)!
    if (s.coachId !== coachId) return
    const e = m.get(b.userId) ?? { ...user(b.userId)!, count: 0, last: null, history: [] }
    e.count++
    e.history.push(s)
    if (s.status === 'past' && (!e.last || s.start > e.last)) e.last = s.start
    m.set(b.userId, e)
  })
  return [...m.values()]
}

/** Distinct coaches of the sessions this user booked. */
export function coachesOfUser(userId: number) {
  const m = new Map<number, Coach & { count: number }>()
  sessionsOfUser(userId).forEach(s => {
    const e = m.get(s.coachId) ?? { ...coach(s.coachId)!, count: 0 }
    e.count++
    m.set(s.coachId, e)
  })
  return [...m.values()]
}

