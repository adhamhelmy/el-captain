'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { SessionCard } from '@/components/sessions';
import { exploreLink } from '@/components/rich';
import { SectionHead, Stats } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { myCoaches } from '@/lib/client/insights-api';
import { getMe } from '@/lib/client/member-api';
import { listSessions, mySessions } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { SessionDTO } from '@/lib/server/dto';
import styles from './page.module.css';

/** Bookings listed under the next-session card; the rest are on My sessions. */
const MORE_SHOWN = 6;

export default function UserDashboard() {
  const t = useTranslations('userDashboard');
  const l = useSessionLabels();
  const name = useSession().data?.user.name ?? '';
  const [upcoming, setUpcoming] = useState<SessionDTO[] | null>(null);
  const [completed, setCompleted] = useState(0);
  const [coaches, setCoaches] = useState(0);
  const [picked, setPicked] = useState<SessionDTO[]>([]);

  useEffect(() => {
    void mySessions('past').then((r) => r.ok && setCompleted(r.data.length));
    void myCoaches().then((r) => r.ok && setCoaches(r.data.length));
    // Suggestions: open sessions the member isn't booked on, favourite sports first.
    void Promise.all([mySessions('upcoming'), getMe(), listSessions({ limit: 24 })]).then(([mine, me, open]) => {
      const booked = mine.ok ? mine.data : [];
      setUpcoming(booked);
      const favs = new Set(me.ok ? me.data.sports.map((s) => s.id) : []);
      const ids = new Set(booked.map((s) => s.id));
      const choices = (open.ok ? open.data : []).filter((s) => !ids.has(s.id));
      setPicked([...choices.filter((s) => favs.has(s.sport.id)), ...choices.filter((s) => !favs.has(s.sport.id))].slice(0, 3));
    });
  }, []);

  const [next, ...later] = upcoming ?? [];

  return (
    <div className={`page stack ${styles.page}`}>
      <div>
        <div className={`muted ${styles.welcome}`}>{t('welcome')}</div>
        <div className='title'>{t('title', { name: isolate(name.split(' ')[0].toUpperCase()) })}</div>
      </div>
      {next && (
        <Link href={`/user/sessions/${next.id}`} className={`btn ${styles.next}`}>
          <div>
            <div className={`overline ${styles.nextLabel}`}>{t('nextSession')}</div>
            <div className={`display ${styles.nextTitle}`} dir='auto'>
              {l.title(next)}
            </div>
            <div className={styles.nextWhen}>
              <bdi>{next.coach.name}</bdi> · {l.when(next.startsAt)}
            </div>
          </div>
          <div className={styles.viewDetails}>{t('viewDetails')}</div>
        </Link>
      )}
      <Stats
        items={[
          [upcoming?.length ?? 0, t('stats.upcoming')],
          [completed, t('stats.completed')],
          [coaches, t('stats.coaches')],
        ]}
      />
      {upcoming && (upcoming.length === 0 || later.length > 0) && (
        <div>
          <SectionHead title={t('comingUp')} href='/user/sessions/me' link={t('mySessions')} />
          <div className='grid-cards'>
            {later.slice(0, MORE_SHOWN).map((s) => (
              <SessionCard key={s.id} s={s} href={`/user/sessions/${s.id}`} />
            ))}
          </div>
          {upcoming.length === 0 && <div className='empty'>{t.rich('noUpcoming', { link: exploreLink })}</div>}
        </div>
      )}
      <div>
        <SectionHead title={t('picked')} href='/user/explore' link={t('exploreAll')} />
        <div className='grid-cards'>
          {picked.map((s) => (
            <SessionCard key={s.id} s={s} href={`/user/sessions/${s.id}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
