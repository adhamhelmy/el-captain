'use client'
import { Container, Title, Text, Badge, Button, Group, Stack, Paper, Divider, Anchor, Skeleton, Image, ActionIcon } from '@mantine/core'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'
import type { ClassDTO } from '@el-captain/types'

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [cls, setCls] = useState<ClassDTO | null>(null)
  const [bookingState, setBookingState] = useState<'idle' | 'loading' | 'booked'>('idle')

  useEffect(() => {
    fetch(`/api/classes/${id}`).then(r => r.json()).then(data => {
      setCls(data)
      if (data?.title) document.title = `${data.title} | El Captain`
    })
    return () => { document.title = 'El Captain' }
  }, [id])

  // Check if user already has an active booking for this class
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/bookings')
      .then(r => r.json())
      .then((bookings: any[]) => {
        const existing = bookings.find(b => b.classId === id && b.status === 'CONFIRMED')
        if (existing) setBookingState('booked')
      })
  }, [session, id])

  async function handleBook() {
    if (!session) {
      router.push(`/auth/login?redirect=/classes/${id}`)
      return
    }
    setBookingState('loading')
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: id }),
    })

    if (!res.ok) {
      setBookingState('idle')
      const data = await res.json()
      notifications.show({ color: 'red', title: 'Error', message: data.error })
      return
    }

    // Update spots live
    setCls(prev => prev ? { ...prev, spotsLeft: prev.spotsLeft - 1 } : prev)
    setBookingState('booked')
    notifications.show({ color: 'green', title: 'Booked!', message: 'Your spot is confirmed.' })
  }

  if (!cls) return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Skeleton height={200} radius="md" />
        <Skeleton height={32} width={200} />
        <Skeleton height={20} width={140} />
        <Skeleton height={100} radius="md" />
        <Skeleton height={48} radius="md" />
      </Stack>
    </Container>
  )

  const date = new Date(cls.date)
  const isPast = date < new Date()
  const spotsColor = cls.spotsLeft === 0 ? 'red' : cls.spotsLeft <= 3 ? 'orange' : 'green'

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        {/* Back button */}
        <Group>
          <ActionIcon variant="subtle" size="lg" onClick={() => router.back()} title="Go back">
            ←
          </ActionIcon>
          <Text size="sm" c="dimmed">Back</Text>
        </Group>

        {/* Hero image */}
        {cls.imageUrl && (
          <Image src={cls.imageUrl} alt={cls.title} radius="md" mah={280} fit="cover" />
        )}

        <Group>
          <Badge color="blue" size="lg">{cls.type}</Badge>
          {isPast ? (
            <Badge color="gray" size="lg">Past</Badge>
          ) : (
            <Badge color={spotsColor} size="lg">
              {cls.spotsLeft === 0 ? 'Full' : `${cls.spotsLeft} / ${cls.capacity} spots left`}
            </Badge>
          )}
          {bookingState === 'booked' && !isPast && (
            <Badge color="green" size="lg" variant="filled">✓ You&apos;re booked</Badge>
          )}
        </Group>

        <Title>{cls.title}</Title>
        <Anchor component={Link} href={`/clients/${cls.clientId}`} c="dimmed" size="lg" underline="hover">
          {cls.studioName ?? cls.clientName}
        </Anchor>

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

        {isPast ? (
          <Button size="lg" fullWidth disabled>Class has ended</Button>
        ) : bookingState === 'booked' ? (
          <Stack gap="xs">
            <Button size="lg" fullWidth color="green" variant="light" disabled>✓ You&apos;re booked</Button>
            <Button size="sm" variant="subtle" component={Link} href="/dashboard/bookings" fullWidth>View my bookings</Button>
          </Stack>
        ) : (
          <Button
            size="lg"
            onClick={handleBook}
            loading={bookingState === 'loading'}
            disabled={cls.spotsLeft === 0}
            fullWidth
          >
            {cls.spotsLeft === 0 ? 'Class is full' : session ? 'Book this class' : 'Sign in to book'}
          </Button>
        )}
      </Stack>
    </Container>
  )
}
