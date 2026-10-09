'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RequestList } from '@/components/RequestList';
import { SessionForm } from '@/components/SessionForm';
import { PhaseTag, TypeTag } from '@/components/sessions';
import { Segmented, Table } from '@/components/ui';
import { getOnboarding } from '@/lib/client/coach-api';
import { listVenues, myRequests, mySessions } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { RequestDTO, SessionDTO, SportDTO, VenueDTO } from '@/lib/server/dto';
import { fromWallClock, wallClock } from '@/lib/shared/app-time';
import styles from './page.module.css';

type Tab = 'upcoming' | 'past' | 'requests';
const DAY_MS = 86_400_000;

/** The next seven Cairo dates, starting today. */
function nextWeek() {
  const today = new Date(`${wallClock(new Date()).date}T12:00:00Z`).getTime();
  return Array.from({ length: 7 }, (_, i) => new Date(today + i * DAY_MS).toISOString().slice(0, 10));
}

function MySessions() {
  const t = useTranslations('schedule');
  const tc = useTranslations('common');
  const l = useSessionLabels();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'requests' ? 'requests' : 'upcoming');
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [adding, setAdding] = useState(params.has('add'));
  const [reload, setReload] = useState(0);
  const [list, setList] = useState<SessionDTO[] | null>(null);
  const [requests, setRequests] = useState<RequestDTO[] | null>(null);
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [venues, setVenues] = useState<VenueDTO[]>([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getOnboarding()
      .then((r) => r.ok && setSports(r.data.coach.sports.filter((s) => s.status === 'APPROVED')))
      .catch(() => setSports([]));
    listVenues()
      .then((r) => r.ok && setVenues(r.data.filter((v) => !v.archived)))
      .catch(() => setVenues([]));
  }, []);

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
  }, [tab, reload]);

  const days = nextWeek();

  return (
    <div className={`page stack ${styles.page}`}>
      <div className='between'>
        <div className='title'>{t('title')}</div>
        <button type='button' className='btn' onClick={() => setAdding(!adding)}>
          {adding ? tc('close') : t('add')}
        </button>
      </div>

      {adding && (
        <SessionForm
          sports={sports}
          venues={venues}
          onClose={() => setAdding(false)}
          onSaved={(saved) => {
            setAdding(false);
            setNotice(t('published', { count: saved.length }));
            setTab('upcoming');
            setReload(reload + 1);
          }}
        />
      )}
      {notice && <div className={styles.notice}>{notice}</div>}

      <div className={`between ${styles.toolbar}`}>
        <Segmented
          options={[
            [t('upcoming'), 'upcoming'],
            [t('past'), 'past'],
            [t('requests'), 'requests'],
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'upcoming' && (
          <Segmented
            options={[
              [t('table'), 'table'],
              [t('calendar'), 'calendar'],
            ]}
            value={view}
            onChange={setView}
          />
        )}
      </div>

      {tab === 'requests' && requests && (
        <RequestList role='coach' requests={requests} onChange={(r) => setRequests(requests.map((x) => (x.id === r.id ? r : x)))} />
      )}

      {tab !== 'requests' && (view === 'table' || tab === 'past') && (
        <Table
          className={styles.cols}
          head={[
            t('head.session'),
            t('head.when'),
            t('head.type'),
            t('head.booked'),
            <span key='p' className={styles.priceHead}>
              {t('head.price')}
            </span>,
          ]}
        >
          {list?.map((s) => (
            <Link key={s.id} href={`/coach/sessions/${s.id}`} className={`tr ${styles.row}`}>
              <span dir='auto' className={styles.title}>
                {l.title(s)}
              </span>
              <span className='muted'>{l.when(s.startsAt)}</span>
              <span>{s.status === 'CANCELLED' ? <PhaseTag s={s} /> : <TypeTag type={s.type} />}</span>
              <span className='muted'>{l.fill(s)}</span>
              <span className={styles.price}>{l.price(s.price)}</span>
            </Link>
          ))}
          {list?.length === 0 && <div className={`empty ${styles.empty}`}>{t('empty')}</div>}
        </Table>
      )}

      {tab === 'upcoming' && view === 'calendar' && (
        <div className={styles.calendarScroll}>
          <div className={styles.calendar}>
            {days.map((day) => (
              <div key={day} className={`stack ${styles.day}`}>
                <div className={`dim overline ${styles.dayName}`}>
                  {l.day(fromWallClock({ date: day, time: '12:00' })!)} · {l.dayMonth(fromWallClock({ date: day, time: '12:00' })!)}
                </div>
                <div className={`stack ${styles.dayBody}`}>
                  {list
                    ?.filter((s) => s.status === 'SCHEDULED' && wallClock(new Date(s.startsAt)).date === day)
                    .map((s) => (
                      <Link key={s.id} href={`/coach/sessions/${s.id}`} className={`tag-${s.type === 'GROUP' ? 'accent' : 'warn'} ${styles.event}`}>
                        <div className={styles.eventMeta}>{l.time(s.startsAt)}</div>
                        <div dir='auto' className={styles.eventTitle}>
                          {l.title(s)}
                        </div>
                        <div className={styles.eventMeta}>{s.type === 'PRIVATE' ? l.oneToOne() : l.fill(s)}</div>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachMySessionsPage() {
  return (
    <Suspense>
      <MySessions />
    </Suspense>
  );
}
