/** Locale logic shared by the request config, the switch action and tests. No Next imports. */
export const LOCALES = ['en', 'ar'] as const
export type AppLocale = (typeof LOCALES)[number]

/** Locale handed to Intl. `nu-latn` keeps Western digits in Arabic; drop it for ٠١٢. */
export const INTL_LOCALE: Record<AppLocale, string> = { en: 'en-US', ar: 'ar-EG-u-nu-latn' }

/** Mock data is in Colorado; one fixed zone keeps server and client output identical. */
export const APP_TZ = 'America/Denver'

export const isAppLocale = (v: unknown): v is AppLocale => LOCALES.includes(v as AppLocale)

export const appLocale = (intl: string): AppLocale => (intl.startsWith('ar') ? 'ar' : 'en')

/** Cookie first, then the best Accept-Language match, then English. */
export function resolveLocale(cookie: string | undefined, acceptLanguage: string | null): AppLocale {
  if (isAppLocale(cookie)) return cookie
  const ranked = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      const weight = q ? Number(q.trim().slice(2)) : 1
      return { lang: tag.split('-')[0].toLowerCase(), weight: Number.isFinite(weight) ? weight : 0 }
    })
    .filter((x) => isAppLocale(x.lang) && x.weight > 0)
    .sort((a, b) => b.weight - a.weight)
  return (ranked[0]?.lang as AppLocale | undefined) ?? 'en'
}

/** Wraps user-written text (names, places) dropped into a translated sentence, so "Denver, CO" keeps LTR order inside Arabic. */
export const isolate = (s: string) => `⁨${s}⁩`
