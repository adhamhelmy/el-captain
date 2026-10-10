'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { SectionHead, Stats } from '@/components/ui';
import { adminListCoaches } from '@/lib/client/coach-api';
import { adminRecentBookings, adminStats, type AdminStats } from '@/lib/client/insights-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { AdminCoachRowDTO, RecentBookingDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import styles from './page.module.css';

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const tr = useTranslations('adminReview');
  const f = useFormatter();
  const locale = useLocale();
  const [pending, setPending] = useState<AdminCoachRowDTO[]>([]);
  useEffect(() => {
    adminListCoaches({ status: 'PENDING' })
      .then((r) => r.ok && setPending(r.data.slice(0, 5)))
      .catch(() => setPending([]));
  }, []);
  const l = useSessionLabels();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<RecentBookingDTO[]>([]);
  useEffect(() => {
    adminStats().then((r) => r.ok && setStats(r.data));
    adminRecentBookings().then((r) => r.ok && setRecent(r.data));
  }, []);

  return (
    <div className={`page stack ${styles.page}`}>
      <div>
        <div className={`muted ${styles.overline}`}>{t('overview')}</div>
        <div className='title'>{t('dashboard')}</div>
      </div>
      {stats && (
        <Stats
          items={[
            [stats.members, t('stats.totalUsers')],
            [stats.activeCoaches, t('stats.activeCoaches')],
            [stats.sessionsNext7, t('stats.sessionsWeek')],
            [l.price(stats.bookedValue30), t('stats.gross30')],
          ]}
        />
      )}
      <div className={`grid-2 ${styles.columns}`}>
        <div>
          <SectionHead title={t('pendingCoaches')} href='/admin/coaches' link={t('allCoaches')} />
          <div className={`stack ${styles.list}`}>
            {pending.map((c) => (
              <div key={c.id} className={`row ${styles.pending}`}>
                <Link href={`/admin/coaches/${c.id}`} className='plain'>
                  <div dir='auto' className={styles.name}>
                    {c.name}
                  </div>
                  <div className={`muted ${styles.applied}`}>
                    {t('applied', {
                      specialty: c.sports.map((s) => sportName(s, locale)).join(' · '),
                      date: f.dateTime(new Date(c.submittedAt ?? c.createdAt), { dateStyle: 'medium' }),
                    })}
                  </div>
                </Link>
                <div className={styles.actions}>
                  <Link href={`/admin/coaches/${c.id}`} className={`btn ${styles.approve}`}>
                    {tr('review')}
                  </Link>
                </div>
              </div>
            ))}
            {pending.length === 0 && <div className={`muted ${styles.none}`}>{t('noneWaiting')}</div>}
          </div>
        </div>
        <div>
          <div className={`h2 ${styles.heading}`}>{t('recentBookings')}</div>
          <div className={`card ${styles.feed}`}>
            {recent.map((b) => (
              <div key={b.id} className={styles.booking}>
                {/* "<user> booked <session>" reads in the same order in Arabic («<user> حجز <session>»). */}
                <div>
                  <Link href={`/admin/users/${b.member.id}`} className={`plain ${styles.link}`}>
                    <bdi>{b.member.name}</bdi>
                  </Link>
                  <span className='muted'> {t('booked')} </span>
                  <Link href={`/admin/sessions/${b.session.id}`} className={`plain ${styles.link}`}>
                    <bdi>{l.title(b.session)}</bdi>
                  </Link>
                </div>
                <span className={`dim ${styles.ago}`}>{l.ago(b.createdAt)}</span>
              </div>
            ))}
            {recent.length === 0 && <div className={`muted ${styles.none}`}>{t('noBookings')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
