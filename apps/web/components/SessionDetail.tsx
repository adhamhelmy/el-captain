'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, TypeTag } from '@/components/ui';
import { bookings, coach, ME, session, spotsLabel, user, when } from '@/lib/mock';

/** Session detail. Guests see the coach and price, and are sent to log in to book. */
export function SessionDetail({ guest }: Readonly<{ guest?: boolean }>) {
  const s = session(useParams<{ id: string }>().id);
  const [booked, setBooked] = useState(
    () => !guest && bookings.some((b) => b.userId === ME.user && b.sessionId === s?.id),
  );
  if (!s) notFound();
  const c = coach(s.coachId)!;

  return (
    <div className='page detail' style={{ maxWidth: 1080 }}>
      <Back href={guest ? '/sessions' : '/user/sessions'}>All sessions</Back>
      <div className='hero' style={{ marginTop: 20 }}>
        <TypeTag s={s} />
        <div
          className='display'
          style={{ fontSize: 'clamp(44px, 6vw, 68px)', lineHeight: 1, marginTop: 14 }}
        >
          {s.title}
        </div>
        <div className='muted' style={{ fontSize: 16, marginTop: 8 }}>
          {when(s)}
        </div>
      </div>
      <div className='grid-2' style={{ gap: 32, marginTop: 32 }}>
        <div className='stack' style={{ gap: 28 }}>
          <div className='chips'>
            {[s.level, `${s.duration} min`, s.category].map((x) => (
              <span key={x} className='pill'>
                {x}
              </span>
            ))}
          </div>
          <div>
            <div className='h3' style={{ marginBottom: 10 }}>
              WHAT TO EXPECT
            </div>
            <div className='muted' style={{ fontSize: 15, lineHeight: 1.7 }}>
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
            <Avatar initials={c.initials} size={48} fontSize={16} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              <div className='muted' style={{ fontSize: 13 }}>
                {c.specialty} coach · {c.rating} ★ ({c.reviews})
              </div>
            </div>
            <span style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>Profile →</span>
          </Link>
        </div>
        <div className='card stack' style={{ padding: 24, position: 'sticky', top: 24, gap: 16 }}>
          {s.status === 'past' && (
            <div className='muted' style={{ fontSize: 14 }}>
              This session has ended.
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
                    className='display'
                    style={{ fontSize: 28, lineHeight: 1, letterSpacing: 0 }}
                  >
                    YOU&apos;RE BOOKED
                  </div>
                  <div className='muted' style={{ fontSize: 13 }}>
                    Confirmation sent to {user(ME.user)!.email}
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
                View my sessions
              </Link>
              <button
                type='button'
                className='linkbtn'
                style={{ color: 'var(--warn)', textAlign: 'center' }}
                onClick={() => setBooked(false)}
              >
                Cancel booking
              </button>
            </>
          ) : (
            <>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
              >
                <span className='muted' style={{ fontSize: 14 }}>
                  {spotsLabel(s)}
                </span>
                <span className='display' style={{ fontSize: 36, letterSpacing: 0 }}>
                  ${s.price}
                </span>
              </div>
              {guest ? (
                <Link
                  href={`/login?callbackUrl=/user/sessions/${s.id}`}
                  className='btn block'
                  style={{ padding: 16 }}
                >
                  Log in to book
                </Link>
              ) : (
                <button
                  type='button'
                  className='btn block'
                  style={{ padding: 16 }}
                  onClick={() => setBooked(true)}
                >
                  {s.type === 'group' ? 'Reserve spot' : 'Book session'}
                </button>
              )}
              <div className='dim' style={{ fontSize: 12, textAlign: 'center' }}>
                Free cancellation up to 12 hours before
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
