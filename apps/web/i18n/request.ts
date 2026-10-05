import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { formats } from './formats'
import { APP_TZ, INTL_LOCALE, resolveLocale } from './locale'
import { MESSAGES } from './messages'

export default getRequestConfig(async () => {
  const locale = resolveLocale(
    (await cookies()).get('locale')?.value,
    (await headers()).get('accept-language'),
  )
  return { locale: INTL_LOCALE[locale], messages: MESSAGES[locale], formats, timeZone: APP_TZ }
})
