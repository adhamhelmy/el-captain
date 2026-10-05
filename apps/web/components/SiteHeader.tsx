'use client';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { homeForRole } from '@/lib/routes';
import { LocaleToggle } from './LocaleToggle';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './ui';

export function SiteHeader() {
  const t = useTranslations('common');
  const { data, status } = useSession();
  return (
    <header className='site-header'>
      <div className='site-wrap site-bar'>
        <Logo />
        {/* Hidden while the session loads, so nobody sees a flash of the wrong buttons. */}
        <div
          className='site-actions'
          style={{ visibility: status === 'loading' ? 'hidden' : undefined }}
        >
          {data?.user ? (
            <>
              <button
                type='button'
                className='linkbtn site-link'
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                {t('logOut')}
              </button>
              <Link
                href={homeForRole(data.user.role)}
                className='btn site-cta'
              >
                {t('dashboard')}
              </Link>
            </>
          ) : (
            <>
              <Link
                href='/login'
                className='plain site-link'
              >
                {t('logIn')}
              </Link>
              <Link
                href='/register'
                className='btn site-cta'
              >
                {t('getStarted')}
              </Link>
            </>
          )}
          {/* Signed-in visitors switch language and theme from the footer, which keeps the header to two actions. */}
          {!data?.user && <LocaleToggle />}
          {!data?.user && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}
