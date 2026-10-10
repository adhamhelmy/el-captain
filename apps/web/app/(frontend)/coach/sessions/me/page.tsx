'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Notice } from '@/components/Drawer';
import { actionLink } from '@/components/rich';
import { RequestList } from '@/components/RequestList';
import { SessionDrawer } from '@/components/SessionDrawer';
import { PhaseTag, TypeTag } from '@/components/sessions';
import { Segmented } from '@/components/ui';
import { getOnboarding } from '@/lib/client/coach-api';
import { listVenues, myRequests, mySessions, mySessionsBetween } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { RequestDTO, SessionDTO, SportDTO, VenueDTO } from '@/lib/server/dto';
import { fromWallClock, wallClock, weekDates } from '@/lib/shared/app-time';
import { WeekView } from './WeekView';
import styles from './page.module.css';

type Tab = 'upcoming' | 'past' | 'requests';
type View = 'week' | 'list';

const noon = (date: string) => fromWallClock({ date, time: '12:00' })!;

function MySessions() {
  const t = useTranslations('schedule');
  const l = useSessionLabels();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'requests' ? 'requests' : 'upcoming');
  const [view, setView] = useState<View>(params.get('view') === 'list' ? 'list' : 'week');
  const week = Math.max(0, Number.parseInt(params.get('week') ?? '0', 10) || 0);
  const [adding, setAdding] = useState(params.has('add'));
  const [reload, setReload] = useState(0);
  const [upcoming, setUpcoming] = useState<SessionDTO[] | null>(null);
  const [past, setPast] = useState<SessionDTO[] | null>(null);
  const [weekList, setWeekList] = useState<SessionDTO[] | null>(null);
  const [requests, setRequests] = useState<RequestDTO[] | null>(null);
  // Null until loaded: the drawer only opens once both are in, so it never shows an empty list by mistake.
  const [sports, setSports] = useState<SportDTO[] | null>(null);
  const [venues, setVenues] = useState<VenueDTO[] | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getOnboarding()
      .then((r) => setSports(r.ok ? r.data.coach.sports.filter((s) => s.status === 'APPROVED') : []))
      .catch(() => setSports([]));
    listVenues()
      .then((r) => setVenues(r.ok ? r.data.filter((v) => !v.archived) : []))
      .catch(() => setVenues([]));
  }, []);

  // Both lists load together: the week view shows this week's earlier days too, and the tab badge needs the requests.
  useEffect(() => {
    let stale = false;
    mySessions('upcoming')
      .then((r) => !stale && setUpcoming(r.ok ? r.data : []))
      .catch(() => !stale && setUpcoming([]));
    mySessions('past')
      .then((r) => !stale && setPast(r.ok ? r.data : []))
      .catch(() => !stale && setPast([]));
    myRequests()
      .then((r) => !stale && setRequests(r.ok ? r.data : []))
      .catch(() => !stale && setRequests([]));
    return () => {
      stale = true;
    };
  }, [reload]);

  const days = weekDates(week);
  const weekKey = days[0];
  // The shown week loads by date range, so it's complete however many sessions come before it.
  useEffect(() => {
    let stale = false;
    const from = fromWallClock({ date: weekKey, time: '00:00' });
    const to = fromWallClock({ date: weekDates(week + 1)[0], time: '00:00' });
    if (!from || !to) return;
    mySessionsBetween(from, to)
      .then((r) => !stale && setWeekList(r.ok ? r.data : []))
      .catch(() => !stale && setWeekList([]));
    return () => {
      stale = true;
    };
  }, [week, weekKey, reload]);

  // Opened from a link (?add=1): drop the flag so a refresh or Back doesn't open the drawer again.
  useEffect(() => {
    if (!params.has('add')) return;
    const next = new URLSearchParams(params);
    next.delete('add');
    router.replace(next.size ? `${path}?${next}` : path, { scroll: false });
  }, [params, path, router]);

  const setWeek = (n: number) => {
    const next = new URLSearchParams(params);
    if (n) next.set('week', String(n));
    else next.delete('week');
    router.replace(next.size ? `${path}?${next}` : path, { scroll: false });
  };

  const pending = requests?.filter((r) => r.status === 'PENDING').length ?? 0;
  const showWeek = tab === 'upcoming' && view === 'week';
  const list = tab === 'past' ? past : upcoming;

  // The hour range comes from all loaded sessions so the grid keeps its shape from week to week.
  const all = [...(past ?? []), ...(upcoming ?? []), ...(weekList ?? [])].filter((s) => s.status === 'SCHEDULED');
  const inWeek = (weekList ?? []).filter((s) => s.status === 'SCHEDULED' && days.includes(wallClock(new Date(s.startsAt)).date));
  const [first, last] = [noon(days[0]), noon(days[6])];
  const sameMonth = days[0].slice(0, 7) === days[6].slice(0, 7);
  const range = t('weekRange', {
    start: `${l.day(first)} ${sameMonth ? String(Number(days[0].slice(8))) : l.dayMonth(first)}`,
    end: `${l.day(last)} ${l.dayMonth(last)}`,
  });
  const count = t('weekCount', { count: inWeek.length });

  const fill = (s: SessionDTO) => {
    if (s.status === 'CANCELLED') return '—';
    if (s.type === 'PRIVATE') return l.oneToOne();
    return s.booked >= s.capacity ? t('full') : l.fill(s);
  };
  const fullClass = (s: SessionDTO) => (s.type !== 'PRIVATE' && s.booked >= s.capacity ? styles.full : styles.fill);
  function tag(s: SessionDTO) {
    if (s.status === 'CANCELLED') return <PhaseTag s={s} />;
    return <TypeTag type={s.type} />;
  }

  return (
    <div className={`page stack ${styles.page}`}>
      <div className='between'>
        <div className='title'>{t('title')}</div>
        <button type='button' className='btn' onClick={() => setAdding(true)}>
          {t('add')}
        </button>
      </div>

      {notice && <Notice onClose={() => setNotice('')}>{notice}</Notice>}

      <div className={styles.toolbar}>
        <div className={styles.toolbarStart}>
          {tab === 'upcoming' && (
            <Segmented
              options={[
                [t('week'), 'week'],
                [t('list'), 'list'],
              ]}
              value={view}
              onChange={setView}
            />
          )}
          {showWeek && (
            <div className={styles.weekNav}>
              <button type='button' className={styles.arrow} disabled={week === 0} onClick={() => setWeek(week - 1)} aria-label={t('prevWeek')}>
                <span aria-hidden className={styles.flip}>
                  ‹
                </span>
              </button>
              <button type='button' className={styles.arrow} onClick={() => setWeek(week + 1)} aria-label={t('nextWeek')}>
                <span aria-hidden className={styles.flip}>
                  ›
                </span>
              </button>
              <div className={styles.weekLabel}>
                <span className={styles.range}>{range}</span>
                <span className={styles.weekSub}>{week === 0 ? t('thisWeek', { count }) : count}</span>
              </div>
            </div>
          )}
        </div>
        <div className='seg'>
          {(['upcoming', 'past', 'requests'] as const).map((k) => (
            <button key={k} type='button' className={tab === k ? `on ${styles.tab}` : styles.tab} onClick={() => setTab(k)}>
              {t(k)}
              {k === 'requests' && pending > 0 && <span className='nav-badge'>{pending}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'requests' && requests && (
        <RequestList
          role='coach'
          requests={requests}
          onChange={(r) => {
            setRequests(requests.map((x) => (x.id === r.id ? r : x)));
            // Accepting puts a private session on the calendar.
            if (r.status === 'ACCEPTED') setReload((n) => n + 1);
          }}
        />
      )}

      {showWeek && upcoming && past && weekList && (
        <>
          <WeekView days={days} sessions={inWeek} allSessions={all} />
          {inWeek.length === 0 && <div className={styles.emptyWeek}>{t.rich('emptyWeek', { add: actionLink(() => setAdding(true)) })}</div>}
        </>
      )}

      {tab !== 'requests' && !showWeek && list && (
        <>
          <div className={`table ${styles.cols} ${styles.desktop}`}>
            <div className='tr th'>
              <span>{t('head.session')}</span>
              <span>{t('head.when')}</span>
              <span>{t('head.type')}</span>
              <span>{t('head.booked')}</span>
              <span className={styles.end}>{t('head.price')}</span>
            </div>
            {list.map((s) => (
              <Link key={s.id} href={`/coach/sessions/${s.id}`} className='tr'>
                <span className={styles.titleCell}>
                  <bdi className={styles.sessionTitle}>{l.title(s)}</bdi>
                  <bdi className={styles.venue}>{s.venue.name}</bdi>
                </span>
                <span className='muted'>{l.when(s.startsAt)}</span>
                <span>{tag(s)}</span>
                <span className={fullClass(s)}>{fill(s)}</span>
                <span className={`${styles.end} ${styles.price}`}>{l.price(s.price)}</span>
              </Link>
            ))}
            {list.length === 0 && <div className='empty'>{t('empty')}</div>}
          </div>

          <div className={`${styles.cards} ${styles.mobile}`}>
            {list.map((s) => (
              <Link key={s.id} href={`/coach/sessions/${s.id}`} className={styles.card}>
                <span className={styles.cardTop}>
                  <span className={styles.titleCell}>
                    <bdi className={styles.sessionTitle}>{l.title(s)}</bdi>
                    <bdi className={styles.venue}>{s.venue.name}</bdi>
                  </span>
                  <span className={fullClass(s)}>{fill(s)}</span>
                </span>
                <span className={styles.cardBottom}>
                  <span className='muted'>{l.when(s.startsAt)}</span>
                  {tag(s)}
                  <span className={styles.cardPrice}>{l.price(s.price)}</span>
                </span>
              </Link>
            ))}
            {list.length === 0 && <div className='empty'>{t('empty')}</div>}
          </div>
        </>
      )}

      {adding && sports && venues && (
        <SessionDrawer
          sports={sports}
          venues={venues}
          onClose={() => setAdding(false)}
          onVenueAdded={(v) => setVenues((all) => [...(all ?? []), v])}
          onSaved={(saved) => {
            setAdding(false);
            setNotice(t('published', { count: saved.length }));
            setTab('upcoming');
            setReload((n) => n + 1);
          }}
        />
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
