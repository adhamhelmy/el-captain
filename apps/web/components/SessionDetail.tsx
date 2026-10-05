'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Avatar, Back, TypeTag } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { bookings, coach, ME, session, user } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

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
    <div className='page detail' style={{ maxWidth: 1080 }}>
      <Back href={guest ? '/sessions' : '/user/sessions'}>{t('allSessions')}</Back>
      <div className='hero' style={{ marginTop: 20 }}>
        <TypeTag s={s} />
        <div
          className='display'
          dir='auto'
          style={{ fontSize: 'clamp(44px, 6vw, 68px)', lineHeight: 1, marginTop: 14 }}
        >
          {s.title}
        </div>
        <div className='muted' style={{ fontSize: 16, marginTop: 8 }}>
          {x.when(s)}
        </div>
      </div>
      <div className='grid-2' style={{ gap: 32, marginTop: 32 }}>
        <div className='stack' style={{ gap: 28 }}>
          <div className='chips'>
            {[x.level(s.level), x.minutes(s.duration), x.category(s.category)].map((label) => (
              <span key={label} className='pill'>
                {label}
              </span>
            ))}
          </div>
          <div>
            <div className='h3' style={{ marginBottom: 10 }}>
              {t('whatToExpect')}
            </div>
            <div className='muted' dir='auto' style={{ fontSize: 15, lineHeight: 1.7 }}>
              {s.description}
            </div>
          </div>
          <Link
            href={`${guest ? '' : '/user'}/coaches/${c.id}`}
            className='row hover'
            style={{
              justifyContent: 'flex-start',
              gap: 14,
              padding: 18,
              borderRadius: 14,
              flexWrap: 'nowrap',
            }}
          >
            <Avatar initials={x.initials(c)} size={48} fontSize={16} />
            <div style={{ flex: 1 }}>
              <div dir='auto' style={{ fontWeight: 700 }}>
                {x.name(c)}
              </div>
              <div className='muted' style={{ fontSize: 13 }}>
                {t('coachLine', {
                  specialty: x.category(c.specialty),
                  rating: c.rating,
                  reviews: c.reviews,
                })}
              </div>
            </div>
            <span style={{ color: 'var(--accent-text)', fontSize: 14, fontWeight: 600 }}>
              {t('profileLink')}
            </span>
          </Link>
        </div>
        <div className='card stack' style={{ padding: 24, position: 'sticky', top: 24, gap: 16 }}>
          {s.status === 'past' && (
            <div className='muted' style={{ fontSize: 14 }}>
              {t('ended')}
            </div>
          )}
          {s.status !== 'past' && (booked ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    position: 'relative',
                    flex: '0 0 auto',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: 18,
                      width: 12,
                      height: 6,
                      borderLeft: '3px solid var(--on-accent)',
                      borderBottom: '3px solid var(--on-accent)',
                      transform: 'rotate(-45deg)',
                    }}
                  />
                </div>
                <div>
                  <div
                    className='display lh-100'
                    style={{ fontSize: 28, letterSpacing: 0 }}
                  >
                    {t('booked')}
                  </div>
                  <div className='muted' style={{ fontSize: 13 }}>
                    {t('confirmation', { email: isolate(user(ME.user)!.email) })}
                  </div>
                </div>
              </div>
              <Link
                href='/user/sessions/me'
                className='btn-ghost plain'
                style={{
                  background: 'var(--surface-2)',
                  textAlign: 'center',
                  padding: 13,
                  fontSize: 14,
                }}
              >
                {t('viewMine')}
              </Link>
              <button
                type='button'
                className='linkbtn'
                style={{ color: 'var(--warn)', textAlign: 'center' }}
                onClick={() => setBooked(false)}
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
              >
                <span className='muted' style={{ fontSize: 14 }}>
                  {x.spots(s)}
                </span>
                <span className='display' style={{ fontSize: 36, letterSpacing: 0 }}>
                  {x.price(s.price)}
                </span>
              </div>
              {guest ? (
                <Link
                  href={`/login?callbackUrl=/user/sessions/${s.id}`}
                  className='btn block'
                  style={{ padding: 16 }}
                >
                  {t('logInToBook')}
                </Link>
              ) : (
                <button
                  type='button'
                  className='btn block'
                  style={{ padding: 16 }}
                  onClick={() => setBooked(true)}
                >
                  {s.type === 'group' ? t('reserve') : t('book')}
                </button>
              )}
              <div className='dim' style={{ fontSize: 12, textAlign: 'center' }}>
                {t('freeCancel')}
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
