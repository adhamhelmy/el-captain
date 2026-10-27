'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useFormatter, useTranslations } from 'next-intl';
import { Notice } from '@/components/Drawer';
import { SessionDrawer } from '@/components/SessionDrawer';
import { StatRow } from '@/components/StatRow';
import { SectionHead } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { getOnboarding } from '@/lib/client/coach-api';
import { setupComplete, setupHiddenKey, setupSteps } from '@/lib/client/coach-setup';
import { coachStats, type CoachStats } from '@/lib/client/insights-api';
import { acceptRequest, listVenues, myRequests, mySessions, rejectRequest, REQUESTS_CHANGED } from '@/lib/client/session-api';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { CoachDTO, RequestDTO, SessionDTO, SportDTO, VenueDTO } from '@/lib/server/dto';
import styles from './page.module.css';

export default function CoachDashboard() {
  const t = useTranslations('coachDashboard');
  const ts = useTranslations('schedule');
  const tr = useTranslations('requests');
  const te = useTranslations('errors');
  const tcl = useTranslations('clients');
  const l = useSessionLabels();
  const f = useFormatter();
  const name = useSession().data?.user.name ?? '';
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [upcoming, setUpcoming] = useState<SessionDTO[] | null>(null);
  const [pastCount, setPastCount] = useState(0);
  const [requests, setRequests] = useState<RequestDTO[]>([]);
  const [coach, setCoach] = useState<CoachDTO | null>(null);
  const [venues, setVenues] = useState<VenueDTO[] | null>(null);
  const [hidden, setHidden] = useState(true);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    void getOnboarding().then((r) => {
      if (!r.ok) return;
      setCoach(r.data.coach);
      // localStorage only exists in the browser, so the card's state is read once the coach is known.
      setHidden(localStorage.getItem(setupHiddenKey(r.data.coach.id)) === '1');
    });
    void listVenues().then((r) => setVenues(r.ok ? r.data.filter((v) => !v.archived) : []));
    void myRequests().then((r) => r.ok && setRequests(r.data.filter((x) => x.status === 'PENDING')));
  }, []);

  useEffect(() => {
    void coachStats().then((r) => r.ok && setStats(r.data));
    void mySessions('upcoming').then((r) => setUpcoming(r.ok ? r.data.filter((s) => s.status === 'SCHEDULED') : []));
    void mySessions('past').then((r) => r.ok && setPastCount(r.data.length));
  }, [reload]);

  async function answer(r: RequestDTO, accept: boolean) {
    setBusy(r.id);
    setError('');
    const res = accept ? await acceptRequest(r.id) : await rejectRequest(r.id);
    setBusy('');
    if (!res.ok) return setError(te(res.code === 'request_closed' || res.code === 'time_conflict' ? res.code : 'generic'));
    setRequests((list) => list.filter((x) => x.id !== r.id));
    globalThis.dispatchEvent(new Event(REQUESTS_CHANGED));
    if (accept) setReload((n) => n + 1);
  }

  const hide = () => {
    if (coach) localStorage.setItem(setupHiddenKey(coach.id), '1');
    setHidden(true);
  };

  const steps =
    coach && venues && upcoming
      ? setupSteps({
          venueCount: venues.length,
          sessionCount: upcoming.length + pastCount,
          privatePrice: coach.privatePrice,
          privateDuration: coach.privateDuration,
        })
      : null;
  const doneCount = steps?.filter((s) => s.done).length ?? 0;
  const trackWidth = styles['d' + doneCount];
  const sports: SportDTO[] = coach?.sports.filter((s) => s.status === 'APPROVED') ?? [];

  const fill = (s: SessionDTO) => {
    if (s.type === 'PRIVATE') return l.oneToOne();
    return s.booked >= s.capacity ? ts('full') : l.fill(s);
  };

  return (
    <div className={`page stack ${styles.page}`}>
      <div className='between'>
        <div>
          <div className={`muted ${styles.welcome}`}>{t('welcome')}</div>
          <div className='title'>{t('title', { name: isolate(name.split(' ')[0].toUpperCase()) })}</div>
        </div>
        <button type='button' className='btn' onClick={() => setAdding(true)}>
          {ts('add')}
        </button>
      </div>

      {notice && <Notice onClose={() => setNotice('')}>{notice}</Notice>}

      {/* Shown until the coach hides it or finishes every step. */}
      {steps && !hidden && !setupComplete(steps) && (
        <div className={styles.setup}>
          <div className={styles.setupHead}>
            <div>
              <div className={styles.setupTitle}>{t('setup.title')}</div>
              <div className={styles.setupCount}>{t('setup.count', { done: doneCount, total: steps.length })}</div>
            </div>
            <button type='button' className={styles.hide} onClick={hide}>
              {t('setup.hide')}
            </button>
          </div>
          <div className={styles.track}>
            <div className={`${styles.trackFill} ${trackWidth}`} />
          </div>
          <div className={styles.tiles}>
            {steps.map((s) => {
              const content = (
                <>
                  <span className={s.done ? `${styles.dot} ${styles.dotDone}` : styles.dot} aria-hidden>
                    {s.done ? '✓' : ''}
                  </span>
                  <span>{t(`setup.${s.key}`)}</span>
                </>
              );
              if (s.done || !s.href)
                return (
                  <div key={s.key} className={`${styles.tile} ${styles.tileDone}`}>
                    {content}
                  </div>
                );
              return (
                <Link key={s.key} href={s.href} className={styles.tile}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {stats && (
        <StatRow
          items={[
            [stats.bookingsNext7, t('stats.bookings')],
            [
              <>
                {f.number(stats.earnings30)}
                <small>{tcl('egp')}</small>
              </>,
              t('stats.revenue'),
            ],
            [stats.fillRate === null ? '—' : `${stats.fillRate}%`, t('stats.fill')],
          ]}
        />
      )}

      <div className={styles.columns}>
        <div className={styles.column}>
          <SectionHead title={t('comingUp')} href='/coach/sessions/me' link={t('schedule')} />
          {upcoming?.length === 0 && <div className={styles.none}>{t('nothingUpcoming')}</div>}
          {upcoming?.slice(0, 4).map((s) => (
            <Link key={s.id} href={`/coach/sessions/${s.id}`} className={styles.session}>
              <span className={styles.date}>
                <span className={styles.dow}>{l.day(s.startsAt)}</span>
                <span className={styles.dnum}>{l.dayNum(s.startsAt)}</span>
              </span>
              <span className={styles.sessionText}>
                <bdi className={styles.sessionTitle}>{l.title(s)}</bdi>
                <span className={styles.sessionSub}>
                  {l.time(s.startsAt)} · <bdi>{s.venue.name}</bdi>
                </span>
              </span>
              <span className={s.type !== 'PRIVATE' && s.booked >= s.capacity ? styles.full : styles.fill}>{fill(s)}</span>
            </Link>
          ))}
        </div>

        <div className={styles.column}>
          <SectionHead title={t('requestsTitle')} href='/coach/sessions/me?tab=requests' link={t('allRequests')} />
          {error && <div className={styles.error}>{error}</div>}
          {requests.length === 0 && <div className={styles.none}>{t('noRequests')}</div>}
          {requests.slice(0, 3).map((r) => (
            <div key={r.id} className={styles.request}>
              <div>
                <bdi className={styles.requestName}>{r.member.name}</bdi>
                <div className={styles.sessionSub}>{tr('line', { sport: l.sport(r.sport), when: l.when(r.startsAt), place: r.venue.name })}</div>
              </div>
              <div className={styles.requestActions}>
                <button type='button' className='btn sm' disabled={busy === r.id} onClick={() => answer(r, true)}>
                  {tr('accept')}
                </button>
                <button type='button' className='btn-ghost sm' disabled={busy === r.id} onClick={() => answer(r, false)}>
                  {tr('reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {adding && coach && venues && (
        <SessionDrawer
          sports={sports}
          venues={venues}
          onClose={() => setAdding(false)}
          onVenueAdded={(v) => setVenues((all) => [...(all ?? []), v])}
          onSaved={(saved) => {
            setAdding(false);
            setNotice(ts('published', { count: saved.length }));
            setReload((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
