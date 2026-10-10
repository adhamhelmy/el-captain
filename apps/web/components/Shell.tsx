'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { CalendarCheck, CalendarDays, Compass, Dumbbell, House, MapPin, Trophy, UserRound, Users, type LucideIcon } from 'lucide-react';
import { pendingRequestCount, REQUESTS_CHANGED } from '@/lib/client/session-api';
import { LocaleToggle } from './LocaleToggle';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, initialsOf, Logo } from './ui';
import styles from './Shell.module.css';

type Role = 'admin' | 'coach' | 'user';

type NavKey = 'dashboard' | 'explore' | 'mySessions' | 'coaches' | 'myCoaches' | 'profile' | 'myClients' | 'venues' | 'users' | 'sessions' | 'sports';

/** Nav per role: [message key, path, icon, extra paths that also mark it active]. */
const NAV: Record<Role, [NavKey, string, LucideIcon, ((p: string) => boolean)?][]> = {
  user: [
    ['dashboard', '/user/dashboard', House],
    ['explore', '/user/explore', Compass, (p) => p.startsWith('/user/sessions/') && p !== '/user/sessions/me'],
    ['mySessions', '/user/sessions/me', CalendarCheck],
    ['myCoaches', '/user/coaches/me', Users, (p) => p.startsWith('/user/coaches/')],
    ['profile', '/user/profile', UserRound],
  ],
  coach: [
    ['dashboard', '/coach/dashboard', House],
    ['mySessions', '/coach/sessions/me', CalendarCheck],
    ['myClients', '/coach/users/me', Users, (p) => p.startsWith('/coach/users/')],
    ['venues', '/coach/venues', MapPin],
    ['profile', '/coach/profile', UserRound],
  ],
  admin: [
    ['dashboard', '/admin/dashboard', House],
    ['users', '/admin/users', Users, (p) => p.startsWith('/admin/users/')],
    ['coaches', '/admin/coaches', Dumbbell, (p) => p.startsWith('/admin/coaches/')],
    ['sports', '/admin/sports', Trophy],
    ['sessions', '/admin/sessions', CalendarDays, (p) => p.startsWith('/admin/sessions/')],
  ],
};

/** The coach's unanswered private requests, refreshed on navigation and after answering one. */
function usePendingRequests(enabled: boolean, path: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let stale = false;
    const load = () =>
      pendingRequestCount()
        .then((r) => !stale && r.ok && setCount(r.data.count))
        .catch(() => {});
    load();
    globalThis.addEventListener(REQUESTS_CHANGED, load);
    return () => {
      stale = true;
      globalThis.removeEventListener(REQUESTS_CHANGED, load);
    };
  }, [enabled, path]);
  return count;
}

const ROLE_LABEL: Record<Role, 'coach' | 'admin' | null> = { user: null, coach: 'coach', admin: 'admin' };

/** App chrome for a role area. The footer shows the signed-in account with its role under the name. */
export function Shell({ role, children }: Readonly<{ role: Role; children: React.ReactNode }>) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const path = usePathname();
  const name = useSession().data?.user?.name ?? '';
  const [menu, setMenu] = useState(false);
  const pending = usePendingRequests(role === 'coach', path);
  const logout = () => signOut({ callbackUrl: '/login' });

  const nav = (
    <nav className='nav'>
      {NAV[role].map(([key, href, Icon, also]) => (
        <Link key={href} href={href} onClick={() => setMenu(false)} className={path === href || also?.(path) ? 'on' : ''}>
          <Icon size={18} aria-hidden />
          {t(key)}
          {role === 'coach' && key === 'mySessions' && pending > 0 && (
            <span className='nav-badge' aria-label={t('pendingRequests', { count: pending })}>
              {pending}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
  const profile = role === 'admin' ? null : `/${role}/profile`;
  const who = (
    <>
      <Avatar initials={initialsOf(name)} accent={role !== 'admin'} />
      <div>
        <div className={styles.name}>{name}</div>
        <div className={`muted ${styles.role}`}>{t(`sub.${role}`)}</div>
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
