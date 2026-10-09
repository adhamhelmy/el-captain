import type { NextRequest } from 'next/server';
import { resolveLocale, type AppLocale } from '@/i18n/locale';
import { MESSAGES } from '@/i18n/messages';
import { sendWithResend } from './resend';

export type Mail = { to: string; subject: string; text: string; html: string };

/**
 * Sends through Resend's HTTP API when RESEND_API_KEY is set.
 * Without a key, outside production, the email is printed to the server console so links can be followed locally.
 */
export async function sendMail(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY is not set');
    console.info(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`);
    return;
  }
  await sendWithResend(key, mail);
}

/**
 * Absolute link into the app for emails. Built from configuration, never the request's Host header,
 * which an attacker could set to send someone a reset link pointing at their own site.
 */
export function appUrl(path: string) {
  return new URL(path, baseUrl()).toString();
}

function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
  throw new Error('APP_URL is not set');
}

/** The language the requester reads the app in, for the emails we send them. */
export const requestLocale = (req: NextRequest): AppLocale => resolveLocale(req.cookies?.get('locale')?.value, req.headers.get('accept-language'));

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

type Notice = { subject: string; intro: string; button: string; ignore?: string };

/** One email with an optional quoted detail and a single button, in the given language. */
export function noticeMail(to: string, locale: AppLocale, m: Notice, link: string, detail?: string | null): Mail {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const quote = detail
    ? `<blockquote dir="auto" style="margin:0 0 16px;padding:8px 12px;border-inline-start:3px solid #ccc">${escape(detail)}</blockquote>\n`
    : '';
  const footer = m.ignore ? `<p style="color:#666;font-size:13px">${escape(m.ignore)}</p>\n` : '';
  return {
    to,
    subject: m.subject,
    text: [m.intro, detail, link, m.ignore].filter(Boolean).join('\n\n'),
    html: `<div dir="${dir}" style="font-family:sans-serif;font-size:15px;line-height:1.6">
<p>${escape(m.intro)}</p>
${quote}<p><a href="${escape(link)}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none">${escape(m.button)}</a></p>
${footer}</div>`,
  };
}

/** One email with a single button, in the requester's language. */
export const linkMail = (to: string, locale: AppLocale, kind: 'verify' | 'reset', link: string): Mail =>
  noticeMail(to, locale, MESSAGES[locale].emails[kind], link);
