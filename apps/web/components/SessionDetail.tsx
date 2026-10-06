'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Avatar, Back, TypeTag } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { bookings, coach, ME, session, user } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import styles from './SessionDetail.module.css';

/** Session detail. Guests see the coach and price, and are sent to log in to book. */
export function SessionDetail({ guest }: Readonly<{ guest?: boolean }>) {
  const t = useTranslations('session');
  const x = useSessionText();
  const s = session(useParams<{ id: string }>().id);
  const [booked, setBooked] = useState(
    () => !guest && bookings.some((b) => b.userId === ME.user && b.sessionId === s?.id),
  );
  if (!s) notFound();
  const c = coach(s.coachId)!;

  return (
    <div className={`page detail ${styles.page}`}>
      <Back href={guest ? '/sessions' : '/user/sessions'}>{t('allSessions')}</Back>
      <div className={`hero ${styles.hero}`}>
        <TypeTag s={s} />
        <div className={`display ${styles.title}`} dir='auto'>
          {s.title}
        </div>
        <div className={`muted ${styles.when}`}>{x.when(s)}</div>
      </div>
      <div className={`grid-2 ${styles.columns}`}>
        <div className={`stack ${styles.main}`}>
          <div className='chips'>
            {[x.level(s.level), x.minutes(s.duration), x.category(s.category)].map((label) => (
              <span key={label} className='pill'>
                {label}
              </span>
            ))}
          </div>
          <div>
            <div className={`h3 ${styles.heading}`}>
              {t('whatToExpect')}
            </div>
            <div className={`muted ${styles.description}`} dir='auto'>
              {s.description}
            </div>
          </div>
          <Link
            href={`${guest ? '' : '/user'}/coaches/${c.id}`}
            className={`row hover ${styles.coach}`}
          >
            <Avatar initials={x.initials(c)} size={48} />
            <div className={styles.coachText}>
              <div dir='auto' className={styles.coachName}>
                {x.name(c)}
              </div>
              <div className={`muted ${styles.small}`}>
                {t('coachLine', {
                  specialty: x.category(c.specialty),
                  rating: c.rating,
                  reviews: c.reviews,
                })}
              </div>
            </div>
            <span className={styles.profileLink}>
              {t('profileLink')}
            </span>
          </Link>
        </div>
        <div className={`card stack ${styles.panel}`}>
          {s.status === 'past' && (
            <div className={`muted ${styles.note}`}>{t('ended')}</div>
          )}
          {s.status !== 'past' && (booked ? (
            <>
              <div className={styles.confirmed}>
                <div className={styles.check} />
                <div>
                  <div className={`display lh-100 ${styles.booked}`}>{t('booked')}</div>
                  <div className={`muted ${styles.small}`}>
                    {t('confirmation', { email: isolate(user(ME.user)!.email) })}
                  </div>
                </div>
              </div>
              <Link
                href='/user/sessions/me'
                className={`btn-ghost plain ${styles.viewMine}`}
              >
                {t('viewMine')}
              </Link>
              <button
                type='button'
                className={`linkbtn ${styles.cancel}`}
                onClick={() => setBooked(false)}
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <>
              <div className={styles.priceRow}>
                <span className={`muted ${styles.note}`}>{x.spots(s)}</span>
                <span className={`display ${styles.price}`}>
                  {x.price(s.price)}
                </span>
              </div>
              {guest ? (
                <Link
                  href={`/login?callbackUrl=/user/sessions/${s.id}`}
                  className={`btn block ${styles.book}`}
                >
                  {t('logInToBook')}
                </Link>
              ) : (
                <button
                  type='button'
                  className={`btn block ${styles.book}`}
                  onClick={() => setBooked(true)}
                >
                  {s.type === 'group' ? t('reserve') : t('book')}
                </button>
              )}
              <div className={`dim ${styles.fine}`}>
                {t('freeCancel')}
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
