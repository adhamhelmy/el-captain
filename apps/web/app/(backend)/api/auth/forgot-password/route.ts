import { NextResponse } from 'next/server'
import { publicRoute, type RequestContext } from '@/lib/server/api'
import { sendResetEmail } from '@/lib/email/auth-emails'
import { isValidEmail, normalizeEmail } from '@/lib/shared/auth-rules'
import { findUserByEmail } from '@/prisma/models/user'

/** Emails a reset link. Answers the same whether or not the account exists, so emails can't be probed. */
async function forgotPassword({ req }: RequestContext) {
  const email = normalizeEmail((await req.json()).email)
  const user = isValidEmail(email) && (await findUserByEmail(email))
  if (user) await sendResetEmail(req, user)

  return NextResponse.json({ ok: true })
}

export const POST = publicRoute(forgotPassword)
