'use client';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { br, contactLink } from '@/components/rich';
import type { Onboarding } from '@/lib/client/coach-api';
import { ProfilePreview } from './ProfilePreview';
import { TopBar } from './TopBar';
import { formOf } from './wizard-form';
import styles from './onboarding.module.css';

type Stage = 'done' | 'now' | 'todo';

/** What a coach sees while their profile is in review, or after it was suspended. */
export function StatusScreen({ data }: Readonly<{ data: Onboarding }>) {
  const t = useTranslations('onboarding');
  const f = useFormatter();
  const pending = data.coach.status === 'PENDING';
  const submitted = data.coach.submittedAt ? f.dateTime(new Date(data.coach.submittedAt), { dateStyle: 'medium' }) : null;

  const timeline: [string, string, Stage][] = [
    [t('timeline.created'), t('timeline.done'), 'done'],
    [t('timeline.submitted'), submitted ?? t('timeline.done'), 'done'],
    [t('timeline.review'), t('timeline.inProgress'), 'now'],
    [t('timeline.live'), t('timeline.liveSub'), 'todo'],
  ];

  return (
    <div className={styles.status}>
      <TopBar />
      <div className={styles.statusHead}>
        <span className={pending ? 'tag tag-pending' : 'tag tag-warn'}>{pending ? t('inReview') : t('suspended')}</span>
        <h1 className={styles.statusTitle}>{t.rich(pending ? 'pendingTitle' : 'suspendedTitle', { br })}</h1>
        <div className={styles.intro}>{pending ? t('pendingBody', { date: submitted ?? '' }) : t('suspendedBody')}</div>
      </div>

      {pending ? (
        <>
          <ol className={styles.timeline}>
            {timeline.map(([label, sub, stage]) => (
              <li key={label} className={styles.tlItem}>
                <span className={styles.tlRail}>
                  <span className={`${styles.tlDot} ${styles['tl_' + stage]}`} aria-hidden>
                    {stage === 'done' ? '✓' : ''}
                  </span>
                  <span className={stage === 'done' ? `${styles.tlLine} ${styles.tlLineDone}` : styles.tlLine} />
                </span>
                <span className={styles.tlText}>
                  <span className={styles.tlLabel}>{label}</span>
                  <span className={styles.fieldHint}>{sub}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className={styles.field}>
            <div className={styles.railTitle}>{t('previewWillSee')}</div>
            <ProfilePreview name={data.coach.coachName} form={formOf(data)} />
            <div className={styles.fieldHint}>{t.rich('lockedNote', { contact: contactLink })}</div>
          </div>
          <Link href='/' className={`btn-ghost ${styles.selfStart}`}>
            {t('home')}
          </Link>
        </>
      ) : (
        <>
          {data.reason && (
            <div className={styles.field}>
              <div className={styles.fieldHint}>{t('teamNote')}</div>
              <div dir='auto' className={styles.note}>
                {data.reason}
              </div>
            </div>
          )}
          <div className={styles.statusActions}>
            <Link href='/contact' className='btn'>
              {t('contactUs')}
            </Link>
            <Link href='/' className='btn-ghost'>
              {t('home')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
