'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Chips, Segmented, SessionCard } from '@/components/ui';
import { CATEGORIES, sessions, type Category } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import styles from './SessionBrowse.module.css';

function Browse({ base }: Readonly<{ base: string }>) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const t = useTranslations('browse');
  const x = useSessionText();
  const raw = params.get('cat');
  // Unknown or old capitalised values (?cat=Yoga) fall back to all instead of an empty list.
  const [cat, setCat] = useState<Category | 'all'>(
    CATEGORIES.includes(raw as Category) ? (raw as Category) : 'all',
  );
  const [type, setType] = useState<'all' | 'group' | 'private'>('all');

  const needle = q.trim().toLowerCase();
  const list = sessions.filter(
    (s) =>
      s.status === 'upcoming' &&
      (cat === 'all' || s.category === cat) &&
      (type === 'all' || s.type === type) &&
      (!needle || x.searchText(s).toLowerCase().includes(needle)),
  );

  return (
    <div className='page'>
      <div className='title'>{t('title')}</div>
      <div className='sub'>{t('sub')}</div>
      <div className={styles.filters}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          className='search'
        />
        <Segmented
          options={[
            [x.category('all'), 'all'],
            [x.type('group'), 'group'],
            [x.type('private'), 'private'],
          ]}
          value={type}
          onChange={setType}
        />
      </div>
      <div className={styles.chips}>
        <Chips
          options={(['all', ...CATEGORIES] as const).map((c) => [x.category(c), c])}
          value={cat}
          onChange={setCat}
        />
      </div>
      <div className='grid-cards'>
        {list.map((s) => (
          <SessionCard key={s.id} s={s} href={`${base}/${s.id}`} spots />
        ))}
      </div>
      {list.length === 0 && (
        <div className={`empty ${styles.empty}`}>{t('empty')}</div>
      )}
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
