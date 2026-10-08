'use client';
import { sportName } from '@/lib/coach-rules';
import { useCallback, useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { CertificationList } from '@/components/CertificationList';
import { Avatar, Back, Field, Tag } from '@/components/ui';
import { adminGetCoach, adminSetStatus } from '@/lib/coach-api';
import type { AdminCoachDTO } from '@/lib/dto';
import onb from '@/components/onboarding.module.css';
import detail from '../../../detail.module.css';
import styles from './page.module.css';

type Decision = 'REJECTED' | 'SUSPENDED';
const DECIDE_ERRORS = ['reason_required', 'invalid_status_transition'] as const;

export default function AdminCoachPage() {
  const t = useTranslations('admin');
  const tr = useTranslations('adminReview');
  const tst = useTranslations('status');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const f = useFormatter();
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const [c, setC] = useState<AdminCoachDTO | null | undefined>(undefined);
  const [dialog, setDialog] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => adminGetCoach(id).then((res) => setC(res.ok ? res.data : null)), [id]);
  useEffect(() => {
    adminGetCoach(id)
      .then((res) => setC(res.ok ? res.data : null))
      .catch(() => setC(null));
  }, [id]);

  if (c === null) notFound();
  if (!c) return null;

  const status = c.status.toLowerCase() as 'pending';
  const date = (iso: string | Date) => f.dateTime(new Date(iso), { dateStyle: 'medium' });

  async function decide(to: string, why?: string) {
    setBusy(true);
    setError('');
    const res = await adminSetStatus(id, to, why);
    setBusy(false);
    if (!res.ok) return setError(te(DECIDE_ERRORS.find((k) => k === res.code) ?? 'generic'));
    setDialog(null);
    setReason('');
    await load();
  }

  const links = [['Instagram', c.instagram], ['TikTok', c.tiktok], ...c.links.map((l) => [l.label, l.url])].filter(
    (l): l is [string, string] => !!l[1],
  );

  return (
    <div className={`page detail stack ${detail.page}`}>
      <Back href='/admin/coaches'>{t('backCoaches')}</Back>
      <div className={detail.profile}>
        {c.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small Blob image
          <img src={c.photoUrl} alt='' className={onb.photo} />
        ) : (
          <Avatar initials={c.coachName.slice(0, 2).toUpperCase()} size={80} accent />
        )}
        <div className={detail.profileText}>
          <div className={detail.nameRow}>
            <div className={`display ${detail.name}`} dir='auto'>
              {c.coachName}
            </div>
            <Tag kind={status}>{tst(status)}</Tag>
          </div>
          <div className={`muted ${detail.line}`}>
            <bdi>{c.email}</bdi> · {c.submittedAt ? tr('submitted', { date: date(c.submittedAt) }) : tr('notSubmitted')}
          </div>
        </div>
        <div className={detail.actions}>
          {c.status === 'PENDING' && (
            <>
              <button type='button' className={`btn ${styles.approve}`} disabled={busy} onClick={() => decide('ACTIVE')}>
                {t('approve')}
              </button>
              <button type='button' className='btn-ghost danger' disabled={busy} onClick={() => setDialog('REJECTED')}>
                {t('reject')}
              </button>
            </>
          )}
          {c.status === 'ACTIVE' && (
            <button type='button' className='btn-ghost danger' disabled={busy} onClick={() => setDialog('SUSPENDED')}>
              {t('suspend')}
            </button>
          )}
          {c.status === 'SUSPENDED' && (
            <button type='button' className='btn-ghost' disabled={busy} onClick={() => decide('ACTIVE')}>
              {t('reinstate')}
            </button>
          )}
          {(c.status === 'INCOMPLETE' || c.status === 'REJECTED') && <span className='muted'>{tr('awaitingCoach')}</span>}
        </div>
      </div>

      {dialog && (
        <div className={`card stack ${styles.dialog}`}>
          <div className='h3'>{dialog === 'REJECTED' ? tr('rejectTitle') : tr('suspendTitle')}</div>
          <div className='muted'>{dialog === 'REJECTED' ? tr('rejectHint') : tr('suspendHint')}</div>
          <Field label={tr('reason')}>
            <textarea className='input' rows={3} dir='auto' value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className={styles.dialogActions}>
            <button type='button' className='btn-ghost' onClick={() => setDialog(null)}>
              {tc('cancel')}
            </button>
            <button
              type='button'
              className='btn-ghost danger'
              disabled={busy || (dialog === 'REJECTED' && !reason.trim())}
              onClick={() => decide(dialog, reason)}
            >
              {tr('confirm')}
            </button>
          </div>
        </div>
      )}
      {error && <div className={onb.error}>{error}</div>}

      <section>
        <div className={`h3 ${detail.headingSm}`}>{t('bio')}</div>
        <div className={`muted ${detail.description} ${styles.bio}`} dir='auto'>
          {c.bio}
        </div>
      </section>

      <section className={`stack ${styles.section}`}>
        <div className={`h3 ${detail.headingSm}`}>{tr('socials')}</div>
        {links.map(([label, url]) => (
          <a key={`${label}${url}`} href={url} target='_blank' rel='noopener noreferrer nofollow' className={styles.link}>
            <bdi>{label}</bdi> · <bdi>{url}</bdi>
          </a>
        ))}
      </section>

      <section className={`stack ${styles.section}`}>
        <div className={`h3 ${detail.headingSm}`}>{tr('sports')}</div>
        <div className={onb.chips}>
          {c.sports.map((s) => (
            <span key={s.id} className={`${onb.chip} ${s.status === 'PENDING' ? onb.chipPending : ''}`}>
              <bdi>{sportName(s, locale)}</bdi>
              {/* Coach-added sports are reviewed on the sports page; here they're only marked. */}
              {s.status === 'PENDING' && (
                <span className={styles.newSport} title={tr('newSport')} aria-label={tr('newSport')}>
                  !
                </span>
              )}
            </span>
          ))}
        </div>
      </section>

      <section className={`stack ${styles.section}`}>
        <div className={`h3 ${detail.headingSm}`}>{tr('certifications')}</div>
        {c.certifications.length ? (
          <CertificationList coachId={c.id} items={c.certifications} readOnly />
        ) : (
          <div className='muted'>{tr('noCertifications')}</div>
        )}
      </section>

      <section className={`stack ${styles.section}`}>
        <div className={`h3 ${detail.headingSm}`}>{tr('history')}</div>
        {c.history.map((e) => (
          <div key={e.id} className={styles.event}>
            <div>
              {tr('event', { actor: e.actorName ?? '—', status: tst(e.to.toLowerCase() as 'pending') })}
              {' · '}
              <span className='muted'>{date(e.createdAt)}</span>
            </div>
            {e.reason && (
              <div dir='auto' className='muted'>
                {e.reason}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
