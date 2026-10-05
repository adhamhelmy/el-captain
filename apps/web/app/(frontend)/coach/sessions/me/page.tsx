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

const EMPTY = {
  title: '',
  day: 'sat' as DayKey,
  time: '09:00',
  duration: '60',
  price: '',
  capacity: '12',
  type: 'group' as Session['type'],
};
const COLS = 'minmax(0,2.2fr) minmax(0,1.6fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,0.6fr)';

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
    <div className='page stack' style={{ gap: 24 }}>
      <div className='between'>
        <div className='title'>{t('title')}</div>
        <button type='button' className='btn' onClick={() => setAdding(!adding)}>
          {adding ? tc('close') : t('add')}
        </button>
      </div>

      {adding && (
        <div className='card stack' style={{ gap: 18 }}>
          <div className='between' style={{ alignItems: 'center' }}>
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
            }}
          >
            <Field label={t('fieldTitle')} style={{ gridColumn: '1 / -1' }}>
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
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type='button'
              className='btn'
              style={{ padding: '12px 22px', borderRadius: 8 }}
              onClick={publish}
            >
              {t('publish')}
            </button>
            <button
              type='button'
              className='btn-ghost'
              style={{
                padding: '12px 22px',
                borderRadius: 8,
                color: 'var(--text-2)',
                fontWeight: 400,
              }}
              onClick={() => setAdding(false)}
            >
              {tc('cancel')}
            </button>
          </div>
        </div>
      )}

      <div className='between' style={{ alignItems: 'center', gap: 12 }}>
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
          cols={COLS}
          head={[
            t('head.session'),
            t('head.when'),
            t('head.type'),
            t('head.booked'),
            <span key='p' style={{ display: 'block', textAlign: 'end' }}>
              {t('head.price')}
            </span>,
          ]}
        >
          {list.map((s) => (
            <Link
              key={s.id}
              href={`/coach/sessions/${s.id}`}
              className='tr'
              style={{ padding: '16px 20px' }}
            >
              <span dir='auto' style={{ fontWeight: 700 }}>
                {s.title}
              </span>
              <span className='muted'>{x.when(s)}</span>
              <span>
                <TypeTag s={s} />
              </span>
              <span className='muted'>{fill(s)}</span>
              <span style={{ textAlign: 'end', fontWeight: 700 }}>{x.price(s.price)}</span>
            </Link>
          ))}
          {list.length === 0 && (
            <div className='empty' style={{ padding: 48 }}>
              {t('empty')}
            </div>
          )}
        </Table>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))',
              gap: 10,
              minWidth: 860,
            }}
          >
            {DAYS.map((d) => (
              <div key={d} className='stack' style={{ gap: 8 }}>
                <div className='dim overline' style={{ textAlign: 'center' }}>
                  {x.day(startFor(d, '12:00'))}
                </div>
                <div
                  className='stack'
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    minHeight: 280,
                    padding: 8,
                    gap: 6,
                  }}
                >
                  {list
                    .filter((s) => weekdayKey(s.start) === d)
                    .map((s) => (
                      <Link
                        key={s.id}
                        href={`/coach/sessions/${s.id}`}
                        className={`tag-${s.type === 'group' ? 'accent' : 'warn'}`}
                        style={{ display: 'block', padding: '8px 10px', borderRadius: 8 }}
                      >
                        <div style={{ fontSize: 11, opacity: 0.8 }}>{x.time(s.start)}</div>
                        <div dir='auto' style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
                          {s.title}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>
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
