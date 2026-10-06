'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { LocaleToggle } from './LocaleToggle';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, Logo } from './ui';
import styles from './Shell.module.css';

type Role = 'admin' | 'coach' | 'user';

type NavKey =
  | 'dashboard'
  | 'browseSessions'
  | 'mySessions'
  | 'coaches'
  | 'myCoaches'
  | 'profile'
  | 'allSessions'
  | 'myClients'
  | 'users'
  | 'sessions';

/** Nav per role: [message key, path, extra paths that also mark it active]. */
const NAV: Record<Role, [NavKey, string, ((p: string) => boolean)?][]> = {
  user: [
    ['dashboard', '/user/dashboard'],
    [
      'browseSessions',
      '/user/sessions',
      (p) => p.startsWith('/user/sessions/') && p !== '/user/sessions/me',
    ],
    ['mySessions', '/user/sessions/me'],
    ['coaches', '/user/coaches', (p) => p.startsWith('/user/coaches/') && p !== '/user/coaches/me'],
    ['myCoaches', '/user/coaches/me'],
    ['profile', '/user/profile'],
  ],
  coach: [
    ['dashboard', '/coach/dashboard'],
    ['mySessions', '/coach/sessions/me'],
    [
      'allSessions',
      '/coach/sessions',
      (p) => p.startsWith('/coach/sessions/') && p !== '/coach/sessions/me',
    ],
    ['myClients', '/coach/users/me', (p) => p.startsWith('/coach/users/')],
    ['profile', '/coach/profile'],
  ],
  admin: [
    ['dashboard', '/admin/dashboard'],
    ['users', '/admin/users', (p) => p.startsWith('/admin/users/')],
    ['coaches', '/admin/coaches', (p) => p.startsWith('/admin/coaches/')],
    ['sessions', '/admin/sessions', (p) => p.startsWith('/admin/sessions/')],
  ],
};

const ROLE_LABEL: Record<Role, 'coach' | 'admin' | null> = { user: null, coach: 'coach', admin: 'admin' };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** App chrome for a role area. The footer shows the signed-in account with its role under the name. */
export function Shell({
  role,
  children,
}: Readonly<{ role: Role; children: React.ReactNode }>) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const path = usePathname();
  const name = useSession().data?.user?.name ?? '';
  const [menu, setMenu] = useState(false);
  const logout = () => signOut({ callbackUrl: '/login' });

  const nav = (
    <nav className='nav'>
      {NAV[role].map(([key, href, also]) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMenu(false)}
          className={path === href || also?.(path) ? 'on' : ''}
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
  const profile = role === 'admin' ? null : `/${role}/profile`;
  const who = (
    <>
      <Avatar initials={initials(name)} accent={role !== 'admin'} />
      <div>
        <div className={styles.name}>{name}</div>
        <div className={`muted ${styles.role}`}>
          {t(`sub.${role}`)}
        </div>
      </div>
    </>
  );

  return (
    <div className='shell'>
      <aside className='sidebar'>
        <Logo />
        {ROLE_LABEL[role] && <div className='side-role'>{t(`role.${ROLE_LABEL[role]}`)}</div>}
        {nav}
        <div className='side-foot'>
          {profile ? (
            <Link href={profile} className={`plain ${styles.who}`}>
              {who}
            </Link>
          ) : (
            <div className={styles.who}>{who}</div>
          )}
          {/* Admin has no profile page, so its theme and language switches live here. */}
          {role === 'admin' && (
            <div className='side-toggles'>
              <LocaleToggle />
              <ThemeToggle />
            </div>
          )}
          <button type='button' className={`linkbtn ${styles.logout}`} onClick={logout}>
            {tc('logOut')}
          </button>
        </div>
      </aside>

      <main>
        <div className='mobilebar'>
          <div className='mobilebar-top'>
            <Logo />
            <button type='button' className='menu-btn' onClick={() => setMenu(!menu)}>
              {menu ? tc('close') : tc('menu')}
            </button>
          </div>
          {menu && (
            <div className='menu'>
              {nav}
              <div className='menu-foot'>
                {role === 'admin' && <LocaleToggle />}
                {role === 'admin' && <ThemeToggle />}
                <button type='button' className='linkbtn' onClick={logout}>
                  {tc('logOut')}
                </button>
              </div>
            </div>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
