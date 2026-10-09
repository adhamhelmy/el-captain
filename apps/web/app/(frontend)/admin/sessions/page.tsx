'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PhaseTag } from '@/components/sessions';
import { Chips, Table } from '@/components/ui';
import { adminSessions } from '@/lib/client/insights-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { SessionDTO } from '@/lib/server/dto';
import styles from './page.module.css';

type Filter = 'upcoming' | 'past' | 'cancelled' | 'all';
const QUERY: Record<Filter, { when?: string; status?: string }> = {
  upcoming: { when: 'upcoming', status: 'SCHEDULED' },
  past: { when: 'past', status: 'SCHEDULED' },
  cancelled: { status: 'CANCELLED' },
  all: {},
};
/** How long typing must pause before the search is sent. */
const SEARCH_DELAY_MS = 300;

export default function AdminSessionsPage() {
  const t = useTranslations('admin');
  const tst = useTranslations('status');
  const td = useTranslations('data');
  const l = useSessionLabels();
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [q, setQ] = useState('');
  const [needle, setNeedle] = useState('');
  const [list, setList] = useState<SessionDTO[] | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setNeedle(q.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    let stale = false;
    adminSessions({ ...QUERY[filter], q: needle })
      .then((r) => !stale && setList(r.ok ? r.data : []))
      .catch(() => !stale && setList([]));
    return () => {
      stale = true;
    };
  }, [filter, needle]);

  return (
    <div className='page'>
      <div className={`between ${styles.head}`}>
        <div className='title'>{t('sessions')}</div>
        <input
          type='search'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchSessions')}
          aria-label={t('searchSessions')}
          className={`search ${styles.search}`}
        />
      </div>
      <div className={styles.filters}>
        <Chips
          options={[
            [tst('upcoming'), 'upcoming'],
            [tst('past'), 'past'],
            [tst('cancelled'), 'cancelled'],
            [td('all'), 'all'],
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      <Table className={styles.cols} head={[t('head.session'), t('head.coach'), t('head.when'), t('head.booked'), t('head.price'), t('head.status')]}>
        {list?.map((s) => (
          <Link key={s.id} href={`/admin/sessions/${s.id}`} className='tr'>
            <span>
              <bdi className={styles.title}>{l.title(s)}</bdi>
              <span className='cell-sub'>
                {l.sport(s.sport)} · {l.type(s.type)}
              </span>
            </span>
            <bdi className='muted'>{s.coach.name}</bdi>
            <span className='muted'>{l.when(s.startsAt)}</span>
            <span className='muted'>{l.fill(s)}</span>
            <span className={styles.price}>{l.price(s.price)}</span>
            <span>
              <PhaseTag s={s} />
            </span>
          </Link>
        ))}
        {list?.length === 0 && <div className={`empty ${styles.empty}`}>{t('noSessions')}</div>}
      </Table>
    </div>
  );
}
