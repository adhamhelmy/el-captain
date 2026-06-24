'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Container, Text } from '@mantine/core'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/auth/login'); return }
    if (session.user.role === 'ADMIN') router.push('/dashboard/admin')
    else if (session.user.role === 'CLIENT') router.push('/dashboard/classes')
    else router.push('/dashboard/bookings')
  }, [session, status, router])

  return <Container py="xl"><Text>Redirecting...</Text></Container>
}
