'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { SessionCard } from '@/components/sessions';
import { Chips, Tag } from '@/components/ui';
import { searchSports } from '@/lib/client/coach-api';
import { listSessions } from '@/lib/client/session-api';
import type { SessionDTO, SportDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import styles from './page.module.css';

export default function AllSessionsPage() {
  const t = useTranslations('coachSessions');
  const tst = useTranslations('status');
  const td = useTranslations('data');
  const locale = useLocale();
  const me = useSession().data?.user.id;
  const [sport, setSport] = useState('all');
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [list, setList] = useState<SessionDTO[]>([]);

  useEffect(() => {
    searchSports('')
      .then((r) => r.ok && setSports(r.data))
      .catch(() => setSports([]));
  }, []);

  useEffect(() => {
    let stale = false;
    listSessions({ sport: sport === 'all' ? undefined : sport })
      .then((r) => !stale && setList(r.ok ? r.data : []))
      .catch(() => !stale && setList([]));
    return () => {
      stale = true;
    };
  }, [sport]);

  return (
    <div className='page'>
      <div className='title'>{t('title')}</div>
      <div className={`sub ${styles.sub}`}>{t('sub')}</div>
      <div className={styles.chips}>
        <Chips
          options={[[td('all'), 'all'], ...sports.map((s): [string, string] => [sportName(s, locale), s.id])]}
          value={sport}
          onChange={setSport}
        />
      </div>
      <div className='grid-cards'>
        {list.map((s) => (
          <SessionCard
            key={s.id}
            s={s}
            href={`/coach/sessions/${s.id}`}
            spots
            badge={s.coach.id === me ? <Tag kind='mine'>{tst('mine')}</Tag> : undefined}
          />
        ))}
      </div>
    </div>
  );
}
