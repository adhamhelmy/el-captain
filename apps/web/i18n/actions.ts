'use server'
import { cookies } from 'next/headers'
import { isAppLocale, type AppLocale } from './locale'

/** Saves the language choice. Setting a cookie in an action re-renders the current route. */
export async function setLocale(locale: AppLocale) {
  // Actions are public endpoints, so the argument is untrusted.
  if (!isAppLocale(locale)) {
    throw new Error('Unsupported locale')
  }
  const jar = await cookies()
  jar.set('locale', locale, { path: '/', maxAge: 31_536_000, sameSite: 'lax' })
}
