'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { RequestList } from '@/components/RequestList';
import { browseLink } from '@/components/rich';
import { PhaseTag, TypeTag } from '@/components/sessions';
import { Segmented } from '@/components/ui';
import { myRequests, mySessions } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { RequestDTO, SessionDTO } from '@/lib/server/dto';
import styles from './page.module.css';

type Tab = 'upcoming' | 'past' | 'requests';

export default function MySessionsPage() {
  const t = useTranslations('userSessions');
  const l = useSessionLabels();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [list, setList] = useState<SessionDTO[] | null>(null);
  const [requests, setRequests] = useState<RequestDTO[] | null>(null);

  useEffect(() => {
    let stale = false;
    if (tab === 'requests') {
      myRequests()
        .then((r) => !stale && setRequests(r.ok ? r.data : []))
        .catch(() => !stale && setRequests([]));
    } else {
      mySessions(tab)
        .then((r) => !stale && setList(r.ok ? r.data : []))
        .catch(() => !stale && setList([]));
    }
    return () => {
      stale = true;
    };
  }, [tab]);

  return (
    <div className={`page ${styles.page}`}>
      <div className={`title ${styles.title}`}>{t('title')}</div>
      <div className={styles.tabs}>
        <Segmented
          options={[
            [t('upcoming'), 'upcoming'],
            [t('past'), 'past'],
            [t('requests'), 'requests'],
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'requests' ? (
        requests && <RequestList role='member' requests={requests} onChange={(r) => setRequests(requests.map((x) => (x.id === r.id ? r : x)))} />
      ) : (
        <div className={`stack ${styles.list}`}>
          {list?.map((s) => (
            <div key={s.id} className='row'>
              <Link href={`/user/sessions/${s.id}`} className={`plain ${styles.session}`}>
                <TypeTag type={s.type} />
                <div>
                  <div dir='auto' className={styles.sessionTitle}>
                    {l.title(s)}
                  </div>
                  <div className={`muted ${styles.when}`}>
                    <bdi>{s.coach.name}</bdi> · {l.when(s.startsAt)}
                  </div>
                </div>
              </Link>
              <div className={styles.meta}>
                {s.status === 'CANCELLED' && <PhaseTag s={s} />}
                <span className={`display ${styles.price}`}>{l.price(s.price)}</span>
                {tab === 'upcoming' ? (
                  <Link href={`/user/sessions/${s.id}`} className='btn-ghost sm plain'>
                    {t('details')}
                  </Link>
                ) : (
                  <Link href={`/user/coaches/${s.coach.id}`} className='btn-ghost sm plain'>
                    {t('bookAgain')}
                  </Link>
                )}
              </div>
            </div>
          ))}
          {list?.length === 0 && <div className='empty'>{t.rich('empty', { link: browseLink })}</div>}
        </div>
      )}
    </div>
  );
}
