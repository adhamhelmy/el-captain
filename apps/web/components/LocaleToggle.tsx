'use client';
import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setLocale } from '@/i18n/actions';
import { appLocale } from '@/i18n/locale';
import styles from './settings.module.css';

/** Switches between English and Arabic. Shows the language you'd switch to. */
export function LocaleToggle() {
  const t = useTranslations('locale');
  const current = appLocale(useLocale());
  const [pending, start] = useTransition();
  return (
    <button
      type='button'
      className='theme-btn locale-btn'
      disabled={pending}
      onClick={() => start(() => setLocale(current === 'ar' ? 'en' : 'ar'))}
      aria-label={t('switchTo')}
      title={t('switchTo')}
      lang={current === 'ar' ? 'en' : 'ar'}
    >
      {t('short')}
    </button>
  );
}

/** Settings row for the profile pages. */
export function LocaleSetting() {
  const t = useTranslations('locale');
  return (
    <div className='setting'>
      <div>
        <div className={styles.label}>{t('setting')}</div>
        <div className={`muted ${styles.hint}`}>
          {t('settingHint')}
        </div>
      </div>
      <LocaleToggle />
    </div>
  );
}

/** English / العربية as a segmented control; each name is shown in its own language. */
export function LocaleChoiceControl() {
  const t = useTranslations('locale');
  const current = appLocale(useLocale());
  const [pending, start] = useTransition();
  return (
    <div className='seg inset' role='radiogroup' aria-label={t('setting')}>
      {(['en', 'ar'] as const).map((l) => (
        <button
          key={l}
          type='button'
          role='radio'
          aria-checked={current === l}
          lang={l}
          disabled={pending}
          className={current === l ? 'on' : ''}
          onClick={() => current !== l && start(() => setLocale(l))}
        >
          {t(`name.${l}`)}
        </button>
      ))}
    </div>
  );
}
