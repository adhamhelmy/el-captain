'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { SessionForm } from '@/components/SessionForm';
import { PhaseTag, TypeTag } from '@/components/sessions';
import { Avatar, Back, Field, initialsOf, Stats } from '@/components/ui';
import { getOnboarding } from '@/lib/client/coach-api';
import { cancelSession, getSession, listAttendees, listVenues } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { AttendeeDTO, SessionDetailDTO, SportDTO, VenueDTO } from '@/lib/server/dto';
import { sessionPhase } from '@/lib/shared/session-rules';
import onb from '@/components/onboarding.module.css';
import detail from '../../../detail.module.css';
import styles from './page.module.css';

export default function CoachSessionPage() {
  const t = useTranslations('coachSession');
  const tl = useTranslations('session');
  const te = useTranslations('errors');
  const l = useSessionLabels();
  const { id } = useParams<{ id: string }>();
  const me = useSession().data?.user.id;
  const [s, setS] = useState<SessionDetailDTO | null | undefined>(undefined);
  const [roster, setRoster] = useState<AttendeeDTO[]>([]);
  const [editing, setEditing] = useState(false);
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [venues, setVenues] = useState<VenueDTO[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const own = !!s && s.coach.id === me;

  useEffect(() => {
    getSession(id)
      .then((r) => setS(r.ok ? r.data : null))
      .catch(() => setS(null));
  }, [id]);

  useEffect(() => {
    if (!own) return;
    listAttendees(id)
      .then((r) => r.ok && setRoster(r.data))
      .catch(() => setRoster([]));
  }, [id, own]);

  useEffect(() => {
    if (!editing) return;
    getOnboarding().then((r) => r.ok && setSports(r.data.coach.sports.filter((x) => x.status === 'APPROVED')));
    listVenues().then((r) => r.ok && setVenues(r.data.filter((v) => !v.archived)));
  }, [editing]);

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
    <div className={`page detail ${styles.page}`}>
      <Back href={own ? '/coach/sessions/me' : '/coach/sessions'}>{t('back')}</Back>
      <div className={`hero between ${detail.hero} ${styles.hero}`}>
        <div>
          <div className={detail.tags}>
            <TypeTag type={s.type} />
            <PhaseTag s={s} />
          </div>
          <div className={`display ${detail.title}`} dir='auto'>
            {l.title(s)}
          </div>
          <div className={`muted ${detail.sub}`}>
            <bdi>{s.coach.name}</bdi> · {l.when(s.startsAt)} · <bdi>{s.venue.name}</bdi>
          </div>
        </div>
        {own && phase === 'upcoming' && (
          <div className={detail.actions}>
            {s.type === 'GROUP' && (
              <button type='button' className='btn-ghost' onClick={() => setEditing(!editing)}>
                {t('edit')}
              </button>
            )}
            <button type='button' className='btn-ghost danger' onClick={() => setCancelling(!cancelling)}>
              {t('cancelSession')}
            </button>
          </div>
        )}
      </div>
      {phase === 'cancelled' && s.cancelReason && (
        <div dir='auto' className='muted'>
          {tl('reason', { reason: s.cancelReason })}
        </div>
      )}
      {cancelling && (
        <div className='card stack'>
          <div className='h3'>{t('cancelTitle')}</div>
          <div className='muted'>{t('cancelHint')}</div>
          <Field label={t('reason')}>
            <textarea className='input' rows={3} dir='auto' value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className='chips'>
            <button type='button' className='btn-ghost' onClick={() => setCancelling(false)}>
              {t('keep')}
            </button>
            <button type='button' className='btn-ghost danger' onClick={cancel}>
              {t('confirmCancel')}
            </button>
          </div>
        </div>
      )}
      {editing && (
        <SessionForm
          session={s}
          sports={sports}
          venues={venues}
          onClose={() => setEditing(false)}
          onSaved={([saved]) => {
            setS({ ...saved, bookedByMe: false });
            setEditing(false);
          }}
        />
      )}
      {error && <div className={onb.error}>{error}</div>}
      <div className={styles.stats}>
        <Stats
          small
          items={[
            [s.type === 'PRIVATE' ? l.oneToOne() : l.fill(s), t('booked')],
            [l.price(s.price), t('price')],
            [l.minutes(s.durationMin), t('duration')],
            own ? [l.price(s.price * s.booked), t('earnings')] : [s.level ? l.level(s.level) : '—', t('level')],
          ]}
        />
      </div>
      <div className={`grid-2 ${styles.columns}`}>
        <div>
          <div className={`h3 ${detail.headingSm}`}>{t('description')}</div>
          <div className={`muted ${detail.description}`} dir='auto'>
            {s.description || '—'}
          </div>
        </div>
        {own ? (
          <div>
            <div className={`h3 ${detail.headingSm}`}>{t('roster')}</div>
            <div className={`stack ${detail.list}`}>
              {roster.map((a) => (
                <Link key={a.bookingId} href={`/coach/users/${a.memberId}`} className={`row ${detail.attendee}`}>
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
        ) : (
          <div className={`card muted ${styles.notYours}`}>{t('notYours')}</div>
        )}
      </div>
    </div>
  );
}
