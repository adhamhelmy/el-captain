'use client'
import { Card, Text, Badge, Button, Group, Stack } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { BookingDTO } from '@el-captain/types'

interface Props {
  booking: BookingDTO
  onCancelled: (id: string) => void
}

export function BookingCard({ booking, onCancelled }: Props) {
  const c = booking.class
  const date = new Date(c.date)

  async function handleCancel() {
    const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'PATCH' })
    if (!res.ok) {
      notifications.show({ color: 'red', title: 'Error', message: 'Could not cancel booking' })
      return
    }
    notifications.show({ color: 'green', title: 'Cancelled', message: 'Your booking has been cancelled' })
    onCancelled(booking.id)
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Badge color="blue" variant="light">{c.type}</Badge>
          <Badge color={booking.status === 'CONFIRMED' ? 'green' : 'gray'} variant="light">
            {booking.status}
          </Badge>
        </Group>
        <Text fw={600}>{c.title}</Text>
        <Text size="sm" c="dimmed">{c.studioName ?? c.clientName}</Text>
        <Text size="sm">{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text size="sm">{c.city}</Text>
        {booking.status === 'CONFIRMED' && (
          <Button variant="outline" color="red" size="xs" onClick={handleCancel} mt="xs">
            Cancel booking
          </Button>
        )}
      </Stack>
    </Card>
  )
}
