'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Drawer } from '@/components/Drawer';
import { SessionCoverField, type CoverChoice } from '@/components/SessionCoverField';
import { Field } from '@/components/ui';
import { VenueDrawer } from '@/components/VenueDrawer';
import { REPEAT_OPTIONS, summaryValues } from '@/lib/client/repeat-summary';
import { createSession, updateSession, type SessionBody } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { SessionDTO, SportDTO, VenueDTO } from '@/lib/server/dto';
import { fromWallClock, wallClock } from '@/lib/shared/app-time';
import { to12, to24 } from '@/lib/shared/clock12';
import { sportName } from '@/lib/shared/coach-rules';
import { CAPACITY, DURATION, PRICE_MAX, SESSION_LEVELS, sessionProblems, TEXT_MAX, TITLE_MAX, type SessionField } from '@/lib/shared/session-rules';
import onb from './onboarding.module.css';
import styles from './SessionDrawer.module.css';

type Draft = Record<
  'title' | 'description' | 'sportId' | 'venueId' | 'level' | 'date' | 'time' | 'duration' | 'price' | 'capacity' | 'repeat',
  string
>;

const blank = (sports: SportDTO[], venues: VenueDTO[]): Draft => ({
  title: '',
  description: '',
  sportId: sports[0]?.id ?? '',
  venueId: venues[0]?.id ?? '',
  level: 'ALL_LEVELS',
  date: '',
  time: '',
  duration: '60',
  price: '',
  capacity: '12',
  repeat: '1',
});

const fromSession = (s: SessionDTO): Draft => ({
  title: s.title,
  description: s.description ?? '',
  sportId: s.sport.id,
  venueId: s.venue.id,
  level: s.level ?? 'ALL_LEVELS',
  ...wallClock(new Date(s.startsAt)),
  duration: String(s.durationMin),
  price: String(s.price),
  capacity: String(s.capacity),
  repeat: '1',
});

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v));

const SAVE_ERRORS = ['invalid_session', 'session_closed', 'time_conflict'] as const;

/** The list, plus the edited session's own item if it isn't there (an archived venue, a sport no longer approved). */
const withOwn = <T extends { id: string }>(list: T[], own?: T) => (own && !list.some((x) => x.id === own.id) ? [...list, own] : list);

/**
 * The start to send. Unchanged date and time keep the exact instant: on the night clocks go back,
 * 1:30 happens twice and reading it again could move the session by an hour.
 */
function startInstant(session: SessionDTO | undefined, d: Pick<Draft, 'date' | 'time'>, picked: Date) {
  const original = session && wallClock(new Date(session.startsAt));
  const untouched = !!original && original.date === d.date && original.time === d.time;
  return session && untouched ? new Date(session.startsAt).toISOString() : picked.toISOString();
}

/** AM / PM beside the time input. The browser may show the input as 24-hour; this flips the same time. */
function PeriodToggle({ time, disabled, onChange }: Readonly<{ time: string; disabled: boolean; onChange: (time: string) => void }>) {
  const t = useTranslations('schedule');
  const clock = to12(time);
  return (
    <div className={styles.period} role='radiogroup' aria-label={t('period')}>
      {(['AM', 'PM'] as const).map((p) => (
        <button
          key={p}
          type='button'
          role='radio'
          aria-checked={clock?.period === p}
          className={clock?.period === p ? styles.periodOn : ''}
          disabled={disabled || !clock}
          onClick={() => clock && onChange(to24({ ...clock, period: p }))}
        >
          {t(p === 'AM' ? 'am' : 'pm')}
        </button>
      ))}
    </div>
  );
}

type Props = Readonly<{
  session?: SessionDTO;
  sports: SportDTO[];
  venues: VenueDTO[];
  onSaved: (saved: SessionDTO[]) => void;
  onClose: () => void;
  /** A location added from inside the drawer, so the page's own list stays current. */
  onVenueAdded?: (v: VenueDTO) => void;
}>;

/**
 * Publish a group session (once or weekly for a few weeks) or edit one, in a drawer.
 * Each rule shows under its field and turns red when broken; the footer sums up what will be published.
 */
export function SessionDrawer({ session, sports: activeSports, venues: initialVenues, onSaved, onClose, onVenueAdded }: Props) {
  const t = useTranslations('schedule');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const tv = useTranslations('venues');
  const locale = useLocale();
  const f = useFormatter();
  const l = useSessionLabels();
  const [activeVenues, setActiveVenues] = useState(initialVenues);
  // An edited session keeps its own venue and sport in the lists, even if the venue was archived
  // or the sport is no longer approved, so the form never shows something else as selected.
  const venues = withOwn(activeVenues, session?.venue);
  const sports = withOwn(activeSports, session?.sport);
  const [d, setD] = useState<Draft>(() => (session ? fromSession(session) : blank(activeSports, initialVenues)));
  const [addingVenue, setAddingVenue] = useState(false);
  // Null until the coach touches the cover, so an edit leaves it alone.
  const [cover, setCover] = useState<CoverChoice | null>(null);
  const coachId = useSession().data?.user.id ?? '';
  const [tried, setTried] = useState(false);
  const [serverBad, setServerBad] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = !!session && session.booked > 0;

  const draft = {
    title: d.title,
    description: d.description,
    sportId: d.sportId,
    venueId: d.venueId,
    level: d.level,
    startsAt: fromWallClock({ date: d.date, time: d.time }),
    durationMin: num(d.duration),
    price: num(d.price),
    capacity: num(d.capacity),
    repeatWeeks: num(d.repeat),
  };
  const problems = sessionProblems(draft);

  const edit = (patch: Partial<Draft>) => {
    setD((prev) => ({ ...prev, ...patch }));
    setServerBad([]);
  };
  /** A rule turns red once its field has a value, or after a save attempt. */
  const bad = (field: SessionField, value: string) => serverBad.includes(field) || (problems.includes(field) && (tried || value.trim() !== ''));
  const cls = (field: SessionField, value: string) => (bad(field, value) ? 'input invalid' : 'input');
  const rule = (field: SessionField, value: string, text: string) => <div className={bad(field, value) ? onb.error : styles.rule}>{text}</div>;

  async function save() {
    setTried(true);
    if (problems.length) return setError(t('fix'));
    setBusy(true);
    setError('');
    const body: SessionBody = {
      title: draft.title,
      description: draft.description,
      sportId: draft.sportId,
      venueId: draft.venueId,
      level: draft.level,
      startsAt: startInstant(session, d, draft.startsAt!),
      durationMin: draft.durationMin,
      price: draft.price,
      capacity: draft.capacity,
      ...cover?.body,
    };
    const r = session ? await updateSession(session.id, body) : await createSession({ ...body, repeatWeeks: draft.repeatWeeks });
    setBusy(false);
    if (!r.ok) {
      setServerBad(r.fields ?? []);
      return setError(te(SAVE_ERRORS.find((c) => c === r.code) ?? 'generic'));
    }
    onSaved(Array.isArray(r.data) ? r.data : [r.data]);
  }

  const repeat = Number(d.repeat);
  const summary = t('summary', {
    ...summaryValues(d.date, d.time, repeat, {
      weekdayLong: (at) => f.dateTime(at, { weekday: 'long' }),
      day: l.day,
      dayMonth: l.dayMonth,
      time: l.time,
    }),
  });

  let body: React.ReactNode;
  if (!sports.length) body = <div className='muted'>{t('noSports')}</div>;
  else if (!venues.length && !addingVenue)
    body = (
      <div className='muted'>
        <Link href='/coach/venues'>{t('noVenues')}</Link>
      </div>
    );
  else
    body = (
      <>
        {locked && <div className={styles.rule}>{t('lockedHint')}</div>}
        <section className={styles.group}>
          <div className={styles.groupLabel}>{t('groupWhat')}</div>
          <SessionCoverField coachId={coachId} url={cover ? cover.url : (session?.coverUrl ?? null)} onChange={setCover} />
          <Field label={t('fieldTitle')}>
            <input
              className={cls('title', d.title)}
              dir='auto'
              value={d.title}
              onChange={(e) => edit({ title: e.target.value })}
              placeholder={t('titlePlaceholder')}
            />
            {rule('title', d.title, t('rules.title', { max: TITLE_MAX }))}
          </Field>
          <div className={styles.two}>
            <Field label={t('sport')}>
              <select className={cls('sportId', d.sportId)} value={d.sportId} onChange={(e) => edit({ sportId: e.target.value })}>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {sportName(s, locale)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('level')}>
              <select className='input' value={d.level} onChange={(e) => edit({ level: e.target.value })}>
                {SESSION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {l.level(level)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className={styles.group}>
          <div className={styles.groupLabel}>{t('groupWhen')}</div>
          <div className={styles.when}>
            <Field label={t('date')} className={styles.dateField}>
              <input
                type='date'
                dir='ltr'
                className={cls('startsAt', d.date)}
                disabled={locked}
                min={wallClock(new Date()).date}
                value={d.date}
                onChange={(e) => edit({ date: e.target.value })}
              />
            </Field>
            <div className={`${styles.field} ${styles.startField}`}>
              <label htmlFor='session-start' className='label'>
                {t('start')}
              </label>
              <div className={styles.timeRow}>
                <input
                  id='session-start'
                  type='time'
                  dir='ltr'
                  className={cls('startsAt', d.time)}
                  disabled={locked}
                  value={d.time}
                  onChange={(e) => edit({ time: e.target.value })}
                />
                <PeriodToggle time={d.time} disabled={locked} onChange={(time) => edit({ time })} />
              </div>
            </div>
            <Field label={t('minutes')} className={styles.minutesField}>
              <input
                inputMode='numeric'
                dir='ltr'
                className={cls('durationMin', d.duration)}
                disabled={locked}
                value={d.duration}
                onChange={(e) => edit({ duration: e.target.value })}
              />
            </Field>
          </div>
          {rule('startsAt', d.date + d.time, t('rules.startsAt'))}
          {rule('durationMin', d.duration, t('rules.duration', { min: DURATION.min, max: DURATION.max }))}
          {!session && (
            <Field label={t('repeatLabel')}>
              <select className='input' value={d.repeat} onChange={(e) => edit({ repeat: e.target.value })}>
                {REPEAT_OPTIONS.map((weeks) => (
                  <option key={weeks} value={weeks}>
                    {t('repeatOption', { weeks })}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </section>

        <section className={styles.group}>
          <div className={styles.groupLabel}>{t('groupWhere')}</div>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <span className='label'>{t('location')}</span>
              {!locked && (
                <button type='button' className={styles.linkBtn} onClick={() => setAddingVenue(true)}>
                  {tv('newLink')}
                </button>
              )}
            </div>
            <select
              className={cls('venueId', d.venueId)}
              aria-label={t('location')}
              value={d.venueId}
              disabled={locked}
              onChange={(e) => edit({ venueId: e.target.value })}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} · {v.city}
                  {v.archived && ` · ${tv('archived')}`}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.two}>
            <Field label={t('price')}>
              <input
                inputMode='numeric'
                dir='ltr'
                className={cls('price', d.price)}
                value={d.price}
                onChange={(e) => edit({ price: e.target.value })}
              />
              {rule('price', d.price, t('rules.price', { max: PRICE_MAX }))}
            </Field>
            <Field label={t('spots')}>
              <input
                inputMode='numeric'
                dir='ltr'
                className={cls('capacity', d.capacity)}
                value={d.capacity}
                onChange={(e) => edit({ capacity: e.target.value })}
              />
              {rule('capacity', d.capacity, t('rules.capacity', { min: CAPACITY.min, max: CAPACITY.max }))}
            </Field>
          </div>
          <Field label={t('descriptionOptional')}>
            <textarea
              rows={3}
              dir='auto'
              className={cls('description', d.description)}
              placeholder={t('descriptionPlaceholder')}
              value={d.description}
              onChange={(e) => edit({ description: e.target.value })}
            />
            {rule('description', d.description, t('rules.description', { max: TEXT_MAX }))}
          </Field>
        </section>
      </>
    );

  const ready = sports.length > 0 && venues.length > 0;

  return (
    <>
      <Drawer
        wide
        title={session ? t('editSession') : t('newSession')}
        onClose={onClose}
        footer={
          ready && (
            <>
              {!session && <div className={styles.summary}>{summary}</div>}
              {error && <div className={onb.error}>{error}</div>}
              <div className={styles.actions}>
                <button type='button' className={`btn ${styles.publish}`} disabled={busy} onClick={save}>
                  {session ? tc('save') : t('publishCount', { count: Number.isFinite(repeat) ? repeat : 1 })}
                </button>
                <button type='button' className='btn-ghost' onClick={onClose}>
                  {tc('cancel')}
                </button>
              </div>
            </>
          )
        }
      >
        {body}
      </Drawer>
      {addingVenue && (
        <VenueDrawer
          onClose={() => setAddingVenue(false)}
          onSaved={({ venue }) => {
            setActiveVenues((list) => [...list, venue]);
            edit({ venueId: venue.id });
            onVenueAdded?.(venue);
            setAddingVenue(false);
          }}
        />
      )}
    </>
  );
}
