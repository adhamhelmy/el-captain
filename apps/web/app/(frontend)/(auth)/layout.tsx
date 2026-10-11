import { Suspense } from 'react';
import { LocaleToggle } from '@/components/LocaleToggle';
import { Logo } from '@/components/ui';
import { BrandTitle } from './BrandTitle';
import styles from './layout.module.css';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='auth'>
      <div className='auth-brand'>
        <div className={`between ${styles.top}`}>
          <Logo />
          <LocaleToggle />
        </div>
        <Suspense>
          <BrandTitle />
        </Suspense>
      </div>
      <div className='auth-form'>
        <Suspense>{children}</Suspense>
      </div>
    </div>
  );
}
