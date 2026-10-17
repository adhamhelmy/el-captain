'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SessionCard } from '@/components/sessions';
import { Chips, SectionHead } from '@/components/ui';
import { listCoaches, searchSports } from '@/lib/client/coach-api';
import { listSessions } from '@/lib/client/session-api';
import type { PublicCoachDTO, SessionDTO, SportDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import { ExploreCoachCard } from './ExploreCoachCard';
import styles from './Explore.module.css';

/** How long typing must pause before the search is sent. */
const SEARCH_DELAY_MS = 300;
/** Coaches shown before "Show all". */
const COACHES_SHOWN = 4;

type Area = '' | '/user';

const matches = (s: SportDTO, needle: string) => [s.nameEn, s.nameAr].some((name) => name?.toLocaleLowerCase().includes(needle.toLocaleLowerCase()));

/** One search over sessions, sports and coaches. Picking a sport narrows both lists. */
function Search({ area }: Readonly<{ area: Area }>) {
  const params = useSearchParams();
  const t = useTranslations('explore');
  const td = useTranslations('data');
  const locale = useLocale();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [needle, setNeedle] = useState(q.trim());
  const [sport, setSport] = useState(params.get('sport') ?? 'all');
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [coaches, setCoaches] = useState<PublicCoachDTO[] | null>(null);
  const [sessions, setSessions] = useState<SessionDTO[] | null>(null);
  const [allCoaches, setAllCoaches] = useState(false);

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
    // A slow answer to an older search must not replace a newer one.
    let stale = false;
    const filter = { sport: sport === 'all' ? undefined : sport, q: needle };
    // New results start collapsed again.
    const showCoaches = (list: PublicCoachDTO[]) => {
      if (stale) return;
      setCoaches(list);
      setAllCoaches(false);
    };
    listCoaches(filter)
      .then((r) => showCoaches(r.ok ? r.data : []))
      .catch(() => showCoaches([]));
    listSessions(filter)
      .then((r) => !stale && setSessions(r.ok ? r.data : []))
      .catch(() => !stale && setSessions([]));
    return () => {
      stale = true;
    };
  }, [sport, needle]);

  const pickSport = (id: string) => {
    setSport(id);
    setQ('');
    setNeedle('');
  };

  const sportHits = needle ? sports.filter((s) => s.id !== sport && matches(s, needle)) : [];
  const filtered = needle !== '' || sport !== 'all';
  const shownCoaches = allCoaches ? coaches : coaches?.slice(0, COACHES_SHOWN);

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

      {sportHits.length > 0 && (
        <section className={styles.section}>
          <SectionHead title={t('sports')} />
          <Chips options={sportHits.map((s): [string, string] => [sportName(s, locale), s.id])} value={sport} onChange={pickSport} />
        </section>
      )}

      {coaches && (coaches.length > 0 || filtered) && (
        <section className={styles.section}>
          <SectionHead title={t('coaches')} />
          <div className='grid-cards'>
            {shownCoaches?.map((c) => (
              <ExploreCoachCard key={c.id} c={c} href={`${area}/coaches/${c.id}`} />
            ))}
          </div>
          {coaches.length === 0 && <div className={`empty ${styles.empty}`}>{t('noCoaches')}</div>}
          {coaches.length > COACHES_SHOWN && (
            <button type='button' className={`btn-ghost ${styles.more}`} onClick={() => setAllCoaches(!allCoaches)}>
              {allCoaches ? t('showLess') : t('showAll', { count: coaches.length })}
            </button>
          )}
        </section>
      )}

      <section className={styles.section}>
        <SectionHead title={t('sessions')} />
        <div className='grid-cards'>
          {sessions?.map((s) => (
            <SessionCard key={s.id} s={s} href={`${area}/sessions/${s.id}`} />
          ))}
        </div>
        {sessions?.length === 0 && <div className={`empty ${styles.empty}`}>{t('noSessions')}</div>}
      </section>
    </div>
  );
}

/** Explore for guests (`area` '') or members ('/user'); results link to that area's session and coach pages. */
export function Explore({ area }: Readonly<{ area: Area }>) {
  return (
    <Suspense>
      <Search area={area} />
    </Suspense>
  );
}
