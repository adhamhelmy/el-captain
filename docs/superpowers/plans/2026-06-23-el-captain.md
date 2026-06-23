# El Captain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fitness class discovery and booking platform with three roles (admin, client, user) as a Next.js monorepo prototype.

**Architecture:** Turborepo monorepo with a single Next.js 14 App Router app (`apps/web`) using `(frontend)` and `(backend)` route groups. All API logic lives in Next.js API routes with Prisma + Postgres (Neon). NextAuth handles auth with a credentials provider and role-based sessions.

**Tech Stack:** TypeScript, Next.js 14 (App Router), Mantine v7, NextAuth.js, Prisma, Postgres (Neon), Turborepo, Vitest, Vercel

## Global Constraints

- TypeScript strict mode everywhere
- All API routes validate session role server-side before executing
- `Class.type` is a plain `String` — never use an enum for it
- Booking creation uses a Prisma transaction (decrement `spotsLeft` + insert `Booking` atomically)
- Guest users (no session) can browse all public routes; `/dashboard/*` is protected
- Mantine v7 for all UI components — no custom CSS unless Mantine can't do it
- Node.js 20+, Next.js 14+, Prisma 5+

---

## File Map

```
el-captain/
├── package.json                                      # root workspace
├── turbo.json
├── packages/
│   └── types/
│       ├── package.json
│       └── index.ts                                  # shared DTOs + Role type
├── apps/
│   └── web/
│       ├── package.json
│       ├── next.config.ts
│       ├── middleware.ts                              # protect /dashboard/*
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── app/
│           ├── layout.tsx                            # root layout + MantineProvider
│           ├── (frontend)/
│           │   ├── page.tsx                          # landing + class search
│           │   ├── classes/[id]/page.tsx             # class detail
│           │   ├── auth/
│           │   │   ├── login/page.tsx
│           │   │   └── register/page.tsx
│           │   └── dashboard/
│           │       ├── layout.tsx                    # role-based redirect
│           │       ├── bookings/page.tsx             # USER
│           │       ├── classes/page.tsx              # CLIENT
│           │       └── admin/page.tsx                # ADMIN
│           ├── (backend)/
│           │   └── api/
│           │       ├── auth/[...nextauth]/route.ts
│           │       ├── classes/
│           │       │   ├── route.ts                  # GET (search), POST
│           │       │   └── [id]/route.ts             # GET, PATCH, DELETE
│           │       ├── bookings/
│           │       │   ├── route.ts                  # GET, POST
│           │       │   └── [id]/cancel/route.ts      # PATCH
│           │       └── admin/
│           │           ├── users/route.ts            # GET, PATCH /[id]
│           │           └── classes/route.ts          # GET
│           └── components/
│               ├── NavBar.tsx
│               ├── ClassCard.tsx
│               ├── ClassSearch.tsx
│               └── BookingCard.tsx
│       └── lib/
│           ├── prisma.ts                             # singleton PrismaClient
│           └── auth.ts                              # NextAuth config
```

---

## Task 1: Monorepo Scaffold + Shared Types

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `packages/types/package.json`
- Create: `packages/types/index.ts`
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/app/layout.tsx`

**Interfaces:**
- Produces:
  ```typescript
  // packages/types/index.ts
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
    type?: string
    date?: string
    city?: string
  }
  ```

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "el-captain",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": [".next/**"] },
    "lint": {}
  }
}
```

- [ ] **Step 3: Create packages/types/package.json**

```json
{
  "name": "@el-captain/types",
  "version": "0.0.1",
  "main": "./index.ts",
  "types": "./index.ts"
}
```

- [ ] **Step 4: Create packages/types/index.ts** with the types shown in the Interfaces section above.

- [ ] **Step 5: Scaffold the Next.js app**

Run from the repo root:
```bash
cd apps
npx create-next-app@latest web --typescript --eslint --app --no-tailwind --no-src-dir --import-alias "@/*"
cd web
npm install @mantine/core @mantine/hooks @mantine/form @mantine/notifications @emotion/react @emotion/server
```

- [ ] **Step 6: Create apps/web/next.config.ts**

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@el-captain/types'],
}

export default config
```

- [ ] **Step 7: Update apps/web/package.json to add the types package**

Add to `dependencies`:
```json
"@el-captain/types": "*"
```

- [ ] **Step 8: Create apps/web/app/layout.tsx**

```typescript
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

export const metadata = { title: 'El Captain', description: 'Find and book fitness classes' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 9: Verify the app starts**

```bash
cd apps/web && npm run dev
```
Expected: Next.js dev server running at http://localhost:3000 with no errors.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: monorepo scaffold with Next.js, Mantine, and shared types"
```

---

## Task 2: Prisma Schema + Database Setup

**Files:**
- Create: `apps/web/prisma/schema.prisma`
- Create: `apps/web/prisma/seed.ts`
- Create: `apps/web/lib/prisma.ts`
- Create: `apps/web/.env` (gitignored)
- Create: `apps/web/.env.example`

**Interfaces:**
- Produces: Prisma client singleton exported from `apps/web/lib/prisma.ts` as `prisma`

- [ ] **Step 1: Install Prisma**

```bash
cd apps/web
npm install prisma @prisma/client bcryptjs
npm install -D @types/bcryptjs vitest @vitejs/plugin-react
npx prisma init
```

- [ ] **Step 2: Create apps/web/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  id                String  @id @default(cuid())
  studioName        String
  studioDescription String?
  city              String
  logoUrl           String?
  userId            String  @unique
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Class {
  id              String    @id @default(cuid())
  title           String
  type            String
  description     String?
  date            DateTime
  durationMinutes Int
  city            String
  address         String
  capacity        Int
  spotsLeft       Int
  imageUrl        String?
  clientId        String
  client          User      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  bookings        Booking[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Booking {
  id        String        @id @default(cuid())
  status    BookingStatus @default(CONFIRMED)
  userId    String
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  classId   String
  class     Class         @relation(fields: [classId], references: [id], onDelete: Cascade)
  createdAt DateTime      @default(now())

  @@unique([userId, classId])
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
}
```

- [ ] **Step 3: Add DATABASE_URL to .env**

Create `apps/web/.env`:
```
DATABASE_URL="postgresql://..."   # paste your Neon connection string here
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

Create `apps/web/.env.example` with same keys but empty values. Add `.env` to `.gitignore`.

- [ ] **Step 4: Run migration**

```bash
cd apps/web
npx prisma migrate dev --name init
```
Expected: Migration applied, Prisma client generated.

- [ ] **Step 5: Create apps/web/lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 6: Create apps/web/prisma/seed.ts**

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@elcaptain.com' },
    update: {},
    create: {
      email: 'admin@elcaptain.com',
      passwordHash: await hash('admin123'),
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  const client = await prisma.user.upsert({
    where: { email: 'studio@elcaptain.com' },
    update: {},
    create: {
      email: 'studio@elcaptain.com',
      passwordHash: await hash('studio123'),
      name: 'Cairo Fitness',
      role: 'CLIENT',
      clientProfile: {
        create: {
          studioName: 'Cairo Fitness',
          studioDescription: 'Premium fitness studio in Cairo',
          city: 'Cairo',
        },
      },
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@elcaptain.com' },
    update: {},
    create: {
      email: 'user@elcaptain.com',
      passwordHash: await hash('user123'),
      name: 'Ahmed Ali',
      role: 'USER',
    },
  })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  const classes = [
    { title: 'Morning Kickboxing', type: 'kickboxing', city: 'Cairo', address: '10 Tahrir Square', capacity: 15 },
    { title: 'Power Yoga', type: 'yoga', city: 'Cairo', address: '10 Tahrir Square', capacity: 10 },
    { title: 'Pilates Basics', type: 'pilates', city: 'Alexandria', address: '5 Corniche St', capacity: 12 },
  ]

  for (const c of classes) {
    await prisma.class.create({
      data: {
        ...c,
        description: `A great ${c.type} class for all levels.`,
        date: tomorrow,
        durationMinutes: 60,
        spotsLeft: c.capacity,
        clientId: client.id,
      },
    })
  }

  console.log('Seed complete. Users:', admin.email, client.email, user.email)
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Step 7: Add seed script to apps/web/package.json**

Add to `scripts`:
```json
"db:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
```

Install ts-node:
```bash
npm install -D ts-node
```

- [ ] **Step 8: Run seed**

```bash
cd apps/web && npm run db:seed
```
Expected: "Seed complete. Users: admin@elcaptain.com studio@elcaptain.com user@elcaptain.com"

- [ ] **Step 9: Write unit test for prisma singleton**

Create `apps/web/lib/prisma.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { prisma } from './prisma'

describe('prisma singleton', () => {
  it('exports a PrismaClient instance', () => {
    expect(prisma).toBeDefined()
    expect(typeof prisma.user.findMany).toBe('function')
  })
})
```

- [ ] **Step 10: Run test**

```bash
cd apps/web && npx vitest run lib/prisma.test.ts
```
Expected: 1 test passed.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: prisma schema, migrations, seed data"
```

---

## Task 3: NextAuth Configuration + Middleware

**Files:**
- Create: `apps/web/lib/auth.ts`
- Create: `apps/web/app/(backend)/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/middleware.ts`

**Interfaces:**
- Consumes: `prisma` from `apps/web/lib/prisma.ts`; `Role` from `@el-captain/types`
- Produces:
  - `authOptions` exported from `apps/web/lib/auth.ts` — NextAuth config
  - Session type augmented so `session.user` has `id: string` and `role: Role`

- [ ] **Step 1: Install NextAuth**

```bash
cd apps/web
npm install next-auth bcryptjs
```

- [ ] **Step 2: Create apps/web/lib/auth.ts**

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { Role } from '@el-captain/types'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role as Role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
}
```

- [ ] **Step 3: Augment NextAuth session types**

Create `apps/web/types/next-auth.d.ts`:
```typescript
import type { Role } from '@el-captain/types'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Role
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}
```

- [ ] **Step 4: Create the NextAuth API route**

Create `apps/web/app/(backend)/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 5: Create apps/web/middleware.ts**

```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role
    const path = req.nextUrl.pathname

    if (path.startsWith('/dashboard/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    if (path.startsWith('/dashboard/classes') && role !== 'CLIENT' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    if (path.startsWith('/dashboard/bookings') && role !== 'USER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  },
  { pages: { signIn: '/auth/login' } }
)

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

- [ ] **Step 6: Write auth helper test**

Create `apps/web/lib/auth.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { authOptions } from './auth'

describe('authOptions', () => {
  it('uses jwt session strategy', () => {
    expect(authOptions.session?.strategy).toBe('jwt')
  })

  it('has credentials provider', () => {
    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0].id).toBe('credentials')
  })

  it('redirects sign-in to /auth/login', () => {
    expect(authOptions.pages?.signIn).toBe('/auth/login')
  })
})
```

- [ ] **Step 7: Run test**

```bash
cd apps/web && npx vitest run lib/auth.test.ts
```
Expected: 3 tests passed.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: NextAuth credentials provider, JWT session, dashboard middleware"
```

---

## Task 4: Auth UI Pages (Login + Register)

**Files:**
- Create: `apps/web/app/(frontend)/auth/login/page.tsx`
- Create: `apps/web/app/(frontend)/auth/register/page.tsx`
- Create: `apps/web/app/(backend)/api/auth/register/route.ts`
- Create: `apps/web/components/NavBar.tsx`

**Interfaces:**
- Consumes: `authOptions` from `lib/auth.ts`; `prisma` from `lib/prisma.ts`; `Role` from `@el-captain/types`
- Produces: `/auth/login` and `/auth/register` pages; `POST /api/auth/register` endpoint

- [ ] **Step 1: Create the register API route**

Create `apps/web/app/(backend)/api/auth/register/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Role } from '@el-captain/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, name, role, studioName, city } = body

  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: role as Role,
      ...(role === 'CLIENT' && studioName && city
        ? { clientProfile: { create: { studioName, city } } }
        : {}),
    },
  })

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 })
}
```

- [ ] **Step 2: Write register API test**

Create `apps/web/app/(backend)/api/auth/register/route.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { POST } from './route'
import { prisma } from '@/lib/prisma'

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when fields are missing', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 409 when email is taken', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as any)
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass', name: 'X', role: 'USER' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(409)
  })

  it('creates user and returns 201', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'cuid1', email: 'a@b.com', role: 'USER',
    } as any)
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass123', name: 'Ahmed', role: 'USER' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.role).toBe('USER')
  })
})
```

- [ ] **Step 3: Run test**

```bash
cd apps/web && npx vitest run app/\(backend\)/api/auth/register/route.test.ts
```
Expected: 3 tests passed.

- [ ] **Step 4: Create NavBar component**

Create `apps/web/components/NavBar.tsx`:
```typescript
'use client'
import { Group, Button, Text, Container } from '@mantine/core'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export function NavBar() {
  const { data: session } = useSession()

  return (
    <Container size="lg" py="sm">
      <Group justify="space-between">
        <Text fw={700} size="xl" component={Link} href="/" style={{ textDecoration: 'none' }}>
          El Captain
        </Text>
        <Group>
          {session ? (
            <>
              <Button variant="subtle" component={Link} href="/dashboard">Dashboard</Button>
              <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</Button>
            </>
          ) : (
            <>
              <Button variant="subtle" component={Link} href="/auth/login">Login</Button>
              <Button component={Link} href="/auth/register">Sign up</Button>
            </>
          )}
        </Group>
      </Group>
    </Container>
  )
}
```

- [ ] **Step 5: Create the SessionProvider wrapper**

Create `apps/web/components/SessionProvider.tsx`:
```typescript
'use client'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
```

Update `apps/web/app/layout.tsx` to wrap children with `SessionProvider` and include `NavBar`:
```typescript
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { SessionProvider } from '@/components/SessionProvider'
import { NavBar } from '@/components/NavBar'

export const metadata = { title: 'El Captain', description: 'Find and book fitness classes' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <Notifications />
          <SessionProvider>
            <NavBar />
            {children}
          </SessionProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Create login page**

Create `apps/web/app/(frontend)/auth/login/page.tsx`:
```typescript
'use client'
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Stack, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length >= 6 ? null : 'Min 6 characters'),
    },
  })

  async function handleSubmit(values: typeof form.values) {
    const result = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
    })

    if (result?.error) {
      notifications.show({ color: 'red', title: 'Error', message: 'Invalid email or password' })
      return
    }
    router.push(redirect)
  }

  return (
    <Container size={420} mt={80}>
      <Title ta="center">Welcome back</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Don&apos;t have an account?{' '}
        <Anchor component={Link} href="/auth/register">Sign up</Anchor>
      </Text>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Email" placeholder="you@example.com" {...form.getInputProps('email')} />
            <PasswordInput label="Password" placeholder="Your password" {...form.getInputProps('password')} />
            <Button type="submit" fullWidth mt="xl">Sign in</Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
```

- [ ] **Step 7: Create register page**

Create `apps/web/app/(frontend)/auth/register/page.tsx`:
```typescript
'use client'
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Stack, Select, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()

  const form = useForm({
    initialValues: { name: '', email: '', password: '', role: 'USER', studioName: '', city: '' },
    validate: {
      name: (v) => (v.length > 1 ? null : 'Required'),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length >= 6 ? null : 'Min 6 characters'),
      role: (v) => (v ? null : 'Select a role'),
      studioName: (v, values) => (values.role === 'CLIENT' && !v ? 'Required for studios' : null),
      city: (v, values) => (values.role === 'CLIENT' && !v ? 'Required for studios' : null),
    },
  })

  async function handleSubmit(values: typeof form.values) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json()
      notifications.show({ color: 'red', title: 'Error', message: data.error })
      return
    }

    notifications.show({ color: 'green', title: 'Account created', message: 'You can now sign in' })
    router.push('/auth/login')
  }

  return (
    <Container size={420} mt={80}>
      <Title ta="center">Create an account</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Already have one?{' '}
        <Anchor component={Link} href="/auth/login">Sign in</Anchor>
      </Text>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Name" placeholder="Your name" {...form.getInputProps('name')} />
            <TextInput label="Email" placeholder="you@example.com" {...form.getInputProps('email')} />
            <PasswordInput label="Password" placeholder="Min 6 characters" {...form.getInputProps('password')} />
            <Select
              label="I am a..."
              data={[
                { value: 'USER', label: 'Looking for classes' },
                { value: 'CLIENT', label: 'Studio / gym owner' },
              ]}
              {...form.getInputProps('role')}
            />
            {form.values.role === 'CLIENT' && (
              <>
                <TextInput label="Studio Name" placeholder="Cairo Fitness" {...form.getInputProps('studioName')} />
                <TextInput label="City" placeholder="Cairo" {...form.getInputProps('city')} />
              </>
            )}
            <Button type="submit" fullWidth mt="xl">Create account</Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
```

- [ ] **Step 8: Verify manually**

Start dev server and navigate to http://localhost:3000/auth/register, create a USER account, then sign in at http://localhost:3000/auth/login.
Expected: Successful login, redirected to /dashboard.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: auth pages (login, register), NavBar, SessionProvider"
```

---

## Task 5: Classes API Routes

**Files:**
- Create: `apps/web/app/(backend)/api/classes/route.ts`
- Create: `apps/web/app/(backend)/api/classes/[id]/route.ts`
- Create: `apps/web/app/(backend)/api/classes/route.test.ts`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts`; `ClassDTO` from `@el-captain/types`
- Produces:
  - `GET /api/classes?type=&date=&city=` → `ClassDTO[]`
  - `POST /api/classes` (CLIENT) → `ClassDTO`
  - `GET /api/classes/[id]` → `ClassDTO`
  - `PATCH /api/classes/[id]` (CLIENT owner or ADMIN) → `ClassDTO`
  - `DELETE /api/classes/[id]` (CLIENT owner or ADMIN) → `{ success: true }`

- [ ] **Step 1: Create classes collection route**

Create `apps/web/app/(backend)/api/classes/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toDTO(c: any) {
  return {
    id: c.id,
    title: c.title,
    type: c.type,
    description: c.description,
    date: c.date.toISOString(),
    durationMinutes: c.durationMinutes,
    city: c.city,
    address: c.address,
    capacity: c.capacity,
    spotsLeft: c.spotsLeft,
    imageUrl: c.imageUrl,
    clientId: c.clientId,
    clientName: c.client.name,
    studioName: c.client.clientProfile?.studioName ?? null,
    createdAt: c.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const date = searchParams.get('date')
  const city = searchParams.get('city')

  const classes = await prisma.class.findMany({
    where: {
      ...(type ? { type: { contains: type, mode: 'insensitive' } } : {}),
      ...(date ? { date: { gte: new Date(date) } } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
    },
    include: { client: { include: { clientProfile: true } } },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(classes.map(toDTO))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, type, description, date, durationMinutes, city, address, capacity, imageUrl } = body

  if (!title || !type || !date || !durationMinutes || !city || !address || !capacity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const cls = await prisma.class.create({
    data: {
      title, type, description, date: new Date(date),
      durationMinutes: Number(durationMinutes),
      city, address,
      capacity: Number(capacity),
      spotsLeft: Number(capacity),
      imageUrl: imageUrl ?? null,
      clientId: session.user.id,
    },
    include: { client: { include: { clientProfile: true } } },
  })

  return NextResponse.json(toDTO(cls), { status: 201 })
}
```

- [ ] **Step 2: Create class detail route**

Create `apps/web/app/(backend)/api/classes/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toDTO(c: any) {
  return {
    id: c.id, title: c.title, type: c.type, description: c.description,
    date: c.date.toISOString(), durationMinutes: c.durationMinutes,
    city: c.city, address: c.address, capacity: c.capacity, spotsLeft: c.spotsLeft,
    imageUrl: c.imageUrl, clientId: c.clientId,
    clientName: c.client.name,
    studioName: c.client.clientProfile?.studioName ?? null,
    createdAt: c.createdAt.toISOString(),
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: { client: { include: { clientProfile: true } } },
  })
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(toDTO(cls))
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cls = await prisma.class.findUnique({ where: { id: params.id } })
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = cls.clientId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const updated = await prisma.class.update({
    where: { id: params.id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.type && { type: body.type }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.date && { date: new Date(body.date) }),
      ...(body.durationMinutes && { durationMinutes: Number(body.durationMinutes) }),
      ...(body.city && { city: body.city }),
      ...(body.address && { address: body.address }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
    },
    include: { client: { include: { clientProfile: true } } },
  })

  return NextResponse.json(toDTO(updated))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cls = await prisma.class.findUnique({ where: { id: params.id } })
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = cls.clientId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.class.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Write tests for classes collection route**

Create `apps/web/app/(backend)/api/classes/route.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { class: { findMany: vi.fn(), create: vi.fn() } },
}))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { GET, POST } from './route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

const makeClass = () => ({
  id: 'c1', title: 'Yoga', type: 'yoga', description: null,
  date: new Date('2026-07-01T09:00:00Z'), durationMinutes: 60,
  city: 'Cairo', address: '10 St', capacity: 10, spotsLeft: 10,
  imageUrl: null, clientId: 'u1', createdAt: new Date(),
  client: { name: 'Studio', clientProfile: { studioName: 'My Studio' } },
})

describe('GET /api/classes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns classes as DTOs', async () => {
    vi.mocked(prisma.class.findMany).mockResolvedValue([makeClass()] as any)
    const req = new Request('http://localhost/api/classes')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].studioName).toBe('My Studio')
  })
})

describe('POST /api/classes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for non-CLIENT', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { role: 'USER', id: 'u1' } } as any)
    const req = new Request('http://localhost/api/classes', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('creates class for CLIENT', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { role: 'CLIENT', id: 'u1' } } as any)
    vi.mocked(prisma.class.create).mockResolvedValue(makeClass() as any)
    const req = new Request('http://localhost/api/classes', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Yoga', type: 'yoga', date: '2026-07-01T09:00:00Z',
        durationMinutes: 60, city: 'Cairo', address: '10 St', capacity: 10,
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
  })
})
```

- [ ] **Step 4: Run tests**

```bash
cd apps/web && npx vitest run app/\(backend\)/api/classes/route.test.ts
```
Expected: 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: classes API routes (CRUD, search, auth guards)"
```

---

## Task 6: Bookings API Routes

**Files:**
- Create: `apps/web/app/(backend)/api/bookings/route.ts`
- Create: `apps/web/app/(backend)/api/bookings/[id]/cancel/route.ts`
- Create: `apps/web/app/(backend)/api/bookings/route.test.ts`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts`; `BookingDTO` from `@el-captain/types`
- Produces:
  - `POST /api/bookings` (USER) → `BookingDTO`
  - `GET /api/bookings` (USER) → `BookingDTO[]`
  - `PATCH /api/bookings/[id]/cancel` (USER owner) → `{ success: true }`

- [ ] **Step 1: Create bookings collection route**

Create `apps/web/app/(backend)/api/bookings/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toDTO(b: any) {
  const c = b.class
  return {
    id: b.id,
    status: b.status,
    classId: b.classId,
    createdAt: b.createdAt.toISOString(),
    class: {
      id: c.id, title: c.title, type: c.type, description: c.description,
      date: c.date.toISOString(), durationMinutes: c.durationMinutes,
      city: c.city, address: c.address, capacity: c.capacity, spotsLeft: c.spotsLeft,
      imageUrl: c.imageUrl, clientId: c.clientId,
      clientName: c.client.name,
      studioName: c.client.clientProfile?.studioName ?? null,
      createdAt: c.createdAt.toISOString(),
    },
  }
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { class: { include: { client: { include: { clientProfile: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(bookings.map(toDTO))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { classId } = await req.json()
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const cls = await prisma.class.findUnique({ where: { id: classId } })
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  if (cls.spotsLeft <= 0) return NextResponse.json({ error: 'No spots available' }, { status: 409 })

  const existing = await prisma.booking.findUnique({
    where: { userId_classId: { userId: session.user.id, classId } },
  })
  if (existing) return NextResponse.json({ error: 'Already booked' }, { status: 409 })

  const booking = await prisma.$transaction(async (tx) => {
    await tx.class.update({
      where: { id: classId },
      data: { spotsLeft: { decrement: 1 } },
    })
    return tx.booking.create({
      data: { userId: session.user.id, classId },
      include: { class: { include: { client: { include: { clientProfile: true } } } } },
    })
  })

  return NextResponse.json(toDTO(booking), { status: 201 })
}
```

- [ ] **Step 2: Create cancel route**

Create `apps/web/app/(backend)/api/bookings/[id]/cancel/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const booking = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 409 })

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: params.id }, data: { status: 'CANCELLED' } })
    await tx.class.update({ where: { id: booking.classId }, data: { spotsLeft: { increment: 1 } } })
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Write booking API tests**

Create `apps/web/app/(backend)/api/bookings/route.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    class: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { POST } from './route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

describe('POST /api/bookings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not logged in', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ classId: 'c1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 409 when no spots left', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER' } } as any)
    vi.mocked(prisma.class.findUnique).mockResolvedValue({ id: 'c1', spotsLeft: 0 } as any)
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ classId: 'c1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('No spots available')
  })

  it('creates booking via transaction when spots available', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', role: 'USER' } } as any)
    vi.mocked(prisma.class.findUnique).mockResolvedValue({ id: 'c1', spotsLeft: 5 } as any)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null)
    const mockBooking = {
      id: 'b1', status: 'CONFIRMED', classId: 'c1', createdAt: new Date(),
      class: {
        id: 'c1', title: 'Yoga', type: 'yoga', description: null,
        date: new Date(), durationMinutes: 60, city: 'Cairo', address: 'St',
        capacity: 10, spotsLeft: 4, imageUrl: null, clientId: 'u2', createdAt: new Date(),
        client: { name: 'Studio', clientProfile: { studioName: 'X' } },
      },
    }
    vi.mocked(prisma.$transaction).mockResolvedValue(mockBooking as any)
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ classId: 'c1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: Run tests**

```bash
cd apps/web && npx vitest run app/\(backend\)/api/bookings/route.test.ts
```
Expected: 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: bookings API (book, list, cancel) with atomic transaction"
```

---

## Task 7: Admin API Routes

**Files:**
- Create: `apps/web/app/(backend)/api/admin/users/route.ts`
- Create: `apps/web/app/(backend)/api/admin/classes/route.ts`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts`
- Produces:
  - `GET /api/admin/users` → `{ id, name, email, role, createdAt }[]`
  - `PATCH /api/admin/users` with body `{ userId, suspended }` → `{ success: true }`
  - `GET /api/admin/classes` → `ClassDTO[]`

- [ ] **Step 1: Create admin users route**

Create `apps/web/app/(backend)/api/admin/users/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })))
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, role } = await req.json()
  if (!userId || !role) return NextResponse.json({ error: 'userId and role required' }, { status: 400 })

  await prisma.user.update({ where: { id: userId }, data: { role } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create admin classes route**

Create `apps/web/app/(backend)/api/admin/classes/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const classes = await prisma.class.findMany({
    include: { client: { include: { clientProfile: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(classes.map(c => ({
    id: c.id, title: c.title, type: c.type, description: c.description,
    date: c.date.toISOString(), durationMinutes: c.durationMinutes,
    city: c.city, address: c.address, capacity: c.capacity, spotsLeft: c.spotsLeft,
    imageUrl: c.imageUrl, clientId: c.clientId,
    clientName: c.client.name,
    studioName: c.client.clientProfile?.studioName ?? null,
    createdAt: c.createdAt.toISOString(),
  })))
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: admin API routes (users list/update, classes list)"
```

---

## Task 8: Landing Page + Class Search UI

**Files:**
- Create: `apps/web/components/ClassCard.tsx`
- Create: `apps/web/components/ClassSearch.tsx`
- Modify: `apps/web/app/(frontend)/page.tsx`

**Interfaces:**
- Consumes: `ClassDTO`, `SearchParams` from `@el-captain/types`; `GET /api/classes`

- [ ] **Step 1: Create ClassCard component**

Create `apps/web/components/ClassCard.tsx`:
```typescript
import { Card, Text, Badge, Button, Group, Stack } from '@mantine/core'
import Link from 'next/link'
import type { ClassDTO } from '@el-captain/types'

interface Props { class: ClassDTO }

export function ClassCard({ class: c }: Props) {
  const date = new Date(c.date)
  const spotsColor = c.spotsLeft === 0 ? 'red' : c.spotsLeft <= 3 ? 'orange' : 'green'

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Badge color="blue" variant="light">{c.type}</Badge>
          <Badge color={spotsColor} variant="light">
            {c.spotsLeft === 0 ? 'Full' : `${c.spotsLeft} spots left`}
          </Badge>
        </Group>
        <Text fw={600} size="lg">{c.title}</Text>
        <Text size="sm" c="dimmed">{c.studioName ?? c.clientName}</Text>
        <Text size="sm">{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text size="sm">{c.city} · {c.durationMinutes} min</Text>
        <Button component={Link} href={`/classes/${c.id}`} variant="light" fullWidth mt="xs">
          View class
        </Button>
      </Stack>
    </Card>
  )
}
```

- [ ] **Step 2: Create ClassSearch component**

Create `apps/web/components/ClassSearch.tsx`:
```typescript
'use client'
import { TextInput, Select, Group, Button, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { SearchParams } from '@el-captain/types'

interface Props {
  onSearch: (params: SearchParams) => void
}

export function ClassSearch({ onSearch }: Props) {
  const form = useForm<SearchParams>({
    initialValues: { type: '', date: '', city: '' },
  })

  return (
    <form onSubmit={form.onSubmit(onSearch)}>
      <Stack gap="sm">
        <Group grow>
          <Select
            placeholder="Class type"
            clearable
            data={['kickboxing', 'yoga', 'pilates', 'crossfit', 'spinning', 'zumba']}
            {...form.getInputProps('type')}
          />
          <TextInput
            type="date"
            placeholder="Date"
            {...form.getInputProps('date')}
          />
          <TextInput
            placeholder="City"
            {...form.getInputProps('city')}
          />
        </Group>
        <Group>
          <Button type="submit">Search</Button>
          <Button variant="subtle" onClick={() => { form.reset(); onSearch({}) }}>Clear</Button>
        </Group>
      </Stack>
    </form>
  )
}
```

- [ ] **Step 3: Create landing page**

Create `apps/web/app/(frontend)/page.tsx`:
```typescript
'use client'
import { Container, Title, Text, SimpleGrid, Stack } from '@mantine/core'
import { useState, useEffect, useCallback } from 'react'
import { ClassCard } from '@/components/ClassCard'
import { ClassSearch } from '@/components/ClassSearch'
import type { ClassDTO, SearchParams } from '@el-captain/types'

export default function HomePage() {
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClasses = useCallback(async (params: SearchParams = {}) => {
    setLoading(true)
    const query = new URLSearchParams()
    if (params.type) query.set('type', params.type)
    if (params.date) query.set('date', params.date)
    if (params.city) query.set('city', params.city)

    const res = await fetch(`/api/classes?${query}`)
    const data = await res.json()
    setClasses(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title>Find your next class</Title>
          <Text c="dimmed">Discover kickboxing, yoga, pilates, and more near you.</Text>
        </Stack>
        <ClassSearch onSearch={fetchClasses} />
        {loading ? (
          <Text c="dimmed">Loading classes...</Text>
        ) : classes.length === 0 ? (
          <Text c="dimmed">No classes found. Try different filters.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {classes.map(c => <ClassCard key={c.id} class={c} />)}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 4: Verify manually**

Start dev server. Visit http://localhost:3000.
Expected: Class cards displayed, search filters working, guest can see all classes.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: landing page with class cards and search filters"
```

---

## Task 9: Class Detail Page

**Files:**
- Create: `apps/web/app/(frontend)/classes/[id]/page.tsx`

**Interfaces:**
- Consumes: `ClassDTO`, `BookingDTO` from `@el-captain/types`; `GET /api/classes/[id]`; `POST /api/bookings`

- [ ] **Step 1: Create class detail page**

Create `apps/web/app/(frontend)/classes/[id]/page.tsx`:
```typescript
'use client'
import { Container, Title, Text, Badge, Button, Group, Stack, Paper, Divider } from '@mantine/core'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'
import type { ClassDTO } from '@el-captain/types'

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [cls, setCls] = useState<ClassDTO | null>(null)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    fetch(`/api/classes/${params.id}`)
      .then(r => r.json())
      .then(setCls)
  }, [params.id])

  async function handleBook() {
    if (!session) {
      router.push(`/auth/login?redirect=/classes/${params.id}`)
      return
    }

    setBooking(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: params.id }),
    })
    setBooking(false)

    if (!res.ok) {
      const data = await res.json()
      notifications.show({ color: 'red', title: 'Error', message: data.error })
      return
    }

    notifications.show({ color: 'green', title: 'Booked!', message: 'Your spot is confirmed.' })
    router.push('/dashboard/bookings')
  }

  if (!cls) return <Container py="xl"><Text>Loading...</Text></Container>

  const date = new Date(cls.date)
  const spotsColor = cls.spotsLeft === 0 ? 'red' : cls.spotsLeft <= 3 ? 'orange' : 'green'

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group>
          <Badge color="blue" size="lg">{cls.type}</Badge>
          <Badge color={spotsColor} size="lg">
            {cls.spotsLeft === 0 ? 'Full' : `${cls.spotsLeft} / ${cls.capacity} spots left`}
          </Badge>
        </Group>
        <Title>{cls.title}</Title>
        <Text c="dimmed" size="lg">{cls.studioName ?? cls.clientName}</Text>

        <Paper withBorder p="md" radius="md">
          <Stack gap="xs">
            <Text><strong>Date:</strong> {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <Text><strong>Duration:</strong> {cls.durationMinutes} minutes</Text>
            <Text><strong>Location:</strong> {cls.address}, {cls.city}</Text>
          </Stack>
        </Paper>

        {cls.description && (
          <>
            <Divider />
            <Text>{cls.description}</Text>
          </>
        )}

        <Button
          size="lg"
          onClick={handleBook}
          loading={booking}
          disabled={cls.spotsLeft === 0}
          fullWidth
        >
          {cls.spotsLeft === 0 ? 'Class is full' : session ? 'Book this class' : 'Sign in to book'}
        </Button>
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Verify manually**

Click a class card on the homepage. Verify the detail page loads. As a guest, click Book → should redirect to login. As a signed-in USER, click Book → booking created, redirected to /dashboard/bookings.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: class detail page with booking action"
```

---

## Task 10: Dashboard Pages

**Files:**
- Create: `apps/web/app/(frontend)/dashboard/layout.tsx`
- Create: `apps/web/app/(frontend)/dashboard/bookings/page.tsx`
- Create: `apps/web/app/(frontend)/dashboard/classes/page.tsx`
- Create: `apps/web/app/(frontend)/dashboard/admin/page.tsx`
- Create: `apps/web/components/BookingCard.tsx`

**Interfaces:**
- Consumes: `BookingDTO`, `ClassDTO` from `@el-captain/types`; all API routes from tasks 5–7

- [ ] **Step 1: Create dashboard layout**

Create `apps/web/app/(frontend)/dashboard/layout.tsx`:
```typescript
import { Container, Tabs } from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const { role } = session.user

  return (
    <Container size="lg" py="xl">
      <Tabs defaultValue={role === 'USER' ? 'bookings' : role === 'CLIENT' ? 'classes' : 'admin'}>
        <Tabs.List mb="xl">
          {role === 'USER' && <Tabs.Tab value="bookings" component={Link} href="/dashboard/bookings">My Bookings</Tabs.Tab>}
          {role === 'CLIENT' && <Tabs.Tab value="classes" component={Link} href="/dashboard/classes">My Classes</Tabs.Tab>}
          {role === 'ADMIN' && (
            <>
              <Tabs.Tab value="admin" component={Link} href="/dashboard/admin">Admin</Tabs.Tab>
              <Tabs.Tab value="classes" component={Link} href="/dashboard/classes">All Classes</Tabs.Tab>
            </>
          )}
        </Tabs.List>
        {children}
      </Tabs>
    </Container>
  )
}
```

- [ ] **Step 2: Create BookingCard component**

Create `apps/web/components/BookingCard.tsx`:
```typescript
'use client'
import { Card, Text, Badge, Button, Group, Stack } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { BookingDTO } from '@el-captain/types'

interface Props {
  booking: BookingDTO
  onCancelled: (id: string) => void
}

export function BookingCard({ booking, onCancelled }: Props) {
  const c = booking.class
  const date = new Date(c.date)

  async function handleCancel() {
    const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'PATCH' })
    if (!res.ok) {
      notifications.show({ color: 'red', title: 'Error', message: 'Could not cancel booking' })
      return
    }
    notifications.show({ color: 'green', title: 'Cancelled', message: 'Your booking has been cancelled' })
    onCancelled(booking.id)
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Badge color="blue" variant="light">{c.type}</Badge>
          <Badge color={booking.status === 'CONFIRMED' ? 'green' : 'gray'} variant="light">
            {booking.status}
          </Badge>
        </Group>
        <Text fw={600}>{c.title}</Text>
        <Text size="sm" c="dimmed">{c.studioName ?? c.clientName}</Text>
        <Text size="sm">{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text size="sm">{c.city}</Text>
        {booking.status === 'CONFIRMED' && (
          <Button variant="outline" color="red" size="xs" onClick={handleCancel} mt="xs">
            Cancel booking
          </Button>
        )}
      </Stack>
    </Card>
  )
}
```

- [ ] **Step 3: Create user bookings page**

Create `apps/web/app/(frontend)/dashboard/bookings/page.tsx`:
```typescript
'use client'
import { Title, SimpleGrid, Text, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { BookingCard } from '@/components/BookingCard'
import type { BookingDTO } from '@el-captain/types'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDTO[]>([])

  useEffect(() => {
    fetch('/api/bookings').then(r => r.json()).then(setBookings)
  }, [])

  function handleCancelled(id: string) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
  }

  return (
    <Stack gap="lg">
      <Title order={2}>My Bookings</Title>
      {bookings.length === 0 ? (
        <Text c="dimmed">No bookings yet. Browse classes to get started.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {bookings.map(b => <BookingCard key={b.id} booking={b} onCancelled={handleCancelled} />)}
        </SimpleGrid>
      )}
    </Stack>
  )
}
```

- [ ] **Step 4: Create client classes page**

Create `apps/web/app/(frontend)/dashboard/classes/page.tsx`:
```typescript
'use client'
import { Title, Stack, Button, Modal, TextInput, Textarea, NumberInput, Select, Group, Table, Text, ActionIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'
import type { ClassDTO } from '@el-captain/types'

export default function ClientClassesPage() {
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [opened, { open, close }] = useDisclosure(false)

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(setClasses)
  }, [])

  const form = useForm({
    initialValues: {
      title: '', type: '', description: '', date: '',
      durationMinutes: 60, city: '', address: '', capacity: 10, imageUrl: '',
    },
    validate: {
      title: (v) => (v ? null : 'Required'),
      type: (v) => (v ? null : 'Required'),
      date: (v) => (v ? null : 'Required'),
      city: (v) => (v ? null : 'Required'),
      address: (v) => (v ? null : 'Required'),
    },
  })

  async function handleCreate(values: typeof form.values) {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      notifications.show({ color: 'red', title: 'Error', message: 'Failed to create class' })
      return
    }
    const newClass = await res.json()
    setClasses(prev => [newClass, ...prev])
    form.reset()
    close()
    notifications.show({ color: 'green', title: 'Created', message: 'Class created successfully' })
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setClasses(prev => prev.filter(c => c.id !== id))
    notifications.show({ color: 'green', title: 'Deleted', message: 'Class removed' })
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>My Classes</Title>
        <Button onClick={open}>+ New Class</Button>
      </Group>

      {classes.length === 0 ? (
        <Text c="dimmed">No classes yet. Create your first class.</Text>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>City</Table.Th>
              <Table.Th>Spots</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {classes.map(c => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.title}</Table.Td>
                <Table.Td>{c.type}</Table.Td>
                <Table.Td>{new Date(c.date).toLocaleDateString()}</Table.Td>
                <Table.Td>{c.city}</Table.Td>
                <Table.Td>{c.spotsLeft}/{c.capacity}</Table.Td>
                <Table.Td>
                  <Button size="xs" color="red" variant="subtle" onClick={() => handleDelete(c.id)}>
                    Delete
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={opened} onClose={close} title="Create New Class" size="lg">
        <form onSubmit={form.onSubmit(handleCreate)}>
          <Stack>
            <TextInput label="Title" placeholder="Morning Kickboxing" {...form.getInputProps('title')} />
            <Select label="Type" data={['kickboxing', 'yoga', 'pilates', 'crossfit', 'spinning', 'zumba']} {...form.getInputProps('type')} />
            <Textarea label="Description" placeholder="Optional description" {...form.getInputProps('description')} />
            <TextInput label="Date & Time" type="datetime-local" {...form.getInputProps('date')} />
            <NumberInput label="Duration (minutes)" min={15} step={15} {...form.getInputProps('durationMinutes')} />
            <TextInput label="City" placeholder="Cairo" {...form.getInputProps('city')} />
            <TextInput label="Address" placeholder="10 Tahrir Square" {...form.getInputProps('address')} />
            <NumberInput label="Capacity" min={1} {...form.getInputProps('capacity')} />
            <TextInput label="Image URL (optional)" placeholder="https://..." {...form.getInputProps('imageUrl')} />
            <Button type="submit" fullWidth>Create Class</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
```

- [ ] **Step 5: Create admin dashboard page**

Create `apps/web/app/(frontend)/dashboard/admin/page.tsx`:
```typescript
'use client'
import { Title, Stack, Tabs, Table, Badge, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import type { ClassDTO } from '@el-captain/types'

interface AdminUser {
  id: string; name: string; email: string; role: string; createdAt: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [classes, setClasses] = useState<ClassDTO[]>([])

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(setUsers)
    fetch('/api/admin/classes').then(r => r.json()).then(setClasses)
  }, [])

  return (
    <Stack gap="lg">
      <Title order={2}>Admin Dashboard</Title>
      <Tabs defaultValue="users">
        <Tabs.List>
          <Tabs.Tab value="users">Users ({users.length})</Tabs.Tab>
          <Tabs.Tab value="classes">Classes ({classes.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users" pt="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Joined</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map(u => (
                <Table.Tr key={u.id}>
                  <Table.Td>{u.name}</Table.Td>
                  <Table.Td>{u.email}</Table.Td>
                  <Table.Td><Badge variant="light">{u.role}</Badge></Table.Td>
                  <Table.Td>{new Date(u.createdAt).toLocaleDateString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="classes" pt="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Studio</Table.Th>
                <Table.Th>City</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Spots</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {classes.map(c => (
                <Table.Tr key={c.id}>
                  <Table.Td>{c.title}</Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{c.type}</Badge></Table.Td>
                  <Table.Td>{c.studioName ?? c.clientName}</Table.Td>
                  <Table.Td>{c.city}</Table.Td>
                  <Table.Td>{new Date(c.date).toLocaleDateString()}</Table.Td>
                  <Table.Td>{c.spotsLeft}/{c.capacity}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
```

- [ ] **Step 6: Verify all dashboard pages manually**

Test all three roles:
1. Login as `user@elcaptain.com` / `user123` → `/dashboard/bookings` shows bookings
2. Login as `studio@elcaptain.com` / `studio123` → `/dashboard/classes` shows class table + create modal
3. Login as `admin@elcaptain.com` / `admin123` → `/dashboard/admin` shows users + classes tabs

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: dashboard pages for USER, CLIENT, and ADMIN roles"
```

---

## Task 11: Vercel Deployment

**Files:**
- Create: `vercel.json` (root)
- Modify: `apps/web/.env` → set production env vars in Vercel dashboard

**Interfaces:**
- None — deployment configuration only

- [ ] **Step 1: Create vercel.json at repo root**

```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

- [ ] **Step 2: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/el-captain.git
git push -u origin main
```

- [ ] **Step 3: Connect to Vercel**

1. Go to vercel.com → New Project → import `el-captain` repo
2. Set root directory to `apps/web`
3. Add environment variables:
   - `DATABASE_URL` — Neon connection string
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g. `https://el-captain.vercel.app`)

- [ ] **Step 4: Run production migration**

After deploy, run from local:
```bash
cd apps/web && DATABASE_URL="<neon-url>" npx prisma migrate deploy && npm run db:seed
```

- [ ] **Step 5: Verify production**

Visit your Vercel URL. Test login, class search, and booking end-to-end.

- [ ] **Step 6: Final commit**

```bash
git add vercel.json
git commit -m "chore: Vercel deployment config"
git push
```

---

## Self-Review

**Spec coverage check:**
- ✅ Three roles (ADMIN, CLIENT, USER) — Tasks 3, 7, 10
- ✅ Guest browsing — Task 8, 9 (no auth required for GET /api/classes)
- ✅ Guest book redirects to login — Task 9 (handleBook checks session)
- ✅ ClientProfile as separate model — Task 2 (schema)
- ✅ Class.type as String not enum — Task 2
- ✅ Capacity limits + spotsLeft — Tasks 2, 6
- ✅ Booking transaction (atomic) — Task 6
- ✅ Cancellation restores spot — Task 6
- ✅ No duplicate bookings (@@unique) — Task 2
- ✅ Search by type, date, city — Tasks 5, 8
- ✅ Auth with NextAuth credentials — Task 3
- ✅ Dashboard middleware protection — Task 3
- ✅ (frontend)/(backend) route groups — all tasks
- ✅ Mantine v7 — Tasks 4, 8, 9, 10
- ✅ Vercel deployment — Task 11

**Placeholder scan:** No TBDs or incomplete steps found.

**Type consistency:** `ClassDTO`, `BookingDTO`, `SearchParams`, `Role`, `BookingStatus` defined in Task 1 and used consistently in Tasks 5–10. `toDTO()` helper in Task 5 and 6 maps Prisma results to the same `ClassDTO` shape.
