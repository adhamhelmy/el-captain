'use client';
import Link from 'next/link';
import { cssVars } from '@/lib/client/css-vars';
import { useSessionLabels } from '@/lib/client/session-labels';
import { hourRange, layoutDay } from '@/lib/client/week-grid';
import type { SessionDTO } from '@/lib/server/dto';
import { fromWallClock, wallClock } from '@/lib/shared/app-time';
import styles from './WeekView.module.css';

/**
 * One week, Saturday to Friday: a time grid on desktop, a list of the days that have sessions on phones.
 * `allSessions` sets the hour range, so it stays the same from week to week.
 */
export function WeekView({ days, sessions, allSessions }: Readonly<{ days: string[]; sessions: SessionDTO[]; allSessions: SessionDTO[] }>) {
  const l = useSessionLabels();
  const today = wallClock(new Date()).date;
  const { start, end } = hourRange(allSessions);
  const hours = Array.from({ length: end - start }, (_, i) => start + i);
  const byDay = (day: string) =>
    sessions.filter((s) => wallClock(new Date(s.startsAt)).date === day).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const fill = (s: SessionDTO) => (s.type === 'PRIVATE' ? l.oneToOne() : l.fill(s));
  const kind = (s: SessionDTO) => (s.type === 'PRIVATE' ? styles.private : styles.group);
  const head = (day: string, className: string) => {
    const at = fromWallClock({ date: day, time: '12:00' })!;
    let num = styles.num;
    if (day === today) num += ` ${styles.today}`;
    else if (day < today) num += ` ${styles.past}`;
    return (
      <div className={className}>
        <span className={day === today ? `${styles.name} ${styles.nameToday}` : styles.name}>{l.day(at)}</span>
        <span className={num}>{Number(day.slice(8))}</span>
      </div>
    );
  };

  return (
    <>
      <div className={styles.grid} ref={cssVars({ hours: hours.length })}>
        <div className={styles.headRow}>
          <div />
          {days.map((day) => (
            <div key={day}>{head(day, styles.head)}</div>
          ))}
        </div>
        <div className={styles.body}>
          <div className={styles.axis}>
            {hours.map((h) => (
              <div key={h} className={styles.hour}>
                {(h - start) % 2 === 0 && (
                  <span>{l.time(fromWallClock({ date: days[0], time: `${String(h).padStart(2, '0')}:00` }) ?? new Date())}</span>
                )}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const list = byDay(day);
            const placed = new Map(layoutDay(list, start).map((p) => [p.id, p]));
            return (
              <div key={day} className={day === today ? `${styles.col} ${styles.colToday}` : styles.col}>
                {list.map((s) => {
                  const p = placed.get(s.id)!;
                  const tip = `${l.time(s.startsAt)} · ${l.title(s)} · ${fill(s)}`;
                  return (
                    <Link
                      key={s.id}
                      href={`/coach/sessions/${s.id}`}
                      title={tip}
                      className={`${styles.event} ${kind(s)}`}
                      ref={cssVars({ top: p.top, height: p.height, col: p.col, cols: p.cols })}
                    >
                      <bdi className={styles.eventTitle}>{l.title(s)}</bdi>
                      <span className={styles.eventMeta}>
                        <span className={styles.eventTime}>{l.time(s.startsAt)}</span>
                        <span className={styles.eventFill}>{fill(s)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.agenda}>
        {days
          .filter((day) => byDay(day).length)
          .map((day) => (
            <div key={day} className={styles.agendaDay}>
              {head(day, styles.agendaHead)}
              {byDay(day).map((s) => (
                <Link key={s.id} href={`/coach/sessions/${s.id}`} className={`${styles.agendaRow} ${kind(s)}`}>
                  <span className={styles.agendaTime}>{l.time(s.startsAt)}</span>
                  <bdi className={styles.agendaTitle}>{l.title(s)}</bdi>
                  <span className={styles.agendaFill}>{fill(s)}</span>
                </Link>
              ))}
            </div>
          ))}
      </div>
    </>
  );
}
