import type { AppLocale } from '@/i18n/locale';
import { MESSAGES } from '@/i18n/messages';
import { appUrl, noticeMail, sendMail, type Mail } from '@/lib/email/mail';

const DECISION = {
  approved: { key: 'coachApproved', path: '/coach/dashboard' },
  rejected: { key: 'coachRejected', path: '/coach/onboarding' },
  suspended: { key: 'coachSuspended', path: '/coach/onboarding' },
} as const;

/** Notifications never undo the change they report: a failed send is logged. */
async function send(mail: Mail, what: string) {
  try {
    await sendMail(mail);
  } catch (e) {
    console.error(`[mail] ${what} failed`, e);
  }
}

/** Tells a coach the admin's decision, with the reason when there is one. */
export async function sendCoachDecisionEmail(
  coach: { id: string; email: string },
  locale: AppLocale,
  kind: keyof typeof DECISION,
  reason?: string | null,
) {
  const { key, path } = DECISION[kind];
  await send(noticeMail(coach.email, locale, MESSAGES[locale].emails[key], appUrl(path), reason), `${kind} email to coach ${coach.id}`);
}

/** Admins read the app in English by default, so this one is always English. */
export async function sendCoachSubmittedEmail(adminEmails: string[], coach: { id: string; name: string }) {
  const link = appUrl(`/admin/coaches/${coach.id}`);
  for (const to of adminEmails) {
    await send(noticeMail(to, 'en', MESSAGES.en.emails.coachSubmitted, link, coach.name), `submitted email for coach ${coach.id}`);
  }
}
