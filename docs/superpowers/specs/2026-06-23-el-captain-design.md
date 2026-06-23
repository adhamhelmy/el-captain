# El Captain — Design Spec
**Date:** 2026-06-23
**Status:** Approved

---

## Overview

El Captain is a fitness class discovery and booking platform. Studio owners (clients) post classes; end users search and book them; admins manage the platform. This document covers the MVP/prototype scope.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Mantine v7 |
| Backend | Next.js API Routes (no separate server) |
| Database | Postgres (Neon free tier) via Prisma ORM |
| Auth | NextAuth.js (credentials provider, role-based sessions) |
| Monorepo | Turborepo |
| Deployment | Vercel (frontend + API routes) |
| Shared types | `packages/types` |

---

## Repository Structure

```
el-captain/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (public)/          # landing, class search, class detail
│       │   ├── auth/              # login, register
│       │   ├── dashboard/         # role-gated dashboard pages
│       │   └── api/               # Next.js API routes
│       ├── components/            # Mantine-based UI components
│       ├── lib/                   # prisma client, auth config, helpers
│       └── prisma/                # schema.prisma + migrations
├── packages/
│   └── types/                     # shared TypeScript types/DTOs
├── turbo.json
└── package.json
```

---

## Data Model

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String
  name          String
  role          Role           @default(USER)
  clientProfile ClientProfile?
  bookings      Booking[]
  classes       Class[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum Role {
  ADMIN
  CLIENT
  USER
}

model ClientProfile {
  id                 String  @id @default(cuid())
  studioName         String
  studioDescription  String?
  city               String
  logoUrl            String?
  userId             String  @unique
  user               User    @relation(fields: [userId], references: [id])
}

model Class {
  id              String    @id @default(cuid())
  title           String
  type            String    // plain string, not enum — flexible for MVP
  description     String?
  date            DateTime
  durationMinutes Int
  city            String
  address         String
  capacity        Int
  spotsLeft       Int
  imageUrl        String?
  clientId        String
  client          User      @relation(fields: [clientId], references: [id])
  bookings        Booking[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Booking {
  id        String        @id @default(cuid())
  status    BookingStatus @default(CONFIRMED)
  userId    String
  user      User          @relation(fields: [userId], references: [id])
  classId   String
  class     Class         @relation(fields: [classId], references: [id])
  createdAt DateTime      @default(now())

  @@unique([userId, classId]) // no duplicate bookings
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
}
```

**Key rules:**
- `Class.type` is a plain `String` — new class types require no migration
- Booking is atomic: `spotsLeft` decrement + `Booking` insert run in a Prisma transaction
- Cancellation increments `spotsLeft` and sets `status = CANCELLED`
- A user cannot book the same class twice (`@@unique` constraint)

---

## User Roles & Flows

### Guest (unauthenticated)
- Browse landing page, search and filter classes
- View class detail pages
- Clicking "Book" redirects to `/auth/login?redirect=/classes/[id]`

### User (authenticated, role = USER)
- All guest capabilities
- Book classes (if spots available)
- Cancel bookings
- View `/dashboard/bookings` — their booking history

### Client (authenticated, role = CLIENT)
- Register → prompted to complete ClientProfile (studio name, city)
- Create, edit, delete their own classes
- View `/dashboard/classes` — their classes with booking counts and spots left

### Admin (authenticated, role = ADMIN)
- View `/dashboard/admin` — platform overview
- List and suspend/approve any user
- Delete any class

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing + class search/filter |
| `/classes/[id]` | Public | Class detail + book button |
| `/auth/login` | Public | Login form |
| `/auth/register` | Public | Register form (role selection: USER or CLIENT) |
| `/dashboard` | Authenticated | Redirects based on role |
| `/dashboard/bookings` | USER | Booking list + cancel action |
| `/dashboard/classes` | CLIENT | Class management (CRUD) |
| `/dashboard/admin` | ADMIN | User list + class list |

---

## API Routes

```
POST   /api/auth/[...nextauth]       NextAuth handler

GET    /api/classes                  Public — search (query: type, date, city)
POST   /api/classes                  CLIENT — create class
GET    /api/classes/[id]             Public — class detail
PATCH  /api/classes/[id]             CLIENT (owner) — edit class
DELETE /api/classes/[id]             CLIENT (owner) or ADMIN — delete class

POST   /api/bookings                 USER — book a class (Prisma transaction)
GET    /api/bookings                 USER — list own bookings
PATCH  /api/bookings/[id]/cancel     USER — cancel booking (restore spot)

GET    /api/admin/users              ADMIN — list all users
PATCH  /api/admin/users/[id]         ADMIN — suspend or approve user
GET    /api/admin/classes            ADMIN — list all classes
```

All mutating routes validate the session role server-side before executing.

---

## Search & Filtering

Class search on `/` supports:
- **Type** — free text or dropdown of known types (kickboxing, yoga, pilates, etc.)
- **Date** — date picker, filters `Class.date >= selected date`
- **City** — text input, case-insensitive match on `Class.city`

Implemented as a single `GET /api/classes` with query params, server-side Prisma `where` clause.

---

## Auth

- NextAuth credentials provider — email + password, hashed with `bcrypt`
- Session includes `id`, `role`, `name`
- Middleware (`middleware.ts`) protects `/dashboard/*` routes — redirects unauthenticated users to `/auth/login`
- Role enforcement is also repeated server-side in each API route (defense in depth)

---

## MVP Scope (out of scope for now)

- Payments / Stripe
- Email notifications / confirmations
- Ratings and reviews
- Instructor profiles separate from client profiles
- Image uploads (use URLs for now)
- Real-time spot updates (polling or SSE can be added later)
- Social login (Google, etc.)
