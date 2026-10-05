import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { appLocale, type AppLocale } from '@/i18n/locale'
import {
  coach,
  NOW,
  type Category,
  type Coach,
  type Level,
  type Session,
  type SessionType,
} from './mock'

type DataT = ReturnType<typeof useTranslations<'data'>>
type Formatter = ReturnType<typeof useFormatter>

/** Localized labels for mock data, built from a translator for the `data` namespace, a formatter and the app locale. */
export function buildSessionText(t: DataT, f: Formatter, lang: AppLocale) {
  const d = (iso: string) => new Date(iso)
  const text = {
    day: (iso: string) => f.dateTime(d(iso), 'weekday'),
    dayMonth: (iso: string) => f.dateTime(d(iso), 'dayMonth'),
    time: (iso: string) => f.dateTime(d(iso), 'time'),
    monthYear: (iso: string) => f.dateTime(d(iso), 'monthYear'),
    ago: (iso: string) => f.relativeTime(d(iso), d(NOW)),
    price: (n: number) =>
      f.number(n, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }),
    name: (c: Coach) => (lang === 'ar' ? c.nameAr : c.name),
    coachName: (s: Session) => text.name(coach(s.coachId)!),
    /** What search matches: title, the coach in both spellings, and the category in this language. */
    searchText: (s: Session) => {
      const c = coach(s.coachId)!
      return `${s.title} ${c.name} ${c.nameAr} ${text.category(s.category)}`
    },
    /** Arabic avatars show the first letter only; two joined Arabic letters read as a word. */
    initials: (c: Coach) => (lang === 'ar' ? c.nameAr[0] : c.initials),
    minutes: (count: number) => t('minutes', { count }),
    oneToOne: () => t('oneOnOneShort'),
    type: (type: SessionType) => t(`type.${type}`),
    category: (c: Category | 'all') => (c === 'all' ? t('all') : t(`category.${c}`)),
    level: (l: Level) => t(`level.${l}`),
    when: (s: Session) =>
      t('when', { day: text.day(s.start), date: text.dayMonth(s.start), time: text.time(s.start) }),
    spots: (s: Session) => {
      if (s.type === 'private') return t('oneOnOne')
      if (s.status === 'past') return t('attended', { count: s.booked })
      return t('spotsLeft', { count: s.capacity - s.booked })
    },
  }
  return text
}

export type SessionText = ReturnType<typeof buildSessionText>

/** Same labels in a component (server or client, not async), from the request's locale and formats. */
export const useSessionText = () =>
  buildSessionText(useTranslations('data'), useFormatter(), appLocale(useLocale()))
