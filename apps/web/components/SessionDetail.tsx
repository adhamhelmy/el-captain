'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { PhaseTag, TypeTag } from '@/components/sessions';
import { Avatar, Back, initialsOf } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { bookSession, getSession, unbookSession } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { SessionDetailDTO } from '@/lib/server/dto';
import { CANCEL_CUTOFF_MS, canMemberCancel, sessionPhase } from '@/lib/shared/session-rules';
import onb from './onboarding.module.css';
import styles from './SessionDetail.module.css';

const BOOK_ERRORS = ['session_full', 'session_closed', 'cancel_too_late'] as const;

/** Session detail. Guests see everything but are sent to log in to book. */
export function SessionDetail({ guest }: Readonly<{ guest?: boolean }>) {
  const t = useTranslations('session');
  const te = useTranslations('errors');
  const l = useSessionLabels();
  const { id } = useParams<{ id: string }>();
  const email = useSession().data?.user.email ?? '';
  const [s, setS] = useState<SessionDetailDTO | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSession(id)
      .then((r) => setS(r.ok ? r.data : null))
      .catch(() => setS(null));
  }, [id]);

  if (s === null) notFound();
  if (!s) return null;

  const phase = sessionPhase(s);
  const full = s.booked >= s.capacity;
  const cancelBy = new Date(new Date(s.startsAt).getTime() - CANCEL_CUTOFF_MS);

  async function act(call: typeof bookSession) {
    setBusy(true);
    setError('');
    const r = await call(id);
    setBusy(false);
    if (r.ok) setS(r.data);
    else setError(te(BOOK_ERRORS.find((c) => c === r.code) ?? 'generic'));
  }

  return (
    <div className={`page detail ${styles.page}`}>
      <Back href={guest ? '/sessions' : '/user/sessions'}>{t('allSessions')}</Back>
      <div className={`hero ${styles.hero}`}>
        <div className='chips'>
          <TypeTag type={s.type} />
          {phase !== 'upcoming' && <PhaseTag s={s} />}
        </div>
        <div className={`display ${styles.title}`} dir='auto'>
          {l.title(s)}
        </div>
        <div className={`muted ${styles.when}`}>{l.when(s.startsAt)}</div>
      </div>
      <div className={`grid-2 ${styles.columns}`}>
        <div className={`stack ${styles.main}`}>
          <div className='chips'>
            {[s.level && l.level(s.level), l.minutes(s.durationMin), l.sport(s.sport)].filter(Boolean).map((label) => (
              <span key={label} className='pill'>
                {label}
              </span>
            ))}
          </div>
          {s.description && (
            <div>
              <div className={`h3 ${styles.heading}`}>{t('whatToExpect')}</div>
              <div className={`muted ${styles.description}`} dir='auto'>
                {s.description}
              </div>
            </div>
          )}
          <div>
            <div className={`h3 ${styles.heading}`}>{t('where')}</div>
            <div dir='auto' className={styles.coachName}>
              {s.venue.name}
            </div>
            <div dir='auto' className={`muted ${styles.description}`}>
              {s.venue.address} · {s.venue.city}
            </div>
            {s.venue.mapUrl && (
              <a href={s.venue.mapUrl} target='_blank' rel='noopener noreferrer nofollow' className={styles.profileLink}>
                {t('map')}
              </a>
            )}
          </div>
          <Link href={`${guest ? '' : '/user'}/coaches/${s.coach.id}`} className={`row hover ${styles.coach}`}>
            <Avatar initials={initialsOf(s.coach.name)} size={48} src={s.coach.photoUrl} />
            <div className={styles.coachText}>
              <div className={`muted ${styles.small}`}>{t('coach')}</div>
              <div dir='auto' className={styles.coachName}>
                {s.coach.name}
              </div>
            </div>
            <span className={styles.profileLink}>{t('profileLink')}</span>
          </Link>
        </div>
        <div className={`card stack ${styles.panel}`}>
          {phase === 'cancelled' && (
            <>
              <div className={`muted ${styles.note}`}>{t('cancelled')}</div>
              {s.cancelReason && (
                <div dir='auto' className={`muted ${styles.note}`}>
                  {t('reason', { reason: s.cancelReason })}
                </div>
              )}
            </>
          )}
          {phase === 'past' && <div className={`muted ${styles.note}`}>{t('ended')}</div>}
          {phase === 'upcoming' && s.bookedByMe && (
            <>
              <div className={styles.confirmed}>
                <div className={styles.check} />
                <div>
                  <div className={`display lh-100 ${styles.booked}`}>{t('booked')}</div>
                  {email && <div className={`muted ${styles.small}`}>{t('confirmation', { email: isolate(email) })}</div>}
                </div>
              </div>
              <Link href='/user/sessions/me' className={`btn-ghost plain ${styles.viewMine}`}>
                {t('viewMine')}
              </Link>
              {s.type === 'PRIVATE' && <div className={`dim ${styles.fine}`}>{t('privateCancel')}</div>}
              {s.type === 'GROUP' && canMemberCancel(s.startsAt) && (
                <>
                  <button type='button' className={`linkbtn ${styles.cancel}`} disabled={busy} onClick={() => act(unbookSession)}>
                    {t('cancel')}
                  </button>
                  <div className={`dim ${styles.fine}`}>{t('cancelUntil', { when: l.when(cancelBy) })}</div>
                </>
              )}
              {s.type === 'GROUP' && !canMemberCancel(s.startsAt) && <div className={`dim ${styles.fine}`}>{t('cancelClosed')}</div>}
            </>
          )}
          {phase === 'upcoming' && !s.bookedByMe && (
            <>
              <div className={styles.priceRow}>
                <span className={`muted ${styles.note}`}>{l.spots(s)}</span>
                <span className={`display ${styles.price}`}>{l.price(s.price)}</span>
              </div>
              {guest && (
                <Link href={`/login?callbackUrl=/user/sessions/${s.id}`} className={`btn block ${styles.book}`}>
                  {t('logInToBook')}
                </Link>
              )}
              {!guest && full && <div className={`muted ${styles.note}`}>{t('full')}</div>}
              {!guest && !full && (
                <button type='button' className={`btn block ${styles.book}`} disabled={busy} onClick={() => act(bookSession)}>
                  {t('reserve')}
                </button>
              )}
              <div className={`dim ${styles.fine}`}>{t('payAtSession')}</div>
            </>
          )}
          {error && <div className={onb.error}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
