import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { appLocale, type AppLocale } from '@/i18n/locale';
import type { SessionDTO, SportDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import { hasStarted, type SessionLevel } from '@/lib/shared/session-rules';

type DataT = ReturnType<typeof useTranslations<'data'>>;
type Formatter = ReturnType<typeof useFormatter>;
type At = Date | string;
/** The session fields the labels read; DTO dates may still be ISO strings. */
export type SessionLike = Pick<SessionDTO, 'type' | 'title' | 'capacity' | 'booked'> & { startsAt: At; sport: Pick<SportDTO, 'nameEn' | 'nameAr'> };

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
    time: (at: At) => f.dateTime(d(at), 'time'),
    monthYear: (at: At) => f.dateTime(d(at), 'monthYear'),
    ago: (at: At, now = new Date()) => f.relativeTime(d(at), now),
    price: (n: number) => f.number(n, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }),
    minutes: (count: number) => t('minutes', { count }),
    oneToOne: () => t('oneOnOneShort'),
    type: (type: SessionDTO['type']) => t(type === 'PRIVATE' ? 'type.private' : 'type.group'),
    level: (level: SessionLevel) => t(`level.${LEVEL_KEY[level]}`),
    sport: (s: Pick<SportDTO, 'nameEn' | 'nameAr'>) => sportName(s, lang),
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

/** Same labels in a component, from the request's locale and formats. */
export const useSessionLabels = () => buildSessionLabels(useTranslations('data'), useFormatter(), appLocale(useLocale()));
