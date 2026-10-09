'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { initialsOf, Person, Table } from '@/components/ui';
import { coachClients } from '@/lib/client/insights-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { CoachClientDTO } from '@/lib/server/dto';
import styles from './page.module.css';

export default function MyClientsPage() {
  const t = useTranslations('clients');
  const l = useSessionLabels();
  const [list, setList] = useState<CoachClientDTO[]>([]);
  useEffect(() => {
    coachClients().then((r) => r.ok && setList(r.data));
  }, []);
  return (
    <div className={`page ${styles.page}`}>
      <div className='title'>{t('title')}</div>
      <div className={`sub ${styles.sub}`}>{t('sub')}</div>
      <Table className={styles.cols} head={[t('client'), t('sessions'), t('lastVisit')]}>
        {list.map((c) => (
          <Link key={c.member.id} href={`/coach/users/${c.member.id}`} className='tr'>
            <Person initials={initialsOf(c.member.name)} name={c.member.name} sub={c.member.email} />
            <span className='muted'>{c.count}</span>
            <span className='muted'>{c.lastVisit ? l.dayMonth(c.lastVisit) : '—'}</span>
          </Link>
        ))}
      </Table>
    </div>
  );
}
