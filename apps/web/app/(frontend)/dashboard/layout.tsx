import { Container, Box } from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const { role } = session.user

  return (
    <Container size="lg" py="xl">
      <Box style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <DashboardNav role={role} />
        <Box style={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>
    </Container>
  )
}
