'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Field } from '@/components/ui';
import { sendRequest } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { PublicCoachDTO } from '@/lib/server/dto';
import { fromWallClock, wallClock } from '@/lib/shared/app-time';
import { sportName } from '@/lib/shared/coach-rules';
import { TEXT_MAX } from '@/lib/shared/session-rules';
import onb from './onboarding.module.css';

type RequestField = 'venueId' | 'sportId' | 'startsAt' | 'message';

/** A member asks this coach for a private session. Rules show beside each field; Send explains what's wrong instead of being disabled. */
export function PrivateRequestForm({ coach, onSent }: Readonly<{ coach: PublicCoachDTO; onSent: () => void }>) {
  const t = useTranslations('coachProfile');
  const te = useTranslations('errors');
  const locale = useLocale();
  const l = useSessionLabels();
  const [venueId, setVenueId] = useState(coach.venues[0]?.id ?? '');
  const [sportId, setSportId] = useState(coach.sports[0]?.id ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [bad, setBad] = useState<RequestField[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const startsAt = fromWallClock({ date, time });
  const startsBad = (date !== '' || time !== '') && (!startsAt || startsAt <= new Date());

  async function send() {
    const problems: RequestField[] = [
      ...(venueId ? [] : (['venueId'] as const)),
      ...(sportId ? [] : (['sportId'] as const)),
      ...(!startsAt || startsAt <= new Date() ? (['startsAt'] as const) : []),
      ...(message.trim().length > TEXT_MAX ? (['message'] as const) : []),
    ];
    setBad(problems);
    if (problems.length) return setError(t('fix'));
    setBusy(true);
    setError('');
    const r = await sendRequest({ coachId: coach.id, venueId, sportId, startsAt: startsAt!.toISOString(), message });
    setBusy(false);
    if (r.ok) return onSent();
    setBad((r.fields ?? []) as RequestField[]);
    setError(te(r.code === 'private_unavailable' || r.code === 'invalid_session' ? r.code : 'generic'));
  }

  const flag = (f: RequestField) => (bad.includes(f) ? 'input on-page invalid' : 'input on-page');

  return (
    <div className='card stack'>
      <div className='h3'>{t('formTitle')}</div>
      <div className='muted'>{t('formHint')}</div>
      <div className='muted'>{t('requestLine', { minutes: coach.privateDuration!, price: l.price(coach.privatePrice!) })}</div>
      <div className='fields'>
        <Field label={t('where')}>
          <select className={flag('venueId')} value={venueId} onChange={(e) => setVenueId(e.target.value)}>
            {coach.venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.city}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('sport')}>
          <select className={flag('sportId')} value={sportId} onChange={(e) => setSportId(e.target.value)}>
            {coach.sports.map((s) => (
              <option key={s.id} value={s.id}>
                {sportName(s, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('date')}>
          <input
            type='date'
            dir='ltr'
            className={flag('startsAt')}
            min={wallClock(new Date()).date}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label={t('time')}>
          <input type='time' dir='ltr' className={flag('startsAt')} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      {startsBad && <div className={onb.error}>{t('pickFuture')}</div>}
      <Field label={t('message')}>
        <textarea className={flag('message')} rows={3} dir='auto' value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className={message.trim().length > TEXT_MAX ? onb.error : `muted ${onb.hint}`}>
          {t('messageCount', { count: message.trim().length, max: TEXT_MAX })}
        </div>
      </Field>
      <div>
        <button type='button' className='btn' disabled={busy} onClick={send}>
          {t('send')}
        </button>
      </div>
      {error && <div className={onb.error}>{error}</div>}
    </div>
  );
}
