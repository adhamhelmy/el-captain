'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PhaseTag, TypeTag } from '@/components/sessions';
import { Avatar, Back, Field, initialsOf, Stats } from '@/components/ui';
import { cancelSession, getSession, listAttendees } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { AttendeeDTO, SessionDetailDTO } from '@/lib/server/dto';
import { sessionPhase } from '@/lib/shared/session-rules';
import onb from '@/components/onboarding.module.css';
import detail from '../../../detail.module.css';
import styles from './page.module.css';

export default function AdminSessionPage() {
  const t = useTranslations('admin');
  const tcs = useTranslations('coachSession');
  const tl = useTranslations('session');
  const te = useTranslations('errors');
  const l = useSessionLabels();
  const { id } = useParams<{ id: string }>();
  const [s, setS] = useState<SessionDetailDTO | null | undefined>(undefined);
  const [roster, setRoster] = useState<AttendeeDTO[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getSession(id)
      .then((r) => setS(r.ok ? r.data : null))
      .catch(() => setS(null));
    listAttendees(id).then((r) => r.ok && setRoster(r.data));
  }, [id]);

  if (s === null) notFound();
  if (!s) return null;
  const phase = sessionPhase(s);

  async function cancel() {
    setError('');
    const r = await cancelSession(id, reason);
    if (!r.ok) return setError(te(r.code === 'session_closed' ? 'session_closed' : 'generic'));
    setS({ ...r.data, bookedByMe: false });
    setRoster([]);
    setCancelling(false);
  }

  return (
    <div className={`page detail stack ${detail.page} ${styles.page}`}>
      <Back href='/admin/sessions'>{t('backSessions')}</Back>
      <div className={`hero between ${detail.hero}`}>
        <div>
          <div className={detail.tags}>
            <TypeTag type={s.type} />
            <PhaseTag s={s} />
          </div>
          <div className={`display ${detail.title}`} dir='auto'>
            {l.title(s)}
          </div>
          <div className={`muted ${detail.sub}`}>
            <Link href={`/admin/coaches/${s.coach.id}`} className={`plain ${detail.link}`}>
              <bdi>{s.coach.name}</bdi>
            </Link>{' '}
            · {l.when(s.startsAt)} · <bdi>{s.venue.name}</bdi>
          </div>
        </div>
        {phase === 'upcoming' && (
          <button type='button' className='btn-ghost danger' onClick={() => setCancelling(!cancelling)}>
            {t('cancelSession')}
          </button>
        )}
      </div>
      {phase === 'cancelled' && s.cancelReason && (
        <div dir='auto' className='muted'>
          {tl('reason', { reason: s.cancelReason })}
        </div>
      )}
      {cancelling && (
        <div className='card stack'>
          <div className='h3'>{tcs('cancelTitle')}</div>
          <div className='muted'>{tcs('cancelHint')}</div>
          <Field label={tcs('reason')}>
            <textarea className='input' rows={3} dir='auto' value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className='chips'>
            <button type='button' className='btn-ghost' onClick={() => setCancelling(false)}>
              {tcs('keep')}
            </button>
            <button type='button' className='btn-ghost danger' onClick={cancel}>
              {tcs('confirmCancel')}
            </button>
          </div>
        </div>
      )}
      {error && <div className={onb.error}>{error}</div>}
      <Stats
        small
        items={[
          [s.type === 'PRIVATE' ? l.oneToOne() : l.fill(s), t('stats.booked')],
          [l.price(s.price), t('stats.price')],
          [l.price(s.price * s.booked), t('stats.gross')],
          [l.minutes(s.durationMin), s.level ? l.level(s.level) : l.oneToOne()],
        ]}
      />
      <div className='grid-2'>
        <div>
          <div className={`h3 ${detail.headingSm}`}>{t('description')}</div>
          <div className={`muted ${detail.description}`} dir='auto'>
            {s.description || '—'}
          </div>
        </div>
        <div>
          <div className={`h3 ${detail.headingSm}`}>{t('attendees')}</div>
          <div className={`stack ${detail.list}`}>
            {roster.map((a) => (
              <Link key={a.bookingId} href={`/admin/users/${a.memberId}`} className={`row ${detail.attendee}`}>
                <Avatar initials={initialsOf(a.name)} size={32} />
                <div dir='auto' className={detail.attendeeName}>
                  {a.name}
                </div>
                <span className={`muted ${detail.email}`} dir='ltr'>
                  {a.email}
                </span>
              </Link>
            ))}
            {roster.length === 0 && <div className={`muted ${detail.empty}`}>{t('noBookings')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
