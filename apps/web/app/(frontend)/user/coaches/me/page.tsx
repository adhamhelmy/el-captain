'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CoachCard, initialsOf } from '@/components/ui';
import { myCoaches } from '@/lib/client/insights-api';
import type { MemberCoachDTO } from '@/lib/server/dto';

export default function MyCoachesPage() {
  const t = useTranslations('userCoaches');
  const [list, setList] = useState<MemberCoachDTO[] | null>(null);
  useEffect(() => {
    myCoaches()
      .then((r) => setList(r.ok ? r.data : []))
      .catch(() => setList([]));
  }, []);
  return (
    <div className='page'>
      <div className='title'>{t('mineTitle')}</div>
      <div className='sub'>{t('mineSub')}</div>
      <div className='grid-cards'>
        {list?.map((c) => (
          <CoachCard
            key={c.id}
            href={`/user/coaches/${c.id}`}
            name={c.name}
            initials={initialsOf(c.name)}
            photoUrl={c.photoUrl}
            sub={c.city && <bdi>{c.city}</bdi>}
            meta={t('together', { count: c.count })}
          />
        ))}
      </div>
      {list?.length === 0 && <div className='muted'>{t('none')}</div>}
    </div>
  );
}
