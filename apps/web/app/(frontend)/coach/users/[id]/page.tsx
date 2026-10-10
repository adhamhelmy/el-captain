'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PhaseTag } from '@/components/sessions';
import { Avatar, Back, initialsOf, Stats } from '@/components/ui';
import { coachClient, type CoachClient } from '@/lib/client/insights-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import { hasStarted } from '@/lib/shared/session-rules';
import detail from '../../../detail.module.css';
import styles from './page.module.css';

export default function ClientPage() {
  const t = useTranslations('clients');
  const l = useSessionLabels();
  const { id } = useParams<{ id: string }>();
  const [c, setC] = useState<CoachClient | null | undefined>(undefined);

  useEffect(() => {
    coachClient(id)
      .then((r) => setC(r.ok ? r.data : null))
      .catch(() => setC(null));
  }, [id]);

  if (c === null) notFound();
  if (!c) return null;
  const last = c.sessions.find((s) => s.status === 'SCHEDULED' && hasStarted(s.startsAt));

  return (
    <div className={`page detail stack ${detail.page}`}>
      <Back href='/coach/users/me'>{t('back')}</Back>
      <div className={detail.profile}>
        <Avatar initials={initialsOf(c.member.name)} size={80} accent />
        <div>
          <div className={`display ${detail.name}`} dir='auto'>
            {c.member.name}
          </div>
          <div className={`muted ${detail.line}`}>
            <bdi>{c.member.email}</bdi>
            {c.member.phone && (
              <>
                {' · '}
                <bdi>{c.member.phone}</bdi>
              </>
            )}
          </div>
        </div>
      </div>
      <Stats
        small
        items={[
          [c.sessions.length, t('withYou')],
          [last ? l.dayMonth(last.startsAt) : '—', t('lastVisit')],
          [l.monthYear(c.member.createdAt), t('memberSince')],
        ]}
      />
      <div>
        <div className={`h3 ${detail.heading}`}>{t('history')}</div>
        <div className={`stack ${detail.list}`}>
          {c.sessions.map((s) => (
            <Link key={s.id} href={`/coach/sessions/${s.id}`} className={`row ${detail.row} ${styles.visit}`}>
              <div>
                <div dir='auto' className={detail.rowTitle}>
                  {l.title(s)}
                </div>
                <div className={`muted ${detail.rowSub}`}>{l.when(s.startsAt)}</div>
              </div>
              <PhaseTag s={s} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
