'use client';
import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setLocale } from '@/i18n/actions';
import { appLocale } from '@/i18n/locale';

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
        <div style={{ fontSize: 14, fontWeight: 600 }}>{t('setting')}</div>
        <div className='muted' style={{ fontSize: 13 }}>
          {t('settingHint')}
        </div>
      </div>
      <LocaleToggle />
    </div>
  );
}
