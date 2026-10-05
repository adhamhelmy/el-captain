import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { LocaleToggle } from '@/components/LocaleToggle';
import { accent, br } from '@/components/rich';
import { Logo } from '@/components/ui';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = useTranslations('authBrand');
  return (
    <div className='auth'>
      <div className='auth-brand'>
        <div className='between' style={{ alignItems: 'center' }}>
          <Logo />
          <LocaleToggle />
        </div>
        <div>
          <div className='display lh-88' style={{ fontSize: 'clamp(56px, 7vw, 96px)' }}>
            {t.rich('title', { br, accent })}
          </div>
          <div
            className='muted'
            style={{ fontSize: 16, marginTop: 16, maxWidth: 380, lineHeight: 1.6 }}
          >
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
