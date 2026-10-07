import type { NextRequest } from 'next/server'
import { appUrl, linkMail, requestLocale, sendMail } from '@/lib/mail'
import { issuedWithin, issueToken } from '@/prisma/models/auth-token'

type Recipient = { id: string; email: string }

/** At most one email of each kind per user in this window; extra requests are silently skipped. */
const RESEND_COOLDOWN_MS = 60 * 1000

/**
 * Issues a token and emails its link. A failed send is logged, not thrown:
 * the account change already happened, and the user can ask for the email again.
 */
async function sendLink(req: NextRequest, user: Recipient, kind: 'verify' | 'reset') {
  const type = kind === 'verify' ? 'VERIFY_EMAIL' : 'RESET_PASSWORD'
  if (await issuedWithin(user.id, type, RESEND_COOLDOWN_MS)) return
  const token = await issueToken(user.id, type)
  const path = kind === 'verify' ? '/verify-email' : '/reset-password'
  const link = appUrl(`${path}?token=${token}`)
  try {
    await sendMail(linkMail(user.email, requestLocale(req), kind, link))
  } catch (e) {
    console.error(`[mail] ${kind} email to user ${user.id} failed`, e)
  }
}

export const sendVerificationEmail = (req: NextRequest, user: Recipient) => sendLink(req, user, 'verify')
export const sendResetEmail = (req: NextRequest, user: Recipient) => sendLink(req, user, 'reset')
