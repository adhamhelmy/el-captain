import { readFileSync } from 'node:fs'
import { createFormatter, createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { formats } from '@/i18n/formats'
import { APP_TZ, INTL_LOCALE, type AppLocale } from '@/i18n/locale'
import { MESSAGES } from '@/i18n/messages'
import { coach, sessions } from './mock'
import { buildSessionText } from './session-text'

// Same inputs next-intl's hooks hand the component at runtime.
const make = (lang: AppLocale) =>
  buildSessionText(
    createTranslator({ locale: INTL_LOCALE[lang], messages: MESSAGES[lang], namespace: 'data' }),
    createFormatter({ locale: INTL_LOCALE[lang], timeZone: APP_TZ, formats }),
    lang,
  )
const en = make('en')
const ar = make('ar')
const s1 = sessions.find((s) => s.id === 1)! // Mon Oct 5, 6:30 AM, 16 cap, 12 booked

describe('sessionText en', () => {
  it('formats a session start', () => expect(en.when(s1)).toMatch(/^Mon · Oct 5 · 6:30\sAM$/))
  it('pluralises spots', () => {
    expect(en.spots({ ...s1, capacity: 16, booked: 15 })).toBe('1 spot left')
    expect(en.spots({ ...s1, capacity: 16, booked: 12 })).toBe('4 spots left')
    expect(en.spots({ ...s1, capacity: 16, booked: 16 })).toBe('Full')
  })
  it('labels private and past sessions', () => {
    expect(en.spots({ ...s1, type: 'private' })).toBe('One to one session')
    expect(en.spots({ ...s1, status: 'past', booked: 9 })).toBe('9 attended')
  })
  it('formats money, minutes and relative time', () => {
    expect(en.price(250)).toMatch(/^EGP\s250$/)
    expect(en.minutes(60)).toBe('60 min')
    expect(en.ago('2026-10-05T07:00:00-06:00')).toBe('2 hours ago')
    expect(en.monthYear('2026-02-15T12:00:00-07:00')).toBe('Feb 2026')
  })
  it('labels keys', () => {
    expect(en.category('circuit')).toBe('Circuit')
    expect(en.category('all')).toBe('All')
    expect(en.level('allLevels')).toBe('All levels')
  })
})

describe('sessionText ar', () => {
  it('uses Arabic words with Western digits', () => {
    const w = ar.when(s1)
    expect(w).toContain('5')
    expect(w).not.toMatch(/[٠-٩]/)
    expect(w).toMatch(/أكتوبر/)
    expect(ar.price(250)).not.toMatch(/[٠-٩]/)
    expect(ar.price(1250)).toMatch(/^\u200f?1,250\sج\.م\.\u200f?$/)
  })
  it('uses every Arabic plural form for spots', () => {
    const left = (n: number) => ar.spots({ ...s1, capacity: 200, booked: 200 - n })
    expect(left(0)).toBe('كامل العدد')
    expect(left(1)).toBe('مكان واحد فاضل')
    expect(left(2)).toBe('مكانين فاضلين')
    expect(left(3)).toBe('3 أماكن فاضلة')
    expect(left(11)).toBe('11 مكان فاضل')
    expect(left(100)).toBe('100 مكان فاضل')
  })
  it('pluralises minutes', () => {
    expect(ar.minutes(1)).toBe('دقيقة')
    expect(ar.minutes(2)).toBe('دقيقتين')
    expect(ar.minutes(5)).toBe('5 دقايق')
    expect(ar.minutes(45)).toBe('45 دقيقة')
  })
  it('labels keys', () => {
    expect(ar.category('yoga')).toBe('يوجا')
    expect(ar.type('group')).toBe('جماعي')
    expect(ar.category('circuit')).toBe('سيركيت')
  })
  it('searches title, coach name in both languages and the category in the active language', () => {
    const yoga = sessions.filter((s) => ar.searchText(s).includes('يوجا')).map((s) => s.category)
    expect(yoga.length).toBeGreaterThan(0)
    expect(new Set(yoga)).toEqual(new Set(['yoga']))
    expect(ar.searchText(s1)).toContain('Mariam Adel')
    expect(en.searchText(s1)).toContain('مريم عادل')
    expect(en.searchText(s1).toLowerCase()).toContain('yoga')
  })
  it('shows coach names in the active language', () => {
    expect(en.coachName(s1)).toBe('Mariam Adel')
    expect(ar.coachName(s1)).toBe('مريم عادل')
    expect(en.initials(coach(1)!)).toBe('MA')
    expect(ar.initials(coach(1)!)).toBe('م')
  })
})

describe('session-text bundle', () => {
  it('does not import the message files (the provider already ships the active locale)', () => {
    expect(readFileSync('lib/session-text.ts', 'utf8')).not.toMatch(/i18n\/messages/)
  })
})
