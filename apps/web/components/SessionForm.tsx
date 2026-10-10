'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Field } from '@/components/ui';
import { createSession, updateSession, type SessionBody } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { SessionDTO, SportDTO, VenueDTO } from '@/lib/server/dto';
import { fromWallClock, wallClock } from '@/lib/shared/app-time';
import { sportName } from '@/lib/shared/coach-rules';
import {
  CAPACITY,
  DURATION,
  MAX_REPEAT_WEEKS,
  PRICE_MAX,
  SESSION_LEVELS,
  sessionProblems,
  TEXT_MAX,
  TITLE_MAX,
  type SessionField,
} from '@/lib/shared/session-rules';
import onb from './onboarding.module.css';
import styles from './SessionForm.module.css';

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

/** Publish a group session (optionally weekly) or edit one. Each rule shows under its field and turns red when broken. */
export function SessionForm({
  session,
  sports,
  venues,
  onSaved,
  onClose,
}: Readonly<{ session?: SessionDTO; sports: SportDTO[]; venues: VenueDTO[]; onSaved: (saved: SessionDTO[]) => void; onClose: () => void }>) {
  const t = useTranslations('schedule');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const locale = useLocale();
  const l = useSessionLabels();
  const [d, setD] = useState<Draft>(() => (session ? fromSession(session) : blank(sports, venues)));
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
    setD({ ...d, ...patch });
    setServerBad([]);
  };
  /** A rule turns red once its field has a value, or after a save attempt. */
  const bad = (f: SessionField, value: string) => serverBad.includes(f) || (problems.includes(f) && (tried || value.trim() !== ''));
  const cls = (f: SessionField, value: string) => (bad(f, value) ? 'input on-page invalid' : 'input on-page');
  const rule = (f: SessionField, value: string, text: string) => <div className={bad(f, value) ? onb.error : `muted ${onb.hint}`}>{text}</div>;

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
      startsAt: draft.startsAt!.toISOString(),
      durationMin: draft.durationMin,
      price: draft.price,
      capacity: draft.capacity,
    };
    const r = session ? await updateSession(session.id, body) : await createSession({ ...body, repeatWeeks: draft.repeatWeeks });
    setBusy(false);
    if (!r.ok) {
      setServerBad(r.fields ?? []);
      return setError(te(r.code === 'invalid_session' || r.code === 'session_closed' ? r.code : 'generic'));
    }
    onSaved(Array.isArray(r.data) ? r.data : [r.data]);
  }

  if (!sports.length) return <div className='card muted'>{t('noSports')}</div>;
  if (!venues.length)
    return (
      <div className='card muted'>
        <Link href='/coach/profile'>{t('noVenues')}</Link>
      </div>
    );

  return (
    <div className='card stack'>
      <div className='h3'>{session ? t('editSession') : t('newSession')}</div>
      {locked && <div className={`muted ${onb.hint}`}>{t('lockedHint')}</div>}
      <div className={styles.fields}>
        <Field label={t('fieldTitle')} className={styles.wide}>
          <input
            className={cls('title', d.title)}
            dir='auto'
            value={d.title}
            onChange={(e) => edit({ title: e.target.value })}
            placeholder={t('titlePlaceholder')}
          />
          {rule('title', d.title, t('rules.title', { max: TITLE_MAX }))}
        </Field>
        <Field label={t('sport')}>
          <select className={cls('sportId', d.sportId)} value={d.sportId} onChange={(e) => edit({ sportId: e.target.value })}>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {sportName(s, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('venue')}>
          <select className={cls('venueId', d.venueId)} value={d.venueId} disabled={locked} onChange={(e) => edit({ venueId: e.target.value })}>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.city}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('level')}>
          <select className='input on-page' value={d.level} onChange={(e) => edit({ level: e.target.value })}>
            {SESSION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {l.level(level)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('date')}>
          <input
            type='date'
            dir='ltr'
            className={cls('startsAt', d.date)}
            disabled={locked}
            min={wallClock(new Date()).date}
            value={d.date}
            onChange={(e) => edit({ date: e.target.value })}
          />
          {rule('startsAt', d.date + d.time, t('rules.startsAt'))}
        </Field>
        <Field label={t('start')}>
          <input
            type='time'
            dir='ltr'
            className={cls('startsAt', d.time)}
            disabled={locked}
            value={d.time}
            onChange={(e) => edit({ time: e.target.value })}
          />
        </Field>
        <Field label={t('duration')}>
          <input
            inputMode='numeric'
            dir='ltr'
            className={cls('durationMin', d.duration)}
            disabled={locked}
            value={d.duration}
            onChange={(e) => edit({ duration: e.target.value })}
          />
          {rule('durationMin', d.duration, t('rules.duration', { min: DURATION.min, max: DURATION.max }))}
        </Field>
        <Field label={t('price')}>
          <input inputMode='numeric' dir='ltr' className={cls('price', d.price)} value={d.price} onChange={(e) => edit({ price: e.target.value })} />
          {rule('price', d.price, t('rules.price', { max: PRICE_MAX }))}
        </Field>
        <Field label={t('capacity')}>
          <input
            inputMode='numeric'
            dir='ltr'
            className={cls('capacity', d.capacity)}
            value={d.capacity}
            onChange={(e) => edit({ capacity: e.target.value })}
          />
          {rule('capacity', d.capacity, t('rules.capacity', { min: CAPACITY.min, max: CAPACITY.max }))}
        </Field>
        {!session && (
          <Field label={t('repeat')}>
            <input
              inputMode='numeric'
              dir='ltr'
              className={cls('repeatWeeks', d.repeat)}
              value={d.repeat}
              onChange={(e) => edit({ repeat: e.target.value })}
            />
            {rule('repeatWeeks', d.repeat, t('rules.repeat', { max: MAX_REPEAT_WEEKS }))}
          </Field>
        )}
        <Field label={t('description')} className={styles.wide}>
          <textarea
            rows={3}
            dir='auto'
            className={cls('description', d.description)}
            value={d.description}
            onChange={(e) => edit({ description: e.target.value })}
          />
          {rule('description', d.description, t('rules.description', { max: TEXT_MAX }))}
        </Field>
      </div>
      <div className={styles.actions}>
        <button type='button' className='btn' disabled={busy} onClick={save}>
          {session ? tc('save') : t('publish')}
        </button>
        <button type='button' className='btn-ghost' onClick={onClose}>
          {tc('cancel')}
        </button>
        {error && <span className={onb.error}>{error}</span>}
      </div>
    </div>
  );
}
