/** Placing sessions on the coach's week grid. No React; the page turns these numbers into CSS variables. */
import { wallClock } from '@/lib/shared/app-time';

type Timed = { id: string; startsAt: Date | string; durationMin: number };

const minutesOf = (at: Date | string) => {
  const [h, m] = wallClock(new Date(at)).time.split(':').map(Number);
  return h * 60 + m;
};

/** Hours shown when the coach has nothing on the calendar yet. */
export const DEFAULT_HOURS = { start: 7, end: 21 } as const;

/**
 * The grid's hour range: the earliest start (rounded down) to the latest end (rounded up) across all the coach's sessions,
 * so the grid doesn't jump from week to week.
 */
export function hourRange(sessions: Timed[]): { start: number; end: number } {
  if (!sessions.length) return { ...DEFAULT_HOURS };
  const starts = sessions.map((s) => minutesOf(s.startsAt));
  // A session running past midnight is drawn to the end of the day.
  const ends = sessions.map((s) => Math.min(minutesOf(s.startsAt) + s.durationMin, 24 * 60));
  return { start: Math.floor(Math.min(...starts) / 60), end: Math.ceil(Math.max(...ends) / 60) };
}

export type Placed = { id: string; top: number; height: number; col: number; cols: number };

/**
 * Where each session of one day sits: `top` and `height` in hours from the grid start, and when sessions overlap,
 * which of `cols` side-by-side slots it takes.
 */
export function layoutDay(sessions: Timed[], startHour: number): Placed[] {
  const items = sessions
    .map((s) => ({ id: s.id, from: minutesOf(s.startsAt), to: minutesOf(s.startsAt) + s.durationMin }))
    .sort((a, b) => a.from - b.from || a.to - b.to);
  const placed: Placed[] = [];
  // Walk clusters of sessions that overlap each other, giving each the first free slot.
  let cluster: { id: string; from: number; to: number; col: number }[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols = Math.max(0, ...cluster.map((c) => c.col)) + 1;
    for (const c of cluster) placed.push({ id: c.id, top: c.from / 60 - startHour, height: (c.to - c.from) / 60, col: c.col, cols });
    cluster = [];
  };
  for (const it of items) {
    if (it.from >= clusterEnd && cluster.length) flush();
    const taken = new Set(cluster.filter((c) => c.to > it.from).map((c) => c.col));
    let col = 0;
    while (taken.has(col)) col++;
    cluster.push({ ...it, col });
    clusterEnd = Math.max(clusterEnd, it.to);
  }
  if (cluster.length) flush();
  return placed;
}
