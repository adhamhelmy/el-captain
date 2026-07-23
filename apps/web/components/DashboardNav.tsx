'use client'
import { Stack, Text, UnstyledButton, Box } from '@mantine/core'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  segment: string
}

function getNavItems(role: string): NavItem[] {
  if (role === 'USER') return [
    { label: 'My Bookings', href: '/dashboard/bookings', segment: 'bookings' },
  ]
  if (role === 'CLIENT') return [
    { label: 'My Classes', href: '/dashboard/classes', segment: 'classes' },
    { label: 'My Profile', href: '/dashboard/profile', segment: 'profile' },
  ]
  if (role === 'COACH') return [
    { label: 'My Classes', href: '/dashboard/classes', segment: 'classes' },
    { label: 'Session Requests', href: '/dashboard/sessions', segment: 'sessions' },
    { label: 'My Profile', href: '/dashboard/profile', segment: 'profile' },
  ]
  if (role === 'ADMIN') return [
    { label: 'Overview', href: '/dashboard/admin', segment: 'admin' },
    { label: 'All Classes', href: '/dashboard/classes', segment: 'classes' },
  ]
  return []
}

export function DashboardNav({ role }: { role: string }) {
  const pathname = usePathname()
  const segment = pathname.split('/')[2] ?? ''
  const items = getNavItems(role)

  return (
    <Box
      component="nav"
      style={{
        width: 200,
        flexShrink: 0,
        borderRight: '1px solid var(--mantine-color-gray-3)',
        paddingRight: 16,
      }}
    >
      <Stack gap={4}>
        {items.map(item => {
          const active = segment === item.segment
          return (
            <UnstyledButton
              key={item.href}
              component={Link}
              href={item.href}
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
              <Text size="sm">{item.label}</Text>
            </UnstyledButton>
          )
        })}
      </Stack>
    </Box>
  )
}
