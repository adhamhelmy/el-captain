import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { LocaleToggle } from '@/components/LocaleToggle';
import { accent, br } from '@/components/rich';
import { Logo } from '@/components/ui';
import styles from './layout.module.css';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = useTranslations('authBrand');
  return (
    <div className='auth'>
      <div className='auth-brand'>
        <div className={`between ${styles.top}`}>
          <Logo />
          <LocaleToggle />
        </div>
        <div>
          <div className={`display lh-88 ${styles.title}`}>
            {t.rich('title', { br, accent })}
          </div>
          <div className={`muted ${styles.tagline}`}>
            {t('tagline')}
          </div>
        </div>
      </div>
      <div className='auth-form'>
        <Suspense>{children}</Suspense>
      </div>
    </div>
  );
}
