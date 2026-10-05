'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag, TypeTag } from '@/components/ui';
import { attendees, fill, session } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

export default function AdminSessionPage() {
  const t = useTranslations('admin');
  const tst = useTranslations('status');
  const x = useSessionText();
  const s = session(useParams<{ id: string }>().id);
  const [cancelled, setCancelled] = useState(false); // Mock until wired up: DELETE /api/sessions/[id] + refunds
  if (!s) notFound();
  const status = cancelled ? 'cancelled' : s.status;
  const roster = attendees(s.id);

  return (
    <div className='page detail stack' style={{ maxWidth: 1000, gap: 28 }}>
      <Back href='/admin/sessions'>{t('backSessions')}</Back>
      <div className='hero between' style={{ gap: 20 }}>
        <div>
          <div style={{ display: 'flex', gap: 8 }}>
            <TypeTag s={s} />
            <Tag kind={status}>{tst(status)}</Tag>
          </div>
          <div
            className='display'
            dir='auto'
            style={{ fontSize: 'clamp(44px, 6vw, 64px)', lineHeight: 1, marginTop: 14 }}
          >
            {s.title}
          </div>
          <div className='muted' style={{ fontSize: 16, marginTop: 8 }}>
            <Link
              href={`/admin/coaches/${s.coachId}`}
              className='plain'
              style={{ fontWeight: 600 }}
            >
              <bdi>{x.coachName(s)}</bdi>
            </Link>{' '}
            · {x.when(s)}
          </div>
        </div>
        {status === 'upcoming' && (
          <button type='button' className='btn-ghost danger' onClick={() => setCancelled(true)}>
            {t('cancelRefund')}
          </button>
        )}
      </div>
      <Stats
        small
        items={[
          [s.type === 'private' ? x.oneToOne() : fill(s), t('stats.booked')],
          [x.price(s.price), t('stats.price')],
          [x.price(s.price * s.booked), t('stats.gross')],
          [x.minutes(s.duration), x.level(s.level)],
        ]}
      />
      <div className='grid-2'>
        <div>
          <div className='h3' style={{ marginBottom: 10 }}>
            {t('description')}
          </div>
          <div className='muted' dir='auto' style={{ fontSize: 15, lineHeight: 1.7 }}>
            {s.description}
          </div>
        </div>
        <div>
          <div className='h3' style={{ marginBottom: 10 }}>
            {t('attendees')}
          </div>
          <div className='stack' style={{ gap: 8 }}>
            {roster.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className='row'
                style={{
                  justifyContent: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  flexWrap: 'nowrap',
                }}
              >
                <Avatar initials={u.initials} size={32} fontSize={12} />
                <div dir='auto' style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                  {u.name}
                </div>
                <span className='muted' dir='ltr' style={{ fontSize: 13 }}>
                  {u.email}
                </span>
              </Link>
            ))}
            {roster.length === 0 && (
              <div className='muted' style={{ fontSize: 14 }}>
                {t('noBookings')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
