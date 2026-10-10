'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Avatar, initialsOf, SectionHead, Stats } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { coachClients, coachStats, type CoachStats } from '@/lib/client/insights-api';
import { mySessions } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { CoachClientDTO, SessionDTO } from '@/lib/server/dto';
import styles from './page.module.css';

export default function CoachDashboard() {
  const t = useTranslations('coachDashboard');
  const ts = useTranslations('schedule');
  const l = useSessionLabels();
  const name = useSession().data?.user.name ?? '';
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [next, setNext] = useState<SessionDTO[]>([]);
  const [clients, setClients] = useState<CoachClientDTO[]>([]);

  useEffect(() => {
    coachStats().then((r) => r.ok && setStats(r.data));
    mySessions('upcoming').then((r) => r.ok && setNext(r.data.filter((s) => s.status === 'SCHEDULED').slice(0, 3)));
    coachClients().then((r) => r.ok && setClients(r.data.slice(0, 3)));
  }, []);

  return (
    <div className={`page stack ${styles.page}`}>
      <div className='between'>
        <div>
          <div className={`muted ${styles.welcome}`}>{t('welcome')}</div>
          <div className='title'>{t('title', { name: isolate(name.split(' ')[0].toUpperCase()) })}</div>
        </div>
        <Link href='/coach/sessions/me?add=1' className='btn'>
          {ts('add')}
        </Link>
      </div>
      {stats && (
        <Stats
          items={[
            [stats.bookingsNext7, t('stats.bookings')],
            [l.price(stats.earnings30), t('stats.revenue')],
            [stats.fillRate === null ? '—' : `${stats.fillRate}%`, t('stats.fill')],
          ]}
        />
      )}
      <div className={`grid-2 ${styles.columns}`}>
        <div>
          <SectionHead title={t('comingUp')} href='/coach/sessions/me' link={t('schedule')} />
          <div className={`stack ${styles.list}`}>
            {next.map((s) => (
              <Link key={s.id} href={`/coach/sessions/${s.id}`} className={`row ${styles.session}`}>
                <div>
                  <div dir='auto' className={styles.sessionTitle}>
                    {l.title(s)}
                  </div>
                  <div className={`muted ${styles.when}`}>{l.when(s.startsAt)}</div>
                </div>
                <span className={`muted ${styles.fill}`}>{l.fill(s)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionHead title={t('recentClients')} href='/coach/users/me' link={t('allClients')} />
          <div className={`stack ${styles.list}`}>
            {clients.map((c) => (
              <Link key={c.member.id} href={`/coach/users/${c.member.id}`} className={`row ${styles.client}`}>
                <Avatar initials={initialsOf(c.member.name)} size={36} />
                <div className={styles.clientText}>
                  <div dir='auto' className={styles.clientName}>
                    {c.member.name}
                  </div>
                  <div className={`muted ${styles.clientSub}`}>{t('withYou', { count: c.count })}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
