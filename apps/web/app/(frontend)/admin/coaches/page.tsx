'use client';
import { sportName, type CoachStatus } from '@/lib/coach-rules';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Person, Segmented, Table, Tag } from '@/components/ui';
import { adminListCoaches } from '@/lib/coach-api';
import type { AdminCoachRowDTO } from '@/lib/dto';
import styles from './page.module.css';

type Filter = 'all' | CoachStatus;
/** Review queue first; the order differs from the lifecycle order in COACH_STATUSES. */
const FILTERS: CoachStatus[] = ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'INCOMPLETE'];
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function AdminCoachesPage() {
  const t = useTranslations('admin');
  const tst = useTranslations('status');
  const td = useTranslations('data');
  const f = useFormatter();
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [list, setList] = useState<AdminCoachRowDTO[]>([]);

  useEffect(() => {
    adminListCoaches(filter === 'all' ? undefined : filter)
      .then((r) => r.ok && setList(r.data))
      .catch(() => setList([]));
  }, [filter]);

  const label = (s: string) => tst(s.toLowerCase() as 'pending');
  return (
    <div className='page'>
      <div className={`between ${styles.head}`}>
        <div className='title'>{t('coaches')}</div>
        <Segmented options={[[td('all'), 'all'], ...FILTERS.map((s): [string, Filter] => [label(s), s])]} value={filter} onChange={setFilter} />
      </div>
      <Table className={styles.cols} head={[t('head.coach'), t('head.joined'), t('head.status')]}>
        {list.map((c) => (
          <Link key={c.id} href={`/admin/coaches/${c.id}`} className='tr'>
            <Person initials={initials(c.name)} name={c.name} sub={c.sports.map((s) => sportName(s, locale)).join(' · ') || c.email} />
            <span className='muted'>{f.dateTime(new Date(c.submittedAt ?? c.createdAt), { dateStyle: 'medium' })}</span>
            <span>
              <Tag kind={c.status.toLowerCase()}>{label(c.status)}</Tag>
            </span>
          </Link>
        ))}
      </Table>
    </div>
  );
}
