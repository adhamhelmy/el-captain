'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { StatRow } from '@/components/StatRow';
import { Avatar, Back, initialsOf, Tag } from '@/components/ui';
import { coachClient, type CoachClient } from '@/lib/client/insights-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import { hasStarted } from '@/lib/shared/session-rules';
import styles from './page.module.css';

/** One client: how long they've trained with the coach, what they've spent, and every session together. */
export default function ClientPage() {
  const t = useTranslations('clients');
  const l = useSessionLabels();
  const f = useFormatter();
  const { id } = useParams<{ id: string }>();
  const [c, setC] = useState<CoachClient | null | undefined>(undefined);

  useEffect(() => {
    coachClient(id)
      .then((r) => setC(r.ok ? r.data : null))
      .catch(() => setC(null));
  }, [id]);

  if (c === null) notFound();
  if (!c) return null;
  const held = c.sessions.filter((s) => s.status === 'SCHEDULED');
  const attended = held.filter((s) => hasStarted(s.startsAt));
  const upcoming = held.length - attended.length;
  const spent = attended.reduce((sum, s) => sum + s.price, 0);
  const first = held.at(-1);

  return (
    <div className={`page stack ${styles.page}`}>
      <Back href='/coach/users/me'>{t('back')}</Back>
      <div className={styles.profile}>
        <Avatar initials={initialsOf(c.member.name)} size={72} />
        <div>
          <h1 className={styles.name}>
            <bdi>{c.member.name}</bdi>
          </h1>
          <div className='muted'>{first ? t('clientSince', { date: l.monthYear(first.startsAt) }) : <bdi>{c.member.email}</bdi>}</div>
        </div>
      </div>
      <StatRow
        items={[
          [attended.length, t('withYou')],
          [upcoming, t('upcoming')],
          [
            <>
              {f.number(spent)}
              <small>{t('egp')}</small>
            </>,
            t('spent'),
          ],
        ]}
      />
      <div className={styles.history}>
        <h2 className={styles.heading}>{t('history')}</h2>
        <div className={styles.list}>
          {c.sessions.map((s) => {
            let tag = <Tag kind='accent'>{t('upcomingTag')}</Tag>;
            if (s.status === 'CANCELLED') tag = <Tag kind='cancelled'>{t('cancelledTag')}</Tag>;
            else if (hasStarted(s.startsAt)) tag = <Tag kind='past'>{t('attendedTag')}</Tag>;
            return (
              <Link key={s.id} href={`/coach/sessions/${s.id}`} className={styles.row}>
                <span>
                  <bdi className={styles.rowTitle}>{l.title(s)}</bdi>
                  <span className={styles.rowSub}>{l.when(s.startsAt)}</span>
                </span>
                {tag}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
