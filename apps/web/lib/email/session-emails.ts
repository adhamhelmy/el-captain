import { createFormatter, createTranslator } from 'next-intl';
import { APP_TZ, INTL_LOCALE, isAppLocale, type AppLocale } from '@/i18n/locale';
import { MESSAGES } from '@/i18n/messages';
import { appUrl, noticeMail, sendMail, type Mail } from '@/lib/email/mail';
import type { SessionDTO } from '@/lib/server/dto';
import { CANCEL_CUTOFF_MS } from '@/lib/shared/session-rules';

export type Recipient = { id: string; email: string; locale: string | null };
export type EmailSession = Pick<SessionDTO, 'id' | 'title' | 'startsAt' | 'durationMin' | 'price'> & {
  venue: { name: string; address: string };
  coach: { name: string };
};
export type EmailRequest = {
  startsAt: Date | string;
  durationMin: number;
  message: string | null;
  member: { name: string };
  sport: { nameEn: string; nameAr: string | null };
  venue: { name: string };
};

const localeOf = (r: Recipient): AppLocale => (isAppLocale(r.locale) ? r.locale : 'en');

/** Formatting and text for one reader's language, always in Cairo time. */
function words(locale: AppLocale) {
  const t = createTranslator({ locale: INTL_LOCALE[locale], messages: MESSAGES[locale], namespace: 'emails' });
  const f = createFormatter({ locale: INTL_LOCALE[locale], timeZone: APP_TZ });
  const when = (d: Date | string) => f.dateTime(new Date(d), { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
  const price = (n: number) => f.number(n, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 });
  const sessionDetail = (s: EmailSession) =>
    t('sessionDetail', {
      title: s.title,
      coach: s.coach.name,
      when: when(s.startsAt),
      minutes: s.durationMin,
      venue: s.venue.name,
      address: s.venue.address,
      price: price(s.price),
    });
  const requestDetail = (r: EmailRequest) =>
    t('requestDetail', {
      member: r.member.name,
      sport: (locale === 'ar' && r.sport.nameAr) || r.sport.nameEn,
      when: when(r.startsAt),
      minutes: r.durationMin,
      venue: r.venue.name,
    });
  return { t, when, sessionDetail, requestDetail };
}

/** Notifications never undo the change they report: a failed send is logged. */
async function send(mail: Mail, what: string) {
  try {
    await sendMail(mail);
  } catch (e) {
    console.error(`[mail] ${what} failed`, e);
  }
}

const lines = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join('\n\n');

export async function sendBookingConfirmed(member: Recipient, session: EmailSession) {
  const locale = localeOf(member);
  const w = words(locale);
  const cutoff = new Date(new Date(session.startsAt).getTime() - CANCEL_CUTOFF_MS);
  const detail = lines(w.sessionDetail(session), w.t('cancelBy', { when: w.when(cutoff) }));
  await send(
    noticeMail(member.email, locale, MESSAGES[locale].emails.bookingConfirmed, appUrl(`/user/sessions/${session.id}`), detail),
    `booking email to ${member.id}`,
  );
}

export async function sendSessionCancelled(members: Recipient[], session: EmailSession, reason: string | null) {
  for (const member of members) {
    const locale = localeOf(member);
    const w = words(locale);
    const detail = lines(w.sessionDetail(session), reason && w.t('reasonLine', { reason }));
    await send(
      noticeMail(member.email, locale, MESSAGES[locale].emails.sessionCancelled, appUrl('/user/sessions'), detail),
      `cancel email to ${member.id}`,
    );
  }
}

export async function sendPrivateRequested(coach: Recipient, request: EmailRequest) {
  const locale = localeOf(coach);
  const w = words(locale);
  const detail = lines(w.requestDetail(request), request.message);
  await send(
    noticeMail(coach.email, locale, MESSAGES[locale].emails.privateRequested, appUrl('/coach/sessions/me?tab=requests'), detail),
    `request email to ${coach.id}`,
  );
}

export async function sendRequestAccepted(member: Recipient, session: EmailSession) {
  const locale = localeOf(member);
  const w = words(locale);
  await send(
    noticeMail(member.email, locale, MESSAGES[locale].emails.requestAccepted, appUrl(`/user/sessions/${session.id}`), w.sessionDetail(session)),
    `accepted email to ${member.id}`,
  );
}

export async function sendRequestRejected(member: Recipient, request: EmailRequest, note: string | null) {
  const locale = localeOf(member);
  const w = words(locale);
  const detail = lines(w.requestDetail(request), note);
  await send(
    noticeMail(member.email, locale, MESSAGES[locale].emails.requestRejected, appUrl('/user/coaches'), detail),
    `rejected email to ${member.id}`,
  );
}
