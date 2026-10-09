'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { SessionCard } from '@/components/sessions';
import { searchSports } from '@/lib/client/coach-api';
import { listSessions } from '@/lib/client/session-api';
import type { SessionDTO, SportDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import styles from './page.module.css';

/** The approved sports as links into the session browser. */
export function HomeSports() {
  const locale = useLocale();
  const [sports, setSports] = useState<SportDTO[]>([]);
  useEffect(() => {
    searchSports('')
      .then((r) => r.ok && setSports(r.data))
      .catch(() => setSports([]));
  }, []);
  return (
    <div className={`chips ${styles.categories}`}>
      {sports.map((s) => (
        <Link key={s.id} href={`/sessions?sport=${s.id}`} className={`chip ${styles.category}`}>
          {sportName(s, locale)}
        </Link>
      ))}
    </div>
  );
}

/** The next four group sessions. */
export function HomeFeatured() {
  const [list, setList] = useState<SessionDTO[]>([]);
  useEffect(() => {
    listSessions({ limit: 4 })
      .then((r) => r.ok && setList(r.data))
      .catch(() => setList([]));
  }, []);
  return (
    <div className='grid-cards'>
      {list.map((s) => (
        <SessionCard key={s.id} s={s} href={`/sessions/${s.id}`} />
      ))}
    </div>
  );
}
