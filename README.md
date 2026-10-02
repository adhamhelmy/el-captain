# El Captain

Fitness class discovery and booking platform. Studios and private coaches post classes; users search, browse, and book.

---

## Roles

| Role | Description |
|------|-------------|
| `USER` | Searches and books classes, requests private sessions from coaches |
| `STUDIO` | Studio or gym owner — posts group classes, manages profile |
| `COACH` | Private coach — posts classes, receives and responds to session requests |
| `ADMIN` | Platform administrator — manages all users and classes |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5, React 19 |
| UI | Mantine v9 |
| Auth | NextAuth v4 (credentials provider, JWT) |
| ORM | Prisma v6 |
| Database | Supabase (PostgreSQL) |
| Monorepo | Turborepo + npm workspaces |
| Deployment | Vercel |

---

## Project Structure

```
el-captain/
├── apps/
│   └── web/                  # Next.js application
│       ├── app/
│       │   ├── (frontend)/   # UI pages
│       │   │   ├── page.tsx              # Homepage / class search
│       │   │   ├── classes/[id]/         # Class detail + booking
│       │   │   ├── clients/[id]/         # Studio public profile
│       │   │   ├── coaches/[id]/         # Coach public profile
│       │   │   ├── auth/                 # Login + register
│       │   │   └── dashboard/            # Role-specific dashboards
│       │   │       ├── admin/            # ADMIN overview
│       │   │       ├── bookings/         # USER bookings (upcoming/past)
│       │   │       ├── classes/          # STUDIO/COACH class management
│       │   │       ├── sessions/         # COACH session requests
│       │   │       └── profile/          # STUDIO/COACH profile edit
│       │   └── (backend)/
│       │       └── api/                  # API routes
│       ├── components/                   # Shared React components
│       ├── lib/                          # prisma.ts, auth.ts
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
└── packages/
    └── types/                # Shared TypeScript interfaces (ClassDTO, etc.)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (PostgreSQL)

### Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env` and fill in:

```env
# Supabase pooler URL (port 6543) — used at runtime
DATABASE_URL="postgresql://..."

# Supabase direct URL (port 5432) — used for migrations
DIRECT_URL="postgresql://..."

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="..."

# Local dev
NEXTAUTH_URL="http://localhost:3000"
```

### Install & Run

```bash
npm install
cd apps/web && npm run dev
```

### Database

```bash
# Apply migrations (uses DIRECT_URL)
cd apps/web && npx prisma migrate dev

# Seed with sample data
cd apps/web && npm run db:seed
```

---

## Deployment (Vercel)

1. Push repo to GitHub
2. Import in [vercel.com/new](https://vercel.com/new)
3. Set build command: `cd apps/web && npm run build:prod`
4. Set output directory: `apps/web/.next`
5. Add env vars: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

`build:prod` runs `prisma migrate deploy` (applies migrations) then `next build`.

---

## API Reference

See [docs/api.md](docs/api.md) for full endpoint documentation.

---

## Data Model

```
User ──< Booking >── Class
 │                    │
 ├── ClientProfile    └── (posted by STUDIO or COACH user)
 ├── CoachProfile
 └──< SessionRequest >── (to a COACH user)
```

- A `Class` is posted by a `User` with role `STUDIO` or `COACH`
- A `Booking` links a `USER` to a `Class` (unique per user/class)
- A `SessionRequest` links a `USER` to a `COACH` (message-based, not time-specific)
