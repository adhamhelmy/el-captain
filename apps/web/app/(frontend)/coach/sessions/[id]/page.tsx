'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { SessionDrawer } from '@/components/SessionDrawer';
import { PhaseTag, SessionCover, TypeTag } from '@/components/sessions';
import { Avatar, Back, Field, initialsOf, Tag } from '@/components/ui';
import { getOnboarding } from '@/lib/client/coach-api';
import { markCash } from '@/lib/client/payment-api';
import { cssVars } from '@/lib/client/css-vars';
import { cancelSession, getSession, listAttendees, listVenues } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { AttendeeDTO, SessionDetailDTO, SportDTO, VenueDTO } from '@/lib/server/dto';
import { endsAt, sessionPhase } from '@/lib/shared/session-rules';
import onb from '@/components/onboarding.module.css';
import styles from './page.module.css';

/**
 * How a booked member pays. Cash is the coach's to mark once the session starts: paid, or not paid
 * (members with unpaid cash sessions can't choose cash again).
 */
function AttendeePayment({ a, started, onMarked }: Readonly<{ a: AttendeeDTO; started: boolean; onMarked: (status: 'PAID' | 'FAILED') => void }>) {
  const t = useTranslations('coachSession');
  const ts = useTranslations('session');
  const [busy, setBusy] = useState(false);
  const p = a.payment;
  if (!p) return null;
  if (p.method !== 'cash') return <span className={styles.method}>{ts(`method.${p.method}`)}</span>;
  const mark = async (paid: boolean) => {
    setBusy(true);
    const r = await markCash(p.id, paid);
    setBusy(false);
    if (r.ok) onMarked(r.data.status);
  };
  if (!started) return <span className={styles.method}>{t('cashAtSession')}</span>;
  return (
    <span className={styles.cash}>
      <button type='button' className={p.status === 'PAID' ? styles.cashOn : ''} disabled={busy} onClick={() => mark(true)}>
        {t('cashPaid')}
      </button>
      <button type='button' className={p.status === 'FAILED' ? styles.cashOff : ''} disabled={busy} onClick={() => mark(false)}>
        {t('cashUnpaid')}
      </button>
    </span>
  );
}

export default function CoachSessionPage() {
  const t = useTranslations('coachSession');
  const tl = useTranslations('session');
  const tv = useTranslations('venues');
  const te = useTranslations('errors');
  const l = useSessionLabels();
  const { id } = useParams<{ id: string }>();
  const me = useSession().data?.user.id;
  const [s, setS] = useState<SessionDetailDTO | null | undefined>(undefined);
  const [roster, setRoster] = useState<AttendeeDTO[]>([]);
  const [editing, setEditing] = useState(false);
  const [sports, setSports] = useState<SportDTO[] | null>(null);
  const [venues, setVenues] = useState<VenueDTO[] | null>(null);
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
    getOnboarding()
      .then((r) => setSports(r.ok ? r.data.coach.sports.filter((x) => x.status === 'APPROVED') : []))
      .catch(() => setSports([]));
    listVenues()
      .then((r) => setVenues(r.ok ? r.data.filter((v) => !v.archived) : []))
      .catch(() => setVenues([]));
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

  let levelLabel = s.level ? l.level(s.level) : '—';
  if (s.type === 'PRIVATE') levelLabel = l.oneToOne();

  const info: [string, React.ReactNode, React.ReactNode][] = [
    [
      t('when'),
      `${l.day(s.startsAt)} ${l.dayMonth(s.startsAt)}`,
      t('timeRange', { start: l.time(s.startsAt), end: l.time(endsAt(s.startsAt, s.durationMin)) }),
    ],
    [
      t('where'),
      <bdi key='v'>{s.venue.name}</bdi>,
      <>
        <bdi>{tv('line', { address: s.venue.address, city: s.venue.city })}</bdi>
        {s.venue.mapUrl && (
          <>
            {' · '}
            <a href={s.venue.mapUrl} target='_blank' rel='noopener noreferrer'>
              {tv('map')}
            </a>
          </>
        )}
      </>,
    ],
    [t('level'), levelLabel, l.minutes(s.durationMin)],
    [t('price'), l.price(s.price), t('paidAtSession')],
  ];

  return (
    <div className={`page ${styles.page}`}>
      <Back href={own ? '/coach/sessions/me' : '/coach/sessions'}>{own ? t('backToMine') : t('back')}</Back>
      <SessionCover url={s.coverUrl} />

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.tags}>
            <TypeTag type={s.type} />
            {phase === 'cancelled' ? <PhaseTag s={s} /> : <Tag kind='past'>{l.sport(s.sport)}</Tag>}
          </div>
          <h1 className={styles.title}>
            <bdi>{l.title(s)}</bdi>
          </h1>
          {!own && (
            <div className='muted'>
              <bdi>{s.coach.name}</bdi>
            </div>
          )}
        </div>
        {own && phase === 'upcoming' && (
          <div className={styles.actions}>
            {s.type === 'GROUP' && (
              <button type='button' className='btn-ghost' onClick={() => setEditing(true)}>
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
      {error && <div className={onb.error}>{error}</div>}

      <div className={styles.strip}>
        {info.map(([label, value, sub]) => (
          <div key={label} className={styles.cell}>
            <div className={styles.cellLabel}>{label}</div>
            <div className={styles.cellValue}>{value}</div>
            <div className={styles.cellSub}>{sub}</div>
          </div>
        ))}
      </div>

      {s.description && (
        <div dir='auto' className={`muted ${styles.description}`}>
          {s.description}
        </div>
      )}

      {own ? (
        <div className={styles.booked}>
          <div className={styles.bookedHead}>
            <h2 className={styles.bookedTitle}>{t('bookedOf', { booked: s.booked, capacity: s.capacity })}</h2>
            {s.type === 'GROUP' && phase === 'upcoming' && <span className={styles.left}>{l.spots(s)}</span>}
          </div>
          <div className={styles.track}>
            <div className={styles.trackFill} ref={cssVars({ fill: s.capacity ? Math.min(s.booked / s.capacity, 1) : 0 })} />
          </div>
          {roster.length === 0 && <div className='muted'>{t('noBookings')}</div>}
          <div className={styles.attendees}>
            {roster.map((a) => (
              <div key={a.bookingId} className={styles.attendee}>
                <Link href={`/coach/users/${a.memberId}`} className={styles.attendeeLink}>
                  <Avatar initials={initialsOf(a.name)} size={34} />
                  <span className={styles.attendeeText}>
                    <bdi className={styles.attendeeName}>{a.name}</bdi>
                    <span className={styles.attendeeSub}>{t('bookedOn', { date: l.dayMonth(a.bookedAt) })}</span>
                  </span>
                </Link>
                <AttendeePayment
                  a={a}
                  started={new Date(s.startsAt) <= new Date()}
                  onMarked={(status) =>
                    setRoster((r) => r.map((x) => (x.bookingId === a.bookingId && x.payment ? { ...x, payment: { ...x.payment, status } } : x)))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`card muted ${styles.notYours}`}>{t('notYours')}</div>
      )}

      {editing && sports && venues && (
        <SessionDrawer
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
    </div>
  );
}
