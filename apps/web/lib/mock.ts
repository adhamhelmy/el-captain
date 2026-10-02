/**
 * Mock data ported from docs/designs/ec-data.js.
 * The UI is built against this until the API/schema matches the designs.
 */

export type CoachStatus = 'active' | 'pending' | 'suspended' | 'rejected'
export type SessionType = 'group' | 'private'
export type SessionStatus = 'upcoming' | 'past' | 'cancelled'

export interface Coach {
  id: number
  name: string
  initials: string
  specialty: string
  location: string
  rating: number
  reviews: number
  rate: number
  status: CoachStatus
  joined: string
  email: string
  clients: number
  revenue: string
  bio: string
}

export interface Session {
  id: number
  title: string
  category: string
  coachId: number
  type: SessionType
  level: string
  duration: number
  price: number
  capacity: number
  booked: number
  day: string
  date: string
  time: string
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
  ago?: string
}

export const categories = ['All', 'Yoga', 'HIIT', 'Spin', 'Climbing', 'Strength']
export const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Signed-in mock identities, one per role. */
export const ME = { user: 1, coach: 1 }

export const coaches: Coach[] = [
  { id: 1, name: 'Mara Ito', initials: 'MI', specialty: 'Yoga', location: 'Denver, CO', rating: 4.9, reviews: 128, rate: 75, status: 'active', joined: 'Jan 2026', email: 'mara@elcaptain.app', clients: 64, revenue: '6,240', bio: 'Vinyasa and restorative yoga coach. Eight years teaching breath-led flows for every level, from first-timers to athletes in recovery.' },
  { id: 2, name: 'Deacon Cole', initials: 'DC', specialty: 'HIIT', location: 'Boulder, CO', rating: 4.7, reviews: 86, rate: 70, status: 'active', joined: 'Feb 2026', email: 'deacon@elcaptain.app', clients: 41, revenue: '4,180', bio: 'Former collegiate sprinter running high-intensity circuits built on strength and conditioning fundamentals.' },
  { id: 3, name: 'Rae Solano', initials: 'RS', specialty: 'Spin', location: 'Denver, CO', rating: 4.8, reviews: 203, rate: 60, status: 'active', joined: 'Dec 2025', email: 'rae@elcaptain.app', clients: 97, revenue: '8,020', bio: 'Climb-and-sprint rides set to loud playlists. Certified indoor cycling instructor since 2019.' },
  { id: 4, name: 'Theo Vance', initials: 'TV', specialty: 'Climbing', location: 'Golden, CO', rating: 5.0, reviews: 14, rate: 85, status: 'pending', joined: 'Sep 2026', email: 'theo@elcaptain.app', clients: 6, revenue: '620', bio: 'Route-setter and climbing coach focused on footwork, route reading, and efficient movement on the wall.' },
  { id: 5, name: 'Nia Brooks', initials: 'NB', specialty: 'Strength', location: 'Aurora, CO', rating: 4.9, reviews: 41, rate: 65, status: 'pending', joined: 'Sep 2026', email: 'nia@elcaptain.app', clients: 18, revenue: '1,410', bio: 'Barbell and bodyweight coach helping beginners build real strength with good form.' },
]

type SessionRow = [number, string, string, number, SessionType, string, number, number, number, number, string, string, string, SessionStatus, string]
const toSession = ([id, title, category, coachId, type, level, duration, price, capacity, booked, day, date, time, status, description]: SessionRow): Session =>
  ({ id, title, category, coachId, type, level, duration, price, capacity, booked, day, date, time, status, description })

export const sessions: Session[] = ([
  [1, 'Sunrise Vinyasa Flow', 'Yoga', 1, 'group', 'All levels', 60, 28, 16, 12, 'Mon', 'Oct 5', '6:30 AM', 'upcoming', 'A steady, breath-led vinyasa to open the morning. Sun salutations, standing balances, and a long savasana. Mats provided.'],
  [2, 'Summit HIIT Circuit', 'HIIT', 2, 'group', 'Intermediate', 45, 32, 12, 10, 'Tue', 'Oct 6', '5:45 PM', 'upcoming', 'Interval stations built around strength and conditioning. Coach-led pacing with modifications for every move.'],
  [3, 'Power Spin Ascent', 'Spin', 3, 'group', 'All levels', 50, 26, 20, 11, 'Wed', 'Oct 7', '7:00 AM', 'upcoming', 'Climb-and-sprint intervals set to a rising playlist. Bikes are fitted on arrival, so get there 10 minutes early.'],
  [4, '1:1 Climbing Technique', 'Climbing', 4, 'private', 'Private', 60, 85, 1, 0, 'Thu', 'Oct 8', '4:00 PM', 'upcoming', 'Personal coaching on footwork, route reading, and efficient movement. Booking reserves the full hour with Theo.'],
  [5, 'Strength Foundations', 'Strength', 5, 'group', 'Beginner', 55, 24, 14, 8, 'Thu', 'Oct 8', '6:00 PM', 'upcoming', 'Barbell and bodyweight fundamentals for first-timers and returners. Small group size keeps the coaching hands-on.'],
  [6, 'Private Yoga Reset', 'Yoga', 1, 'private', 'Private', 60, 75, 1, 0, 'Fri', 'Oct 9', '10:00 AM', 'upcoming', 'A tailored one-on-one session. Pick the focus: mobility, deep stretch, or breathwork.'],
  [7, 'Evening Restore', 'Yoga', 1, 'group', 'All levels', 60, 26, 16, 5, 'Fri', 'Oct 9', '7:15 PM', 'upcoming', 'Slow, supported postures and long holds to close out the week.'],
  [8, 'Sunrise Vinyasa Flow', 'Yoga', 1, 'group', 'All levels', 60, 28, 16, 16, 'Mon', 'Sep 28', '6:30 AM', 'past', 'A steady, breath-led vinyasa to open the morning.'],
  [9, 'Summit HIIT Circuit', 'HIIT', 2, 'group', 'Intermediate', 45, 32, 12, 12, 'Tue', 'Sep 29', '5:45 PM', 'past', 'Interval stations built around strength and conditioning.'],
  [10, 'Power Spin Ascent', 'Spin', 3, 'group', 'All levels', 50, 26, 20, 18, 'Wed', 'Sep 23', '7:00 AM', 'past', 'Climb-and-sprint intervals set to a rising playlist.'],
  [11, '1:1 Climbing Technique', 'Climbing', 4, 'private', 'Private', 60, 85, 1, 1, 'Fri', 'Sep 18', '4:00 PM', 'past', 'Personal coaching on footwork and route reading.'],
  [12, 'Private Yoga Reset', 'Yoga', 1, 'private', 'Private', 60, 75, 1, 1, 'Fri', 'Sep 25', '10:00 AM', 'past', 'A tailored one-on-one session.'],
] as SessionRow[]).map(toSession)

export const users: User[] = [
  { id: 1, name: 'Jordan Lee', initials: 'JL', email: 'jordan@icloud.com', phone: '(303) 555-0142', joined: 'Feb 2026', status: 'active', lastActive: 'Today' },
  { id: 2, name: 'Priya Nair', initials: 'PN', email: 'priya@icloud.com', phone: '(303) 555-0187', joined: 'Mar 2026', status: 'active', lastActive: 'Yesterday' },
  { id: 3, name: 'Sam Okafor', initials: 'SO', email: 'sam@icloud.com', phone: '(720) 555-0110', joined: 'Jan 2026', status: 'active', lastActive: 'Today' },
  { id: 4, name: 'Wren Castillo', initials: 'WC', email: 'wren@icloud.com', phone: '(720) 555-0199', joined: 'Jun 2026', status: 'suspended', lastActive: 'Aug 30' },
  { id: 5, name: 'Ana Ruiz', initials: 'AR', email: 'ana@icloud.com', phone: '(303) 555-0123', joined: 'Apr 2026', status: 'active', lastActive: '2 days ago' },
  { id: 6, name: 'Kofi Mensah', initials: 'KM', email: 'kofi@icloud.com', phone: '(720) 555-0175', joined: 'Jul 2026', status: 'active', lastActive: 'Today' },
]

export const bookings: Booking[] = ([
  [1, 1, '2h ago'], [1, 2, 'Yesterday'], [1, 8], [1, 10], [1, 11], [2, 1, '3h ago'], [2, 8], [2, 12], [3, 8], [3, 9],
  [3, 7, '5h ago'], [5, 6, '1h ago'], [5, 12], [6, 3, '20m ago'], [6, 10], [4, 9],
] as [number, number, string?][]).map(([userId, sessionId, ago], i) => ({ id: i + 1, userId, sessionId, ago }))

export const coach = (id: number | string) => coaches.find(c => c.id === +id)
export const session = (id: number | string) => sessions.find(s => s.id === +id)
export const user = (id: number | string) => users.find(u => u.id === +id)

export const coachName = (s: Session) => coach(s.coachId)!.name
export const typeLabel = (s: Session) => (s.type === 'group' ? 'Group' : 'Private')
export const when = (s: Session) => `${s.day} · ${s.date} · ${s.time}`
export const fill = (s: Session) => `${s.booked}/${s.capacity}`
export const spotsLabel = (s: Session) => {
  if (s.type === 'private') return '1:1 session'
  return s.status === 'past' ? `${s.booked} attended` : `${s.capacity - s.booked} spots left`
}

export const sessionsOfCoach = (id: number) => sessions.filter(s => s.coachId === id)
export const sessionsOfUser = (id: number) => bookings.filter(b => b.userId === id).map(b => session(b.sessionId)!)
export const attendees = (sessionId: number) => bookings.filter(b => b.sessionId === sessionId).map(b => user(b.userId)!)
export const userSpent = (id: number) => sessionsOfUser(id).reduce((a, s) => a + s.price, 0)

export interface Client extends User {
  count: number
  last: string
  history: Session[]
}

/** Distinct users with bookings on this coach's sessions. */
export function clientsOfCoach(coachId: number): Client[] {
  const m = new Map<number, Client>()
  bookings.forEach(b => {
    const s = session(b.sessionId)!
    if (s.coachId !== coachId) return
    const e = m.get(b.userId) ?? { ...user(b.userId)!, count: 0, last: '—', history: [] }
    e.count++
    e.history.push(s)
    if (s.status === 'past') e.last = s.date
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

export const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
