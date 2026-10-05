import { describe, expect, it } from 'vitest'
import { appLocale, INTL_LOCALE, isAppLocale, isolate, resolveLocale } from './locale'

describe('resolveLocale', () => {
  it('prefers a valid cookie over the header', () => {
    expect(resolveLocale('ar', 'en-US,en;q=0.9')).toBe('ar')
    expect(resolveLocale('en', 'ar-EG,ar;q=0.9')).toBe('en')
  })
  it('ignores an invalid cookie', () => {
    expect(resolveLocale('fr', 'ar-EG')).toBe('ar')
    expect(resolveLocale('AR', null)).toBe('en')
    expect(resolveLocale('', null)).toBe('en')
  })
  it('picks the highest-q supported language from the header', () => {
    expect(resolveLocale(undefined, 'ar-EG,ar;q=0.9,en;q=0.8')).toBe('ar')
    expect(resolveLocale(undefined, 'ar-EG;q=0.1, en;q=0.9')).toBe('en')
    expect(resolveLocale(undefined, 'fr-FR,fr;q=0.9,ar;q=0.5')).toBe('ar')
    expect(resolveLocale(undefined, 'AR-sa')).toBe('ar')
  })
  it('falls back to en', () => {
    expect(resolveLocale(undefined, null)).toBe('en')
    expect(resolveLocale(undefined, '')).toBe('en')
    expect(resolveLocale(undefined, '*')).toBe('en')
    expect(resolveLocale(undefined, 'de;q=abc')).toBe('en')
  })
})

describe('locale helpers', () => {
  it('maps app and intl locales both ways', () => {
    expect(INTL_LOCALE.ar).toBe('ar-EG-u-nu-latn')
    expect(appLocale(INTL_LOCALE.ar)).toBe('ar')
    expect(appLocale(INTL_LOCALE.en)).toBe('en')
    expect(isAppLocale('ar')).toBe(true)
    expect(isAppLocale('ar-EG')).toBe(false)
  })
})

describe('isolate', () => {
  it('wraps user text in first-strong isolates so it keeps its own direction', () => {
    expect(isolate('Denver, CO')).toBe('⁨Denver, CO⁩')
  })
})
