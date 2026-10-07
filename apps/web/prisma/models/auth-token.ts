import { createHash, randomBytes } from 'node:crypto'
import type { AuthTokenType } from '@prisma/client'
import { prisma } from '../client'

/** How long each kind of emailed link works. */
export const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  VERIFY_EMAIL: 24 * 60 * 60 * 1000,
  RESET_PASSWORD: 30 * 60 * 1000,
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

/**
 * Creates a fresh link token for the user and returns it in plain text, for the email only.
 * Any earlier token of the same type stops working.
 */
export async function issueToken(userId: string, type: AuthTokenType) {
  const token = randomBytes(32).toString('base64url')
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type } }),
    prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]),
      },
    }),
  ])
  return token
}

/** Whether a token of this type went out in the last `ms`, so one inbox can't be flooded with emails. */
export async function issuedWithin(userId: string, type: AuthTokenType, ms: number) {
  const recent = await prisma.authToken.findFirst({
    where: { userId, type, createdAt: { gt: new Date(Date.now() - ms) } },
    select: { id: true },
  })
  return recent != null
}

/**
 * Uses up the token and returns its user's id, or null when it is unknown, expired or already used.
 * Deleting before returning means two requests with the same link can't both succeed.
 */
export async function consumeToken(token: string, type: AuthTokenType) {
  const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } })
  if (record?.type !== type) return null
  const { count } = await prisma.authToken.deleteMany({ where: { id: record.id } })
  if (count !== 1 || record.expiresAt < new Date()) return null
  return record.userId
}
