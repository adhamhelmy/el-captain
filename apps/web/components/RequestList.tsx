'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Tag } from '@/components/ui';
import { acceptRequest, cancelRequest, rejectRequest } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { RequestDTO } from '@/lib/server/dto';
import type { RequestState } from '@/lib/shared/session-rules';
import onb from './onboarding.module.css';
import styles from './RequestList.module.css';

const TAG_KIND: Record<RequestState, string> = {
  PENDING: 'pending',
  ACCEPTED: 'active',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  EXPIRED: 'past',
};
const ACTION_ERRORS = ['request_closed', 'time_conflict'] as const;

/** Private requests: a member sees whom they asked and can withdraw; a coach sees who asked and can accept or decline. */
export function RequestList({
  role,
  requests,
  onChange,
}: Readonly<{ role: 'member' | 'coach'; requests: RequestDTO[]; onChange: (r: RequestDTO) => void }>) {
  const t = useTranslations('requests');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const l = useSessionLabels();
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  async function run(id: string, call: typeof acceptRequest) {
    setBusy(id);
    setError('');
    const r = await call(id);
    setBusy('');
    if (!r.ok) return setError(te(ACTION_ERRORS.find((c) => c === r.code) ?? 'generic'));
    setRejecting('');
    setNote('');
    onChange(r.data);
  }

  if (requests.length === 0) return <div className='empty'>{t('none')}</div>;

  return (
    <div className={`stack ${styles.list}`}>
      {error && <div className={onb.error}>{error}</div>}
      {requests.map((r) => (
        <div key={r.id} className={`row ${styles.row}`}>
          <div className={styles.text}>
            <div className={styles.who} dir='auto'>
              {role === 'coach' ? r.member.name : r.coach.name}
            </div>
            <div className={`muted ${styles.small}`}>{t('line', { sport: l.sport(r.sport), when: l.when(r.startsAt), place: r.venue.name })}</div>
            <div className={`muted ${styles.small}`}>{t('terms', { minutes: r.durationMin, price: l.price(r.price) })}</div>
            {r.message && (
              <div dir='auto' className={styles.small}>
                {t('message', { message: r.message })}
              </div>
            )}
            {r.responseNote && (
              <div dir='auto' className={styles.small}>
                {t('note', { note: r.responseNote })}
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <Tag kind={TAG_KIND[r.status]}>{t(`status.${r.status.toLowerCase() as 'pending'}`)}</Tag>
            {r.status === 'ACCEPTED' && r.sessionId && (
              <Link href={`${role === 'coach' ? '/coach' : '/user'}/sessions/${r.sessionId}`} className='btn-ghost sm plain'>
                {t('viewSession')}
              </Link>
            )}
            {r.status === 'PENDING' && role === 'member' && (
              <button type='button' className='btn-ghost sm' disabled={busy === r.id} onClick={() => run(r.id, cancelRequest)}>
                {t('withdraw')}
              </button>
            )}
            {r.status === 'PENDING' && role === 'coach' && (
              <>
                <button type='button' className='btn sm' disabled={busy === r.id} onClick={() => run(r.id, acceptRequest)}>
                  {t('accept')}
                </button>
                <button
                  type='button'
                  className='btn-ghost sm danger'
                  disabled={busy === r.id}
                  onClick={() => setRejecting(rejecting === r.id ? '' : r.id)}
                >
                  {t('reject')}
                </button>
              </>
            )}
          </div>
          {rejecting === r.id && (
            <div className={styles.reject}>
              <textarea
                className='input'
                rows={2}
                dir='auto'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('notePlaceholder')}
              />
              <div className={styles.actions}>
                <button type='button' className='btn-ghost sm' onClick={() => setRejecting('')}>
                  {tc('cancel')}
                </button>
                <button
                  type='button'
                  className='btn-ghost sm danger'
                  disabled={busy === r.id}
                  onClick={() => run(r.id, (id) => rejectRequest(id, note))}
                >
                  {t('confirmReject')}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
