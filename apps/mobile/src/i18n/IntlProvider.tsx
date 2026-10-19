import { ar, en } from '@el-captain/messages';
import { getLocales } from 'expo-localization';
import * as Updates from 'expo-updates';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DevSettings, I18nManager, Platform } from 'react-native';
import { IntlProvider as UseIntlProvider } from 'use-intl';
import { deleteItem, getItem, setItem } from '@/lib/storage';
import { syncDirection } from './direction';
import { APP_TZ, INTL_LOCALE, LOCALE_KEY, pickLocale, type AppLocale } from './locale';

const MESSAGES = { en, ar };

/** Same named formats as the web (apps/web/i18n/formats.ts). */
const formats = {
  dateTime: {
    weekday: { weekday: 'short' },
    dayMonth: { day: 'numeric', month: 'short' },
    dayMonthYear: { day: 'numeric', month: 'short', year: 'numeric' },
    monthYear: { month: 'short', year: 'numeric' },
    time: { hour: 'numeric', minute: '2-digit' },
  },
} as const;

/** The language the last direction reload was for; a second reload for it would mean it won't stick. */
const RELOADED_KEY = 'directionReloadedFor';

/**
 * Mirrored layout for Arabic only. Returns true when it has to reload to apply a new direction.
 * The web preview follows the browser, so it never reloads.
 */
async function applyDirection(locale: AppLocale) {
  if (Platform.OS === 'web') return false;
  const lastTried = await getItem(RELOADED_KEY);
  const reloading = syncDirection(locale, I18nManager.isRTL, () => {
    setItem(RELOADED_KEY, locale).then(() => Updates.reloadAsync().catch(() => DevSettings.reload()));
  }, lastTried);
  if (!reloading && I18nManager.isRTL === (locale === 'ar')) await deleteItem(RELOADED_KEY);
  return reloading;
}

type LocaleValue = { locale: AppLocale; isRTL: boolean; setLocale: (l: AppLocale) => void };
const LocaleContext = createContext<LocaleValue>({ locale: 'en', isRTL: false, setLocale: () => {} });

const deviceLanguages = () => getLocales().map((l) => l.languageCode);

/** The language picked in Profile, else the device's. Renders nothing (the splash stays up) until it is known. */
export function IntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale | null>(null);

  useEffect(() => {
    getItem(LOCALE_KEY).then(async (saved) => {
      const next = pickLocale(deviceLanguages(), saved);
      if (!(await applyDirection(next))) setLocaleState(next);
    });
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setItem(LOCALE_KEY, next)
      .then(() => applyDirection(next))
      .then((reloading) => !reloading && setLocaleState(next));
  }, []);

  const value = useMemo(() => locale && { locale, isRTL: locale === 'ar', setLocale }, [locale, setLocale]);
  if (!value) return null;

  return (
    <LocaleContext.Provider value={value}>
      <UseIntlProvider locale={INTL_LOCALE[value.locale]} messages={MESSAGES[value.locale]} formats={formats} timeZone={APP_TZ}>
        {children}
      </UseIntlProvider>
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
