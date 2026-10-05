'use client';
import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { getTheme, setTheme, subscribeTheme } from '@/lib/theme';

const Sun = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' aria-hidden='true'>
    <circle cx='12' cy='12' r='4' />
    <path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' />
  </svg>
);

const Moon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
  </svg>
);

/** Sun/moon button that flips the theme. Shows the theme you'd switch to. The server render assumes dark. */
export function ThemeToggle() {
  const t = useTranslations('theme');
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'dark' as const);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type='button'
      className='theme-btn'
      onClick={() => setTheme(next)}
      aria-label={t(next === 'light' ? 'switchToLight' : 'switchToDark')}
      title={t(next === 'light' ? 'switchToLight' : 'switchToDark')}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}

/** Settings row for the profile pages. */
export function ThemeSetting() {
  const t = useTranslations('theme');
  return (
    <div className='setting'>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{t('setting')}</div>
        <div className='muted' style={{ fontSize: 13 }}>
          {t('settingHint')}
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}
