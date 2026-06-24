'use client'
import { Tabs, TabsList, TabsTab } from '@mantine/core'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function DashboardNav({ role }: { role: string }) {
  const pathname = usePathname()
  const segment = pathname.split('/')[2] ?? ''

  return (
    <Tabs value={segment} mb="xl">
      <TabsList>
        {role === 'USER' && (
          <TabsTab value="bookings" renderRoot={(props) => <Link href="/dashboard/bookings" {...props} />}>My Bookings</TabsTab>
        )}
        {role === 'CLIENT' && (
          <>
            <TabsTab value="classes" renderRoot={(props) => <Link href="/dashboard/classes" {...props} />}>My Classes</TabsTab>
            <TabsTab value="profile" renderRoot={(props) => <Link href="/dashboard/profile" {...props} />}>My Profile</TabsTab>
          </>
        )}
        {role === 'ADMIN' && (
          <>
            <TabsTab value="admin" renderRoot={(props) => <Link href="/dashboard/admin" {...props} />}>Admin</TabsTab>
            <TabsTab value="classes" renderRoot={(props) => <Link href="/dashboard/classes" {...props} />}>All Classes</TabsTab>
          </>
        )}
      </TabsList>
    </Tabs>
  )
}
