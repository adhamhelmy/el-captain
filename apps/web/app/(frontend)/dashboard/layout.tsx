import { Container, Tabs } from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const { role } = session.user

  return (
    <Container size="lg" py="xl">
      <Tabs defaultValue={role === 'USER' ? 'bookings' : role === 'CLIENT' ? 'classes' : 'admin'}>
        <Tabs.List mb="xl">
          {role === 'USER' && <Tabs.Tab value="bookings" component={Link} {...{ href: '/dashboard/bookings' } as object}>My Bookings</Tabs.Tab>}
          {role === 'CLIENT' && <Tabs.Tab value="classes" component={Link} {...{ href: '/dashboard/classes' } as object}>My Classes</Tabs.Tab>}
          {role === 'ADMIN' && (
            <>
              <Tabs.Tab value="admin" component={Link} {...{ href: '/dashboard/admin' } as object}>Admin</Tabs.Tab>
              <Tabs.Tab value="classes" component={Link} {...{ href: '/dashboard/classes' } as object}>All Classes</Tabs.Tab>
            </>
          )}
        </Tabs.List>
        {children}
      </Tabs>
    </Container>
  )
}
