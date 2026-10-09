'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CoachCard, initialsOf } from '@/components/ui';
import { listCoaches } from '@/lib/client/coach-api';
import type { PublicCoachDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';

export default function CoachesPage() {
  const t = useTranslations('userCoaches');
  const locale = useLocale();
  const [list, setList] = useState<PublicCoachDTO[] | null>(null);

  useEffect(() => {
    listCoaches()
      .then((r) => setList(r.ok ? r.data : []))
      .catch(() => setList([]));
  }, []);

  return (
    <div className='page'>
      <div className='title'>{t('title')}</div>
      <div className='sub'>{t('sub')}</div>
      <div className='grid-cards'>
        {list?.map((c) => (
          <CoachCard
            key={c.id}
            href={`/user/coaches/${c.id}`}
            name={c.name}
            initials={initialsOf(c.name)}
            photoUrl={c.photoUrl}
            sub={c.city && <bdi>{c.city}</bdi>}
            foot={c.sports.map((s) => sportName(s, locale)).join(' · ')}
          />
        ))}
      </div>
      {list?.length === 0 && <div className='muted'>{t('none')}</div>}
    </div>
  );
}
