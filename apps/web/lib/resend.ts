import type { Mail } from './mail'

/** Sends one email through Resend's HTTP API, from MAIL_FROM. */
export async function sendWithResend(apiKey: string, mail: Mail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, ...mail }),
  })
  if (!res.ok) throw new Error(`Sending email failed with ${res.status}`)
}
