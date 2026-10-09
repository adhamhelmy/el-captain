'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SessionCard } from '@/components/sessions';
import { Chips } from '@/components/ui';
import { searchSports } from '@/lib/client/coach-api';
import { listSessions } from '@/lib/client/session-api';
import type { SessionDTO, SportDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import styles from './SessionBrowse.module.css';

/** How long typing must pause before the search is sent. */
const SEARCH_DELAY_MS = 300;

function Browse({ base }: Readonly<{ base: string }>) {
  const params = useSearchParams();
  const t = useTranslations('browse');
  const td = useTranslations('data');
  const locale = useLocale();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [needle, setNeedle] = useState(q.trim());
  const [sport, setSport] = useState(params.get('sport') ?? 'all');
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [list, setList] = useState<SessionDTO[] | null>(null);

  useEffect(() => {
    searchSports('')
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
    listSessions({ sport: sport === 'all' ? undefined : sport, q: needle })
      .then((r) => !stale && setList(r.ok ? r.data : []))
      .catch(() => !stale && setList([]));
    return () => {
      stale = true;
    };
  }, [sport, needle]);

  return (
    <div className='page'>
      <div className='title'>{t('title')}</div>
      <div className='sub'>{t('sub')}</div>
      <div className={styles.filters}>
        <input type='search' value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')} className='search' />
      </div>
      <div className={styles.chips}>
        <Chips
          options={[[td('all'), 'all'], ...sports.map((s): [string, string] => [sportName(s, locale), s.id])]}
          value={sport}
          onChange={setSport}
        />
      </div>
      <div className='grid-cards'>
        {list?.map((s) => (
          <SessionCard key={s.id} s={s} href={`${base}/${s.id}`} spots />
        ))}
      </div>
      {list?.length === 0 && <div className={`empty ${styles.empty}`}>{t('empty')}</div>}
    </div>
  );
}

/** Session search; `base` is the list URL, e.g. /sessions for guests or /user/sessions for members. */
export function SessionBrowse({ base }: Readonly<{ base: string }>) {
  return (
    <Suspense>
      <Browse base={base} />
    </Suspense>
  );
}
