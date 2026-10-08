'use client';
import { sportName } from '@/lib/coach-rules';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { SectionHead, Stats } from '@/components/ui';
import { adminListCoaches } from '@/lib/coach-api';
import type { AdminCoachRowDTO } from '@/lib/dto';
import { bookings, coaches, session, user } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import styles from './page.module.css';

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const tr = useTranslations('adminReview');
  const x = useSessionText();
  const f = useFormatter();
  const locale = useLocale();
  const [pending, setPending] = useState<AdminCoachRowDTO[]>([]);
  useEffect(() => {
    adminListCoaches('PENDING')
      .then((r) => r.ok && setPending(r.data.slice(0, 5)))
      .catch(() => setPending([]));
  }, []);
  const recent = bookings.filter((b) => b.at);

  return (
    <div className={`page stack ${styles.page}`}>
      <div>
        <div className={`muted ${styles.overline}`}>{t('overview')}</div>
        <div className='title'>{t('dashboard')}</div>
      </div>
      {/* Mock until wired up: real platform stats from GET /api/admin/dashboard */}
      <Stats
        items={[
          ['1,284', t('stats.totalUsers')],
          [coaches.filter((c) => c.status === 'active').length + 33, t('stats.activeCoaches')],
          ['212', t('stats.sessionsWeek')],
          [x.price(1532500), t('stats.gross30')],
        ]}
      />
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
                  <Link href={`/admin/users/${b.userId}`} className={`plain ${styles.link}`}>
                    <bdi>{user(b.userId)!.name}</bdi>
                  </Link>
                  <span className='muted'> {t('booked')} </span>
                  <Link href={`/admin/sessions/${b.sessionId}`} className={`plain ${styles.link}`}>
                    <bdi>{session(b.sessionId)!.title}</bdi>
                  </Link>
                </div>
                <span className={`dim ${styles.ago}`}>{x.ago(b.at!)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
