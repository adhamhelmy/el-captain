'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Field, Segmented, Table, TypeTag } from '@/components/ui';
import {
  coach,
  DAYS,
  fill,
  ME,
  sessionsOfCoach,
  startFor,
  weekdayKey,
  type DayKey,
  type Session,
} from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import styles from './page.module.css';

const EMPTY = {
  title: '',
  day: 'sat' as DayKey,
  time: '09:00',
  duration: '60',
  price: '',
  capacity: '12',
  type: 'group' as Session['type'],
};
function MySessions() {
  const t = useTranslations('schedule');
  const tc = useTranslations('common');
  const x = useSessionText();
  const me = coach(ME.coach)!;
  const [adding, setAdding] = useState(useSearchParams().has('add'));
  const [draft, setDraft] = useState(EMPTY);
  const [extra, setExtra] = useState<Session[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [view, setView] = useState<'table' | 'calendar'>('table');

  const all = [...sessionsOfCoach(me.id), ...extra];
  const list = all.filter((s) => (tab === 'upcoming') === (s.status === 'upcoming'));
  const edit = (patch: Partial<typeof draft>) => setDraft({ ...draft, ...patch });

  // Mock until wired up: POST /api/sessions
  function publish() {
    if (!draft.title.trim()) return;
    const capacity = draft.type === 'private' ? 1 : Number.parseInt(draft.capacity, 10) || 10;
    setExtra([
      ...extra,
      {
        id: 1000 + extra.length,
        title: draft.title,
        category: me.specialty,
        coachId: me.id,
        type: draft.type,
        level: draft.type === 'private' ? 'private' : 'allLevels',
        duration: Number.parseInt(draft.duration, 10) || 60,
        price: Number.parseInt(draft.price, 10) || 0,
        capacity,
        booked: 0,
        start: startFor(draft.day, draft.time || '09:00'),
        status: 'upcoming',
        description: 'New session.',
      },
    ]);
    setDraft(EMPTY);
    setAdding(false);
  }

  return (
    <div className={`page stack ${styles.page}`}>
      <div className='between'>
        <div className='title'>{t('title')}</div>
        <button type='button' className='btn' onClick={() => setAdding(!adding)}>
          {adding ? tc('close') : t('add')}
        </button>
      </div>

      {adding && (
        <div className={`card stack ${styles.form}`}>
          <div className={`between ${styles.formHead}`}>
            <div className='h3'>{t('newSession')}</div>
            <Segmented
              inset
              options={[
                [x.type('group'), 'group'],
                [t('privateOneOnOne'), 'private'],
              ]}
              value={draft.type}
              onChange={(type) => edit({ type })}
            />
          </div>
          <div className={styles.fields}>
            <Field label={t('fieldTitle')} className={styles.wide}>
              <input
                className='input'
                value={draft.title}
                onChange={(e) => edit({ title: e.target.value })}
                placeholder={t('titlePlaceholder')}
              />
            </Field>
            <Field label={t('day')}>
              <select
                className='input'
                value={draft.day}
                onChange={(e) => edit({ day: e.target.value as DayKey })}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {x.day(startFor(d, '12:00'))}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('start')}>
              <input
                type='time'
                className='input'
                value={draft.time}
                onChange={(e) => edit({ time: e.target.value })}
              />
            </Field>
            <Field label={t('duration')}>
              <input
                className='input'
                value={draft.duration}
                onChange={(e) => edit({ duration: e.target.value })}
              />
            </Field>
            <Field label={t('price')}>
              <input
                className='input'
                value={draft.price}
                onChange={(e) => edit({ price: e.target.value })}
              />
            </Field>
            {draft.type === 'group' && (
              <Field label={t('capacity')}>
                <input
                  className='input'
                  value={draft.capacity}
                  onChange={(e) => edit({ capacity: e.target.value })}
                />
              </Field>
            )}
          </div>
          <div className={styles.actions}>
            <button
              type='button'
              className={`btn ${styles.publish}`}
              onClick={publish}
            >
              {t('publish')}
            </button>
            <button
              type='button'
              className={`btn-ghost ${styles.cancel}`}
              onClick={() => setAdding(false)}
            >
              {tc('cancel')}
            </button>
          </div>
        </div>
      )}

      <div className={`between ${styles.toolbar}`}>
        <Segmented
          options={[
            [t('upcoming'), 'upcoming'],
            [t('past'), 'past'],
          ]}
          value={tab}
          onChange={setTab}
        />
        <Segmented
          options={[
            [t('table'), 'table'],
            [t('calendar'), 'calendar'],
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === 'table' ? (
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
          {list.map((s) => (
            <Link
              key={s.id}
              href={`/coach/sessions/${s.id}`}
              className={`tr ${styles.row}`}
            >
              <span dir='auto' className={styles.title}>
                {s.title}
              </span>
              <span className='muted'>{x.when(s)}</span>
              <span>
                <TypeTag s={s} />
              </span>
              <span className='muted'>{fill(s)}</span>
              <span className={styles.price}>{x.price(s.price)}</span>
            </Link>
          ))}
          {list.length === 0 && (
            <div className={`empty ${styles.empty}`}>
              {t('empty')}
            </div>
          )}
        </Table>
      ) : (
        <div className={styles.calendarScroll}>
          <div className={styles.calendar}>
            {DAYS.map((d) => (
              <div key={d} className={`stack ${styles.day}`}>
                <div className={`dim overline ${styles.dayName}`}>
                  {x.day(startFor(d, '12:00'))}
                </div>
                <div className={`stack ${styles.dayBody}`}>
                  {list
                    .filter((s) => weekdayKey(s.start) === d)
                    .map((s) => (
                      <Link
                        key={s.id}
                        href={`/coach/sessions/${s.id}`}
                        className={`tag-${s.type === 'group' ? 'accent' : 'warn'} ${styles.event}`}
                      >
                        <div className={styles.eventMeta}>{x.time(s.start)}</div>
                        <div dir='auto' className={styles.eventTitle}>
                          {s.title}
                        </div>
                        <div className={styles.eventMeta}>
                          {s.type === 'private' ? x.oneToOne() : fill(s)}
                        </div>
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
