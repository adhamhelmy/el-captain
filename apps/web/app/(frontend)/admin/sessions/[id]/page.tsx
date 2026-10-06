'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag, TypeTag } from '@/components/ui';
import { attendees, fill, session } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import detail from '../../../detail.module.css';
import styles from './page.module.css';

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
    <div className={`page detail stack ${detail.page} ${styles.page}`}>
      <Back href='/admin/sessions'>{t('backSessions')}</Back>
      <div className={`hero between ${detail.hero}`}>
        <div>
          <div className={detail.tags}>
            <TypeTag s={s} />
            <Tag kind={status}>{tst(status)}</Tag>
          </div>
          <div
            className={`display ${detail.title}`}
            dir='auto'
          >
            {s.title}
          </div>
          <div className={`muted ${detail.sub}`}>
            <Link href={`/admin/coaches/${s.coachId}`} className={`plain ${detail.link}`}>
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
          <div className={`h3 ${detail.headingSm}`}>
            {t('description')}
          </div>
          <div className={`muted ${detail.description}`} dir='auto'>
            {s.description}
          </div>
        </div>
        <div>
          <div className={`h3 ${detail.headingSm}`}>
            {t('attendees')}
          </div>
          <div className={`stack ${detail.list}`}>
            {roster.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className={`row ${detail.attendee}`}
              >
                <Avatar initials={u.initials} size={32} />
                <div dir='auto' className={detail.attendeeName}>
                  {u.name}
                </div>
                <span className={`muted ${detail.email}`} dir='ltr'>
                  {u.email}
                </span>
              </Link>
            ))}
            {roster.length === 0 && (
              <div className={`muted ${detail.empty}`}>
                {t('noBookings')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
