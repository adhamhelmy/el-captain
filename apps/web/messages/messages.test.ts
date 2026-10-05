import { describe, expect, it } from 'vitest'
import { IntlMessageFormat } from 'intl-messageformat'
import { INTL_LOCALE } from '@/i18n/locale'
import ar from './ar.json'
import en from './en.json'

type Tree = { [k: string]: string | Tree }
const flat = (o: Tree, p = ''): Record<string, string> =>
  Object.entries(o).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = p ? `${p}.${k}` : k
    return typeof v === 'string' ? { ...acc, [key]: v } : { ...acc, ...flat(v, key) }
  }, {})

const EN = flat(en as Tree)
const AR = flat(ar as Tree)

describe('messages', () => {
  it('ar and en have the same keys', () => {
    expect(Object.keys(AR).sort()).toEqual(Object.keys(EN).sort())
  })
  it('no message is empty', () => {
    for (const [k, v] of Object.entries({ ...EN, ...AR })) expect(v.trim(), k).not.toBe('')
  })
  it('every message is valid ICU', () => {
    for (const [k, v] of Object.entries(EN)) expect(() => new IntlMessageFormat(v, 'en-US'), k).not.toThrow()
    for (const [k, v] of Object.entries(AR)) expect(() => new IntlMessageFormat(v, INTL_LOCALE.ar), k).not.toThrow()
  })
  it('follows the copy rules', () => {
    // No Latin jargon or brand in Arabic, «تمرين» not «سيشن», "one to one" not "1:1", prices in EGP.
    for (const [k, v] of Object.entries(AR)) expect(v, k).not.toMatch(/HIIT|1:1|سيشن|كوتش|El Captain|EL CAPTAIN|\$|vinyasa/i)
    for (const [k, v] of Object.entries(EN)) expect(v, k).not.toMatch(/HIIT|1:1|\$|vinyasa/i)
  })
  it('Arabic plurals print Western digits', () => {
    const msg = new IntlMessageFormat('{count, plural, other {# دقيقة}}', INTL_LOCALE.ar)
    expect(msg.format({ count: 45 })).toBe('45 دقيقة')
  })
})
