'use client';
import { sportName, type CoachStatus } from '@/lib/shared/coach-rules';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Chips, initialsOf, Person, Table, Tag } from '@/components/ui';
import { adminListCoaches, adminListSports, type AdminSport } from '@/lib/client/coach-api';
import type { AdminCoachRowDTO } from '@/lib/server/dto';
import styles from './page.module.css';

type Filter = 'all' | CoachStatus;
/** Review queue first; the order differs from the lifecycle order in COACH_STATUSES. */
const FILTERS: CoachStatus[] = ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'INCOMPLETE'];
/** How long typing must pause before the search is sent. */
const SEARCH_DELAY_MS = 300;

export default function AdminCoachesPage() {
  const t = useTranslations('admin');
  const tst = useTranslations('status');
  const td = useTranslations('data');
  const f = useFormatter();
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>('all');
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [needle, setNeedle] = useState('');
  const [sports, setSports] = useState<AdminSport[]>([]);
  const [list, setList] = useState<AdminCoachRowDTO[] | null>(null);

  useEffect(() => {
    adminListSports()
      .then((r) => r.ok && setSports(r.data))
      .catch(() => setSports([]));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setNeedle(q.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    // A slow answer to an older filter must not replace a newer one.
    let stale = false;
    adminListCoaches({ status: filter === 'all' ? undefined : filter, sports: picked, q: needle })
      .then((r) => !stale && r.ok && setList(r.data))
      .catch(() => !stale && setList([]));
    return () => {
      stale = true;
    };
  }, [filter, picked, needle]);

  const toggleSport = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const label = (s: string) => tst(s.toLowerCase() as 'pending');
  return (
    <div className='page'>
      <div className={`title ${styles.head}`}>{t('coaches')}</div>
      <div className={styles.filters}>
        <input
          type='search'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className={`search ${styles.search}`}
        />
      </div>
      <div className={styles.pills}>
        <Chips options={[[td('all'), 'all'], ...FILTERS.map((s): [string, Filter] => [label(s), s])]} value={filter} onChange={setFilter} />
        {sports.length > 0 && (
          <>
            <hr className={styles.sep} />
            <fieldset className={`chips ${styles.sportSet}`} aria-label={t('head.sports')}>
              <button
                type='button'
                className={picked.length === 0 ? 'chip on' : 'chip'}
                aria-pressed={picked.length === 0}
                onClick={() => setPicked([])}
              >
                {td('all')}
              </button>
              {sports.map((s) => {
                const on = picked.includes(s.id);
                return (
                  <button key={s.id} type='button' className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => toggleSport(s.id)}>
                    {sportName(s, locale)}
                  </button>
                );
              })}
            </fieldset>
          </>
        )}
      </div>
      <Table className={styles.cols} head={[t('head.coach'), t('head.sports'), t('head.joined'), t('head.status')]}>
        {list?.map((c) => (
          <Link key={c.id} href={`/admin/coaches/${c.id}`} className='tr'>
            <Person initials={initialsOf(c.name)} name={c.name} sub={c.email} />
            <span className='muted'>{c.sports.map((s) => sportName(s, locale)).join(' · ') || '—'}</span>
            <span className='muted'>{f.dateTime(new Date(c.submittedAt ?? c.createdAt), { dateStyle: 'medium' })}</span>
            <span>
              <Tag kind={c.status.toLowerCase()}>{label(c.status)}</Tag>
            </span>
          </Link>
        ))}
        {list?.length === 0 && <div className={`empty ${styles.empty}`}>{t('noCoaches')}</div>}
      </Table>
    </div>
  );
}
