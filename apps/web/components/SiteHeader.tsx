'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { homeForRole } from '@/lib/routes';
import { Logo } from './ui';

const NAV = [
  ['Home', '/'],
  ['Sessions', '/sessions'],
  ['About', '/about'],
  ['FAQ', '/faq'],
  ['Contact', '/contact'],
];

export function SiteHeader() {
  const path = usePathname();
  const { data, status } = useSession();
  return (
    <header className='site-header'>
      <div
        className='site-wrap'
        style={{
          paddingTop: 14,
          paddingBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px 24px',
          flexWrap: 'wrap',
        }}
      >
        <Logo />
        <nav className='site-nav' style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {NAV.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={path === href || (href !== '/' && path.startsWith(href + '/')) ? 'on' : ''}
            >
              {label}
            </Link>
          ))}
        </nav>
        {/* Hidden while the session loads, so nobody sees a flash of the wrong buttons. */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            visibility: status === 'loading' ? 'hidden' : undefined,
          }}
        >
          {data?.user ? (
            <>
              <button
                type='button'
                className='linkbtn'
                style={{ fontSize: 14, fontWeight: 600, padding: '10px 14px' }}
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Log out
              </button>
              <Link
                href={homeForRole(data.user.role)}
                className='btn'
                style={{ padding: '10px 18px', borderRadius: 8 }}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href='/login'
                className='plain'
                style={{ fontSize: 14, fontWeight: 600, padding: '10px 14px' }}
              >
                Log in
              </Link>
              <Link
                href='/register'
                className='btn'
                style={{ padding: '10px 18px', borderRadius: 8 }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
