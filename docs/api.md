# API Reference

Base URL: `/api`

All routes return JSON. Authenticated routes require a valid NextAuth session cookie.

---

## Auth

### `POST /api/auth/register`

Register a new user.

**Body**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "USER" | "CLIENT" | "COACH",
  "studioName": "string",   // required if role = CLIENT
  "city": "string"          // required if role = CLIENT
}
```

**Responses**
- `201` — `{ id, email, role }`
- `409` — Email already in use
- `400` — Missing required fields

---

### `POST /api/auth/[...nextauth]`

NextAuth handler — handles sign-in, sign-out, session. Used internally by `next-auth/react`.

---

## Classes

### `GET /api/classes`

List upcoming classes. All filters are optional.

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Keyword search (title, type, description) |
| `type` | string (repeatable) | Filter by class type (case-insensitive). Multiple allowed: `?type=yoga&type=pilates` |
| `city` | string | Filter by city (partial match) |
| `clientId` | string | Filter to a specific studio/coach (shows all their classes, no date filter) |
| `limit` | number | Max results (default 12, max 50) |
| `offset` | number | Pagination offset (default 0) |

**Response** — `ClassDTO[]`

---

### `POST /api/classes`

Create a class. Requires `CLIENT`, `COACH`, or `ADMIN` role.

**Body**
```json
{
  "title": "string",
  "type": "string",
  "description": "string?",
  "date": "ISO string",
  "durationMinutes": "number",
  "city": "string",
  "address": "string",
  "capacity": "number",
  "imageUrl": "string?"
}
```

**Response** — `ClassDTO` (201)

---

### `GET /api/classes/[id]`

Get a single class.

**Response** — `ClassDTO`

---

### `PATCH /api/classes/[id]`

Update a class. Must be the class owner or `ADMIN`.

**Body** — any subset of class fields (all optional)

**Response** — updated `ClassDTO`

---

### `DELETE /api/classes/[id]`

Delete a class. Must be the class owner or `ADMIN`.

**Response** — `{ success: true }`

---

### `GET /api/classes/[id]/attendees`

List confirmed attendees for a class. Must be the class owner or `ADMIN`.

**Response**
```json
[
  {
    "bookingId": "string",
    "userId": "string",
    "name": "string",
    "email": "string",
    "bookedAt": "ISO string"
  }
]
```

---

## Bookings

### `GET /api/bookings`

List the current user's bookings, ordered by class date ascending.

**Response** — `BookingDTO[]`

---

### `POST /api/bookings`

Book a class. Requires `USER` role.

**Body**
```json
{ "classId": "string" }
```

**Responses**
- `201` — `BookingDTO`
- `409` — Already have an active booking for this class
- `400` — Class is full

**Notes**
- If the user previously cancelled a booking for this class, it is re-confirmed instead of creating a new one.
- Spot decrement is atomic (transaction with optimistic locking via `updateMany` count check).

---

### `PATCH /api/bookings/[id]/cancel`

Cancel a booking. Must be the booking owner.

**Responses**
- `200` — `{ success: true }`
- `409` — Already cancelled

---

## Client Profiles

### `GET /api/clients/[id]`

Get a studio/client profile by user ID.

**Response** — `ClientProfileDTO`

---

### `PATCH /api/clients/[id]`

Update a client profile. Must be the profile owner or `ADMIN`.

**Body**
```json
{
  "name": "string?",
  "studioName": "string?",
  "studioDescription": "string?",
  "city": "string?",
  "logoUrl": "string?",
  "website": "string?",
  "instagram": "string?",
  "phone": "string?"
}
```

**Response** — updated `ClientProfileDTO`

---

## Coach Profiles

### `GET /api/coaches/[id]`

Get a coach profile by user ID.

**Response** — `CoachProfileDTO`

---

### `PATCH /api/coaches/[id]`

Update a coach profile. Must be the profile owner or `ADMIN`.

**Body**
```json
{
  "name": "string?",
  "bio": "string?",
  "specialties": "string?",
  "city": "string?",
  "photoUrl": "string?",
  "website": "string?",
  "instagram": "string?",
  "phone": "string?"
}
```

**Response** — updated `CoachProfileDTO`

---

## Session Requests

### `POST /api/sessions`

Send a private session request to a coach. Requires `USER` role.

**Body**
```json
{
  "coachId": "string",
  "message": "string"
}
```

**Response** — `SessionRequestDTO` (201)

---

### `GET /api/sessions`

List incoming session requests. Requires `COACH` or `ADMIN` role.
- `COACH` sees only their own requests.
- `ADMIN` sees all requests.

**Response** — `SessionRequestDTO[]`

---

### `PATCH /api/sessions/[id]`

Accept or decline a session request. Must be the coach the request was sent to, or `ADMIN`.

**Body**
```json
{ "status": "ACCEPTED" | "DECLINED" }
```

**Response** — updated `SessionRequestDTO`

---

## Admin

### `GET /api/admin/users`

List all users. Requires `ADMIN` role.

**Response** — `Array<{ id, name, email, role, createdAt }>`

---

### `PATCH /api/admin/users`

Change a user's role. Requires `ADMIN` role.

**Body**
```json
{ "userId": "string", "role": "USER" | "CLIENT" | "COACH" | "ADMIN" }
```

**Response** — `{ success: true }`

---

### `GET /api/admin/classes`

List all classes (no date filter). Requires `ADMIN` role.

**Response** — `ClassDTO[]`

---

## Data Transfer Objects

### `ClassDTO`
```ts
{
  id: string
  title: string
  type: string
  description: string | null
  date: string            // ISO 8601
  durationMinutes: number
  city: string
  address: string
  capacity: number
  spotsLeft: number
  imageUrl: string | null
  clientId: string        // ID of the posting user (CLIENT or COACH)
  clientName: string      // Name of the posting user
  studioName: string | null  // Set if posted by CLIENT, null for COACH
  isCoach: boolean        // True if posted by a COACH
  createdAt: string       // ISO 8601
}
```

### `BookingDTO`
```ts
{
  id: string
  status: 'CONFIRMED' | 'CANCELLED'
  classId: string
  class: ClassDTO
  createdAt: string
}
```

### `ClientProfileDTO`
```ts
{
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
```

### `CoachProfileDTO`
```ts
{
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
```

### `SessionRequestDTO`
```ts
{
  id: string
  message: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  userId: string
  userName: string
  userEmail: string
  coachId: string
  coachName: string
  createdAt: string
}
```
