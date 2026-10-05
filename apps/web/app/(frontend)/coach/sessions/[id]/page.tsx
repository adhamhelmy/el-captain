'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Avatar, Back, Stats, Tag, TypeTag } from '@/components/ui';
import { attendees, fill, ME, session } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

export default function CoachSessionPage() {
  const t = useTranslations('coachSession');
  const tst = useTranslations('status');
  const x = useSessionText();
  const s = session(useParams<{ id: string }>().id);
  const [cancelled, setCancelled] = useState(false);
  if (!s) notFound();
  const own = s.coachId === ME.coach;
  const status = cancelled ? 'cancelled' : s.status;
  const roster = own ? attendees(s.id) : [];

  return (
    <div className='page detail' style={{ maxWidth: 1080 }}>
      <Back href={own ? '/coach/sessions/me' : '/coach/sessions'}>
        {t('back')}
      </Back>
      <div className='hero between' style={{ marginTop: 20, gap: 20 }}>
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
            <bdi>{x.coachName(s)}</bdi> · {x.when(s)}
          </div>
        </div>
        {own && status === 'upcoming' && (
          <button type='button' className='btn-ghost danger' onClick={() => setCancelled(true)}>
            {t('cancelSession')}
          </button>
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        <Stats
          small
          items={[
            [s.type === 'private' ? x.oneToOne() : fill(s), t('booked')],
            [x.price(s.price), t('price')],
            [x.minutes(s.duration), t('duration')],
            own
              ? [x.price(s.price * s.booked), t('earnings')]
              : [x.level(s.level), t('level')],
          ]}
        />
      </div>
      <div className='grid-2' style={{ gap: 32, marginTop: 32 }}>
        <div>
          <div className='h3' style={{ marginBottom: 10 }}>
            {t('description')}
          </div>
          <div className='muted' dir='auto' style={{ fontSize: 15, lineHeight: 1.7 }}>
            {s.description}
          </div>
        </div>
        {own ? (
          <div>
            <div className='h3' style={{ marginBottom: 10 }}>
              {t('roster')}
            </div>
            <div className='stack' style={{ gap: 8 }}>
              {roster.map((u) => (
                <Link
                  key={u.id}
                  href={`/coach/users/${u.id}`}
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
        ) : (
          <div
            className='card muted'
            style={{ padding: 20, borderRadius: 14, fontSize: 14, lineHeight: 1.6 }}
          >
            {t('notYours')}
          </div>
        )}
      </div>
    </div>
  );
}
