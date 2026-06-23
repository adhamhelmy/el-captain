'use client'
import { Container, Title, Text, Badge, Button, Group, Stack, Paper, Divider } from '@mantine/core'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'
import type { ClassDTO } from '@el-captain/types'

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [cls, setCls] = useState<ClassDTO | null>(null)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    fetch(`/api/classes/${params.id}`)
      .then(r => r.json())
      .then(setCls)
  }, [params.id])

  async function handleBook() {
    if (!session) {
      router.push(`/auth/login?redirect=/classes/${params.id}`)
      return
    }

    setBooking(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: params.id }),
    })
    setBooking(false)

    if (!res.ok) {
      const data = await res.json()
      notifications.show({ color: 'red', title: 'Error', message: data.error })
      return
    }

    notifications.show({ color: 'green', title: 'Booked!', message: 'Your spot is confirmed.' })
    router.push('/dashboard/bookings')
  }

  if (!cls) return <Container py="xl"><Text>Loading...</Text></Container>

  const date = new Date(cls.date)
  const spotsColor = cls.spotsLeft === 0 ? 'red' : cls.spotsLeft <= 3 ? 'orange' : 'green'

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group>
          <Badge color="blue" size="lg">{cls.type}</Badge>
          <Badge color={spotsColor} size="lg">
            {cls.spotsLeft === 0 ? 'Full' : `${cls.spotsLeft} / ${cls.capacity} spots left`}
          </Badge>
        </Group>
        <Title>{cls.title}</Title>
        <Text c="dimmed" size="lg">{cls.studioName ?? cls.clientName}</Text>

        <Paper withBorder p="md" radius="md">
          <Stack gap="xs">
            <Text><strong>Date:</strong> {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <Text><strong>Duration:</strong> {cls.durationMinutes} minutes</Text>
            <Text><strong>Location:</strong> {cls.address}, {cls.city}</Text>
          </Stack>
        </Paper>

        {cls.description && (
          <>
            <Divider />
            <Text>{cls.description}</Text>
          </>
        )}

        <Button
          size="lg"
          onClick={handleBook}
          loading={booking}
          disabled={cls.spotsLeft === 0}
          fullWidth
        >
          {cls.spotsLeft === 0 ? 'Class is full' : session ? 'Book this class' : 'Sign in to book'}
        </Button>
      </Stack>
    </Container>
  )
}
