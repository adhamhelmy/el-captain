/** Localized session labels (time, price, spots, titles) shared by the web and the mobile app. */
import { sportName } from './coach-rules';
import { hasStarted, type SessionLevel } from './session-rules';

/**
 * A translator for the `data` messages and a formatter, as next-intl (web) and use-intl (mobile) hand them out.
 * Typed loosely so both libraries' strongly typed versions fit.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataT = (key: any, values?: any) => string;
/* eslint-disable @typescript-eslint/no-explicit-any */
type Formatter = {
  dateTime: (d: Date, format: any) => string;
  number: (n: number, options: any) => string;
  relativeTime: (d: Date, now: Date) => string;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
type AppLocale = 'en' | 'ar';
type SportNames = { nameEn: string; nameAr: string | null };
/** The session fields the labels read; JSON dates may still be ISO strings. */
type SessionDTO = { type: 'GROUP' | 'PRIVATE'; title: string; capacity: number; booked: number };
type At = Date | string;
export type SessionLike = SessionDTO & { startsAt: At; sport: SportNames };

const LEVEL_KEY = { ALL_LEVELS: 'allLevels', BEGINNER: 'beginner', INTERMEDIATE: 'intermediate', ADVANCED: 'advanced' } as const satisfies Record<
  SessionLevel,
  string
>;

/** Localized labels for real sessions, built from a translator for the `data` namespace, a formatter and the app locale. */
export function buildSessionLabels(t: DataT, f: Formatter, lang: AppLocale) {
  const d = (at: At) => new Date(at);
  const l = {
    day: (at: At) => f.dateTime(d(at), 'weekday'),
    dayMonth: (at: At) => f.dateTime(d(at), 'dayMonth'),
    dayNum: (at: At) => f.dateTime(d(at), { day: 'numeric' }),
    time: (at: At) => f.dateTime(d(at), 'time'),
    monthYear: (at: At) => f.dateTime(d(at), 'monthYear'),
    ago: (at: At, now = new Date()) => f.relativeTime(d(at), now),
    price: (n: number) => f.number(n, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }),
    minutes: (count: number) => t('minutes', { count }),
    oneToOne: () => t('oneOnOneShort'),
    type: (type: SessionDTO['type']) => t(type === 'PRIVATE' ? 'type.private' : 'type.group'),
    level: (level: SessionLevel) => t(`level.${LEVEL_KEY[level]}`),
    sport: (s: SportNames) => sportName(s, lang),
    /** Private sessions are named by their sport in the reader's language; group sessions by their title. */
    title: (s: Pick<SessionLike, 'type' | 'title' | 'sport'>) => (s.type === 'PRIVATE' ? t('privateTitle', { sport: l.sport(s.sport) }) : s.title),
    when: (at: At) => t('when', { day: l.day(at), date: l.dayMonth(at), time: l.time(at) }),
    fill: (s: Pick<SessionLike, 'booked' | 'capacity'>) => `${s.booked}/${s.capacity}`,
    spots: (s: SessionLike, now = new Date()) => {
      if (s.type === 'PRIVATE') return t('oneOnOne');
      if (hasStarted(s.startsAt, now)) return t('attended', { count: s.booked });
      return t('spotsLeft', { count: Math.max(s.capacity - s.booked, 0) });
    },
  };
  return l;
}

export type SessionLabels = ReturnType<typeof buildSessionLabels>;

