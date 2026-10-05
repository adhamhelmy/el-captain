'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SectionHead, Stats } from '@/components/ui';
import { bookings, coaches, session, user, type CoachStatus } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const x = useSessionText();
  const [status, setStatus] = useState<Record<number, CoachStatus>>({}); // Mock until wired up: PUT /api/admin/coaches/[id]
  const statusOf = (id: number) => status[id] ?? coaches.find((c) => c.id === id)!.status;
  const pending = coaches.filter((c) => statusOf(c.id) === 'pending');
  const recent = bookings.filter((b) => b.at);

  return (
    <div className='page stack' style={{ gap: 36 }}>
      <div>
        <div className='muted' style={{ fontSize: 14 }}>
          {t('overview')}
        </div>
        <div className='title'>{t('dashboard')}</div>
      </div>
      {/* Mock until wired up: real platform stats from GET /api/admin/dashboard */}
      <Stats
        items={[
          ['1,284', t('stats.totalUsers')],
          [coaches.filter((c) => statusOf(c.id) === 'active').length + 33, t('stats.activeCoaches')],
          ['212', t('stats.sessionsWeek')],
          [x.price(1532500), t('stats.gross30')],
        ]}
      />
      <div
        className='grid-2'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))' }}
      >
        <div>
          <SectionHead title={t('pendingCoaches')} href='/admin/coaches' link={t('allCoaches')} />
          <div className='stack' style={{ gap: 10 }}>
            {pending.map((c) => (
              <div key={c.id} className='row' style={{ gap: 12, padding: '14px 18px' }}>
                <Link href={`/admin/coaches/${c.id}`} className='plain'>
                  <div dir='auto' style={{ fontWeight: 700, fontSize: 15 }}>
                    {x.name(c)}
                  </div>
                  <div className='muted' style={{ fontSize: 13 }}>
                    {t('applied', { specialty: x.category(c.specialty), date: x.monthYear(c.joined) })}
                  </div>
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type='button'
                    className='btn'
                    style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13 }}
                    onClick={() => setStatus({ ...status, [c.id]: 'active' })}
                  >
                    {t('approve')}
                  </button>
                  <button
                    type='button'
                    className='btn-ghost sm'
                    style={{ color: 'var(--text-2)', fontWeight: 400 }}
                    onClick={() => setStatus({ ...status, [c.id]: 'rejected' })}
                  >
                    {t('reject')}
                  </button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <div className='muted' style={{ fontSize: 14, padding: '16px 0' }}>
                {t('noneWaiting')}
              </div>
            )}
          </div>
        </div>
        <div>
          <div className='h2' style={{ marginBottom: 14 }}>
            {t('recentBookings')}
          </div>
          <div className='card' style={{ padding: 0, borderRadius: 14 }}>
            {recent.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 14,
                }}
              >
                {/* "<user> booked <session>" reads in the same order in Arabic («<user> حجز <session>»). */}
                <div>
                  <Link
                    href={`/admin/users/${b.userId}`}
                    className='plain'
                    style={{ fontWeight: 600 }}
                  >
                    <bdi>{user(b.userId)!.name}</bdi>
                  </Link>
                  <span className='muted'> {t('booked')} </span>
                  <Link
                    href={`/admin/sessions/${b.sessionId}`}
                    className='plain'
                    style={{ fontWeight: 600 }}
                  >
                    <bdi>{session(b.sessionId)!.title}</bdi>
                  </Link>
                </div>
                <span className='dim' style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                  {x.ago(b.at!)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
