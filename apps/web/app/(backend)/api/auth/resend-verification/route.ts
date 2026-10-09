import { NextResponse } from 'next/server'
import { publicRoute, type RequestContext } from '@/lib/server/api'
import { sendVerificationEmail } from '@/lib/email/auth-emails'
import { isValidEmail, normalizeEmail } from '@/lib/shared/auth-rules'
import { findUserByEmail } from '@/prisma/models/user'

/** Sends a new confirmation link. Answers the same whether or not the account exists. */
async function resendVerification({ req }: RequestContext) {
  const email = normalizeEmail((await req.json()).email)
  const user = isValidEmail(email) && (await findUserByEmail(email))
  if (user && !user.emailVerified) await sendVerificationEmail(req, user)

  return NextResponse.json({ ok: true })
}

export const POST = publicRoute(resendVerification)
