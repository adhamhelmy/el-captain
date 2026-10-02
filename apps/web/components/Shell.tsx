'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Avatar, Logo } from './ui';

type Role = 'admin' | 'coach' | 'user';

/** Nav per role: [label, path, extra paths that also mark it active]. */
const NAV: Record<Role, [string, string, ((p: string) => boolean)?][]> = {
  user: [
    ['Dashboard', '/user/dashboard'],
    [
      'Browse sessions',
      '/user/sessions',
      (p) => p.startsWith('/user/sessions/') && p !== '/user/sessions/me',
    ],
    ['My sessions', '/user/sessions/me'],
    ['Coaches', '/user/coaches', (p) => p.startsWith('/user/coaches/') && p !== '/user/coaches/me'],
    ['My coaches', '/user/coaches/me'],
    ['Profile', '/user/profile'],
  ],
  coach: [
    ['Dashboard', '/coach/dashboard'],
    ['My sessions', '/coach/sessions/me'],
    [
      'All sessions',
      '/coach/sessions',
      (p) => p.startsWith('/coach/sessions/') && p !== '/coach/sessions/me',
    ],
    ['My clients', '/coach/users/me', (p) => p.startsWith('/coach/users/')],
    ['Profile', '/coach/profile'],
  ],
  admin: [
    ['Dashboard', '/admin/dashboard'],
    ['Users', '/admin/users', (p) => p.startsWith('/admin/users/')],
    ['Coaches', '/admin/coaches', (p) => p.startsWith('/admin/coaches/')],
    ['Sessions', '/admin/sessions', (p) => p.startsWith('/admin/sessions/')],
  ],
};

const ROLE_LABEL: Record<Role, string | null> = { user: null, coach: 'Coach', admin: 'Admin' };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** App chrome for a role area. The footer shows the signed-in account; `sub` is the line under the name. */
export function Shell({
  role,
  sub,
  children,
}: Readonly<{ role: Role; sub: string; children: React.ReactNode }>) {
  const path = usePathname();
  const name = useSession().data?.user?.name ?? '';
  const [menu, setMenu] = useState(false);
  const logout = () => signOut({ callbackUrl: '/login' });

  const nav = (
    <nav className='nav'>
      {NAV[role].map(([label, href, also]) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMenu(false)}
          className={path === href || also?.(path) ? 'on' : ''}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
  const profile = role === 'admin' ? null : `/${role}/profile`;
  const who = (
    <>
      <Avatar initials={initials(name)} accent={role !== 'admin'} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
        <div className='muted' style={{ fontSize: 12 }}>
          {sub}
        </div>
      </div>
    </>
  );

  return (
    <div className='shell'>
      <aside className='sidebar'>
        <Logo />
        {ROLE_LABEL[role] && <div className='side-role'>{ROLE_LABEL[role]}</div>}
        {nav}
        <div className='side-foot'>
          {profile ? (
            <Link
              href={profile}
              className='plain'
              style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0 8px' }}
            >
              {who}
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0 8px' }}>
              {who}
            </div>
          )}
          <button type='button' className='linkbtn' style={{ padding: '0 8px' }} onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main>
        <div className='mobilebar'>
          <div className='mobilebar-top'>
            <Logo />
            <button type='button' className='menu-btn' onClick={() => setMenu(!menu)}>
              {menu ? 'Close' : 'Menu'}
            </button>
          </div>
          {menu && (
            <div className='menu'>
              {nav}
              <div className='menu-foot'>
                <button type='button' className='linkbtn' onClick={logout}>
                  Log out
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
