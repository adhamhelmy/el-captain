'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chips, Segmented, SessionCard } from '@/components/ui';
import { categories, coachName, sessions } from '@/lib/mock';

function Browse({ base }: Readonly<{ base: string }>) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [cat, setCat] = useState(params.get('cat') ?? 'All');
  const [type, setType] = useState<'all' | 'group' | 'private'>('all');

  const needle = q.trim().toLowerCase();
  const list = sessions.filter(
    (s) =>
      s.status === 'upcoming' &&
      (cat === 'All' || s.category === cat) &&
      (type === 'all' || s.type === type) &&
      (!needle || `${s.title} ${coachName(s)}`.toLowerCase().includes(needle)),
  );

  return (
    <div className='page'>
      <div className='title'>BROWSE SESSIONS</div>
      <div className='sub'>Group classes and 1:1 coaching this week.</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Search sessions or coaches…'
          className='search'
        />
        <Segmented
          options={[
            ['All', 'all'],
            ['Group', 'group'],
            ['Private', 'private'],
          ]}
          value={type}
          onChange={setType}
        />
      </div>
      <div style={{ marginBottom: 28 }}>
        <Chips options={categories} value={cat} onChange={setCat} />
      </div>
      <div className='grid-cards'>
        {list.map((s) => (
          <SessionCard key={s.id} s={s} href={`${base}/${s.id}`} spots />
        ))}
      </div>
      {list.length === 0 && (
        <div className='empty' style={{ padding: '72px 0' }}>
          No sessions match. Try another search or category.
        </div>
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
