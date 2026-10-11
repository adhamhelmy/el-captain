'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Avatar, initialsOf } from '@/components/ui';
import { coachClients } from '@/lib/client/insights-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { CoachClientDTO } from '@/lib/server/dto';
import styles from './page.module.css';

/** Everyone who booked this coach, searchable by name or email in the browser. */
export default function MyClientsPage() {
  const t = useTranslations('clients');
  const l = useSessionLabels();
  const [list, setList] = useState<CoachClientDTO[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    coachClients()
      .then((r) => setList(r.ok ? r.data : []))
      .catch(() => setList([]));
  }, []);

  const needle = q.trim().toLowerCase();
  const shown = (list ?? []).filter((c) => !needle || c.member.name.toLowerCase().includes(needle) || c.member.email.toLowerCase().includes(needle));
  const last = (c: CoachClientDTO) => (c.lastVisit ? l.dayMonth(c.lastVisit) : '—');
  const empty = list && shown.length === 0 && <div className={styles.empty}>{list.length ? t('noMatch') : t('none')}</div>;

  return (
    <div className={`page stack ${styles.page}`}>
      <div className='between'>
        <div>
          <div className='title'>{t('title')}</div>
          <div className={`muted ${styles.sub}`}>{t('sub')}</div>
        </div>
        <input
          className={`input on-page ${styles.search}`}
          dir='auto'
          placeholder={t('search')}
          aria-label={t('search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className={`table ${styles.cols} ${styles.desktop}`}>
        <div className='tr th'>
          <span>{t('client')}</span>
          <span>{t('sessions')}</span>
          <span>{t('lastSession')}</span>
          <span>{t('since')}</span>
        </div>
        {shown.map((c) => (
          <Link key={c.member.id} href={`/coach/users/${c.member.id}`} className='tr'>
            <span className={styles.person}>
              <Avatar initials={initialsOf(c.member.name)} size={34} />
              <bdi className={styles.name}>{c.member.name}</bdi>
            </span>
            <span>{c.count}</span>
            <span className='muted'>{last(c)}</span>
            <span className='muted'>{l.monthYear(c.since)}</span>
          </Link>
        ))}
        {empty}
      </div>

      <div className={`${styles.cards} ${styles.mobile}`}>
        {shown.map((c) => (
          <Link key={c.member.id} href={`/coach/users/${c.member.id}`} className={styles.card}>
            <Avatar initials={initialsOf(c.member.name)} size={36} />
            <span className={styles.cardText}>
              <bdi className={styles.name}>{c.member.name}</bdi>
              <span className={styles.cardSub}>{t('lastAndSince', { last: last(c), since: l.monthYear(c.since) })}</span>
            </span>
            <span className={styles.count}>{c.count}</span>
          </Link>
        ))}
        {empty}
      </div>
    </div>
  );
}
