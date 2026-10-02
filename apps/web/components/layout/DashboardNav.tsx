'use client';
import { Stack, Text, UnstyledButton, Button, Tooltip } from '@mantine/core';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import classes from './DashboardNav.module.css';

interface NavItem {
  label: string;
  href: string;
  segment: string;
  active?: boolean;
}

function getNavItems(role: string): NavItem[] {
  if (role === 'ADMIN')
    return [
      { label: 'Overview', href: '/admin', segment: 'admin' },
      { label: 'All Classes', href: '/classes', segment: 'classes' },
    ];
  if (role === 'USER')
    return [
      {
        label: 'My Bookings',
        href: '/bookings',
        segment: 'bookings',
      },
    ];
  if (role === 'STUDIO')
    return [
      { label: 'My Classes', href: '/classes', segment: 'classes' },
      { label: 'My Profile', href: '/profile', segment: 'profile' },
    ];
  if (role === 'COACH')
    return [
      { label: 'My Classes', href: '/classes', segment: 'classes' },
      {
        label: 'Session Requests',
        href: '/sessions',
        segment: 'sessions',
      },
      { label: 'My Profile', href: '/profile', segment: 'profile' },
    ];

  return [];
}

function NavbarLink({ label, href, active }: Omit<NavItem, 'segment'>) {
  return (
    <Tooltip label={label} position='right' transitionProps={{ duration: 0 }}>
      <UnstyledButton
        key={href}
        component={Link}
        href={href}
        style={{
          display: 'block',
          padding: '8px 12px',
          borderRadius: 6,
          fontWeight: active ? 600 : 400,
          backgroundColor: active ? 'var(--mantine-color-blue-0)' : 'transparent',
          color: active ? 'var(--mantine-color-blue-7)' : 'inherit',
          textDecoration: 'none',
        }}
      >
        <Text size='sm'>{label}</Text>
      </UnstyledButton>
    </Tooltip>
  );
}

export function DashboardNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = pathname.split('/')[1] ?? '';
  const { data: session } = useSession();
  const role = session?.user?.role;
  const items = getNavItems(role ?? '');

  return session ? (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      <nav className={classes.navbar}>
        <div className={classes.navbarMain}>
          <Stack justify='center' gap={0}>
            {items.map((item) => {
              const active = segment === item.segment;
              return (
                <NavbarLink
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  active={active}
                />
              );
            })}
          </Stack>
        </div>

        <Stack justify='center' gap={0}>
          <Button variant='outline' onClick={() => signOut({ callbackUrl: '/' })}>
            Sign out
          </Button>
        </Stack>
      </nav>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  ) : (
    <div>{children}</div>
  );
}
