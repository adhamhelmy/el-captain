import { beforeEach, describe, expect, it, vi } from 'vitest'

const jar = new Map<string, string>()
let acceptLanguage: string | null = null
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (k: string) => (jar.has(k) ? { value: jar.get(k) } : undefined) }),
  headers: async () => ({ get: () => acceptLanguage }),
}))
// getRequestConfig just wraps the resolver; unwrap it so the test can call it.
vi.mock('next-intl/server', () => ({ getRequestConfig: (fn: unknown) => fn }))

import requestConfig from './request'

const resolve = () =>
  (requestConfig as unknown as () => Promise<{ locale: string; timeZone: string; messages: { meta: { title: string } } }>)()

describe('request config', () => {
  beforeEach(() => {
    jar.clear()
    acceptLanguage = null
  })

  it('uses the locale cookie, with Arabic messages and Western-digit Intl locale', async () => {
    jar.set('locale', 'ar')
    const config = await resolve()
    expect(config.locale).toBe('ar-EG-u-nu-latn')
    expect(config.messages.meta.title).toBe('الكابتن')
    expect(config.timeZone).toBe('Africa/Cairo')
  })

  it('falls back to the browser language, then English', async () => {
    acceptLanguage = 'ar-EG,ar;q=0.9'
    expect((await resolve()).locale).toBe('ar-EG-u-nu-latn')
    acceptLanguage = null
    expect((await resolve()).locale).toBe('en-US')
  })
})
