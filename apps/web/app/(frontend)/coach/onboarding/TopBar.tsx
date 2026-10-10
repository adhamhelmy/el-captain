'use client';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/ui';
import styles from './onboarding.module.css';

export type SaveState = 'saved' | 'saving' | 'error';

/** Onboarding has no app shell, so it carries its own bar: the logo, whether the draft is saved, and a way out. */
export function TopBar({ save }: Readonly<{ save?: SaveState }>) {
  const t = useTranslations('onboarding');
  const tc = useTranslations('common');
  const label = { saved: t('saved'), saving: t('saving'), error: t('notSaved') };
  return (
    <div className={styles.topBar}>
      <Logo />
      <div className={styles.topActions}>
        {save && (
          <output className={styles.saveState}>
            <span className={`${styles.saveDot} ${save === 'error' ? styles.saveDotWarn : ''}`} aria-hidden />
            {label[save]}
          </output>
        )}
        <button type='button' className='btn-ghost sm' onClick={() => signOut({ callbackUrl: '/login' })}>
          {tc('logOut')}
        </button>
      </div>
    </div>
  );
}
