'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Avatar, Back, Stats, Tag, TypeTag } from '@/components/ui';
import { attendees, fill, ME, session } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import detail from '../../../detail.module.css';
import styles from './page.module.css';

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
    <div className={`page detail ${styles.page}`}>
      <Back href={own ? '/coach/sessions/me' : '/coach/sessions'}>
        {t('back')}
      </Back>
      <div className={`hero between ${detail.hero} ${styles.hero}`}>
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
            <bdi>{x.coachName(s)}</bdi> · {x.when(s)}
          </div>
        </div>
        {own && status === 'upcoming' && (
          <button type='button' className='btn-ghost danger' onClick={() => setCancelled(true)}>
            {t('cancelSession')}
          </button>
        )}
      </div>
      <div className={styles.stats}>
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
      <div className={`grid-2 ${styles.columns}`}>
        <div>
          <div className={`h3 ${detail.headingSm}`}>
            {t('description')}
          </div>
          <div className={`muted ${detail.description}`} dir='auto'>
            {s.description}
          </div>
        </div>
        {own ? (
          <div>
            <div className={`h3 ${detail.headingSm}`}>
              {t('roster')}
            </div>
            <div className={`stack ${detail.list}`}>
              {roster.map((u) => (
                <Link
                  key={u.id}
                  href={`/coach/users/${u.id}`}
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
        ) : (
          <div className={`card muted ${styles.notYours}`}>
            {t('notYours')}
          </div>
        )}
      </div>
    </div>
  );
}
