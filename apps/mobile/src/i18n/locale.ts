export const LOCALES = ['en', 'ar'] as const;
export type AppLocale = (typeof LOCALES)[number];

export { APP_TZ } from '@el-captain/rules/app-time';

/** Same as the web (apps/web/i18n/locale.ts): Western digits in Arabic. */
export const INTL_LOCALE: Record<AppLocale, string> = { en: 'en-US', ar: 'ar-EG-u-nu-latn' };

export const isAppLocale = (v: unknown): v is AppLocale => LOCALES.includes(v as AppLocale);

/**
 * The device's primary language if the app has it, else English. Only the primary one counts, because
 * the layout direction follows it too; [fr, ar] reading Arabic in a left-to-right layout would be wrong.
 */
export function pickLocale(deviceLanguages: (string | null)[], saved?: string | null): AppLocale {
  if (isAppLocale(saved)) return saved;
  const primary = deviceLanguages[0];
  return isAppLocale(primary) ? primary : 'en';
}

/** Where the language picked in Profile is kept. */
export const LOCALE_KEY = 'locale';
