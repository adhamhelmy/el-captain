import { fromWallClock, wallClock } from '@el-captain/rules/app-time';
import { to12, to24, type Period } from '@el-captain/rules/clock12';
import { hasStarted, type SessionDraft } from '@el-captain/rules/session-rules';
import { latinDigits, typedDate, typedTime } from '@/account/typed-date';
import type { Session, Sport, Venue } from '@/api/types';

/** The session form's fields as typed, before parsing (the web's SessionDrawer Draft). */
export type FormDraft = Record<
  'title' | 'description' | 'sportId' | 'venueId' | 'level' | 'date' | 'time' | 'duration' | 'price' | 'capacity' | 'repeat',
  string
>;

export const blankDraft = (sports: Sport[], venues: Venue[]): FormDraft => ({
  title: '',
  description: '',
  sportId: sports[0]?.id ?? '',
  venueId: venues[0]?.id ?? '',
  level: 'ALL_LEVELS',
  date: '',
  time: '',
  duration: '60',
  price: '',
  capacity: '12',
  repeat: '1',
});

export const draftOf = (s: Session): FormDraft => ({
  title: s.title,
  description: s.description ?? '',
  sportId: s.sport.id,
  venueId: s.venue.id,
  level: s.level ?? 'ALL_LEVELS',
  ...wallClock(new Date(s.startsAt)),
  duration: String(s.durationMin),
  price: String(s.price),
  capacity: String(s.capacity),
  repeat: '1',
});

const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(latinDigits(v)));

/** The typed form as the shared rules check it. A date or time that can't be read gives no start. */
export function toSessionDraft(d: FormDraft): SessionDraft {
  const date = typedDate(d.date);
  const time = typedTime(d.time);
  return {
    title: d.title,
    description: d.description,
    sportId: d.sportId,
    venueId: d.venueId,
    level: d.level,
    startsAt: date && time ? fromWallClock({ date, time }) : null,
    durationMin: num(d.duration),
    price: num(d.price),
    capacity: num(d.capacity),
    repeatWeeks: num(d.repeat),
  };
}

/**
 * The start to send. Unchanged date and time keep the exact instant: on the night clocks go back,
 * 1:30 happens twice and reading it again could move the session by an hour.
 */
export function startInstant(session: Session | undefined, d: Pick<FormDraft, 'date' | 'time'>, picked: Date) {
  const original = session && wallClock(new Date(session.startsAt));
  const untouched = !!original && original.date === typedDate(d.date) && original.time === typedTime(d.time);
  return session && untouched ? session.startsAt : picked.toISOString();
}

/** The list, plus the edited session's own item if it isn't there (an archived venue, a sport no longer approved). */
export const withOwn = <T extends { id: string }>(list: T[], own?: T) => (own && !list.some((x) => x.id === own.id) ? [...list, own] : list);

type FillLabels = { oneToOne: () => string; fill: (s: { booked: number; capacity: number }) => string };

/** How full a session is, as the coach's lists show it. */
export function fillLabel(s: Pick<Session, 'type' | 'status' | 'booked' | 'capacity'>, l: FillLabels, full: string) {
  if (s.status === 'CANCELLED') return '—';
  if (s.type === 'PRIVATE') return l.oneToOne();
  return s.booked >= s.capacity ? full : l.fill(s);
}

/** One client's numbers from their sessions with the coach (newest first), as the web's client page works them out. */
export function clientSummary(sessions: Session[], now = new Date()) {
  const held = sessions.filter((s) => s.status === 'SCHEDULED');
  const attended = held.filter((s) => hasStarted(s.startsAt, now));
  return {
    attended: attended.length,
    upcoming: held.length - attended.length,
    spent: attended.reduce((sum, s) => sum + s.price, 0),
    first: held.at(-1),
  };
}

/**
 * A typed start time as 'HH:MM'. 1–12 o'clock follows the AM/PM toggle (the web's PeriodToggle);
 * a 24-hour time (0:xx, 13:xx and later) is taken as typed. Null when it can't be read.
 */
export function timeWithPeriod(raw: string, period: Period): string | null {
  const time = typedTime(raw);
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return h >= 1 && h <= 12 ? to24({ hour: h, minute: m, period }) : time;
}

/** A saved 'HH:MM' as the field shows it: '6:30' and PM. */
export function clockText(time: string): { text: string; period: Period } {
  const c = to12(time);
  return c ? { text: `${c.hour}:${String(c.minute).padStart(2, '0')}`, period: c.period } : { text: time, period: 'PM' };
}
