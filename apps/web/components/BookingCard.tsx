'use client'
import { Card, Text, Badge, Button, Group, Stack, Modal, Anchor } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'
import type { BookingDTO } from '@el-captain/types'

interface Props {
  booking: BookingDTO
  onCancelled: (id: string) => void
}

export function BookingCard({ booking, onCancelled }: Props) {
  const c = booking.class
  const date = new Date(c.date)
  const isPast = date < new Date()
  const [confirmOpen, { open, close }] = useDisclosure(false)
  const [loading, { open: startLoading, close: stopLoading }] = useDisclosure(false)

  async function handleCancel() {
    startLoading()
    const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'PATCH' })
    stopLoading()
    close()
    if (!res.ok) {
      notifications.show({ color: 'red', title: 'Error', message: 'Could not cancel booking' })
      return
    }
    notifications.show({ color: 'green', title: 'Cancelled', message: 'Your booking has been cancelled' })
    onCancelled(booking.id)
  }

  return (
    <>
      <Card shadow="sm" padding="lg" radius="md" withBorder opacity={isPast ? 0.7 : 1}>
        <Stack gap="xs">
          <Group justify="space-between">
            <Badge color="blue" variant="light">{c.type}</Badge>
            <Group gap="xs">
              {isPast && <Badge color="gray" variant="light">Past</Badge>}
              <Badge color={booking.status === 'CONFIRMED' ? 'green' : 'gray'} variant="light">
                {booking.status}
              </Badge>
            </Group>
          </Group>

          <Anchor component={Link} href={`/classes/${c.id}`} fw={600} size="lg" underline="hover" c="inherit">
            {c.title}
          </Anchor>
          <Anchor component={Link} href={`/clients/${c.clientId}`} size="sm" c="dimmed" underline="hover">
            {c.studioName ?? c.clientName}
          </Anchor>
          <Text size="sm">{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          <Text size="sm">{c.city}</Text>

          {booking.status === 'CONFIRMED' && !isPast && (
            <Button variant="outline" color="red" size="xs" onClick={open} mt="xs">
              Cancel booking
            </Button>
          )}
          {booking.status === 'CANCELLED' && !isPast && (
            <Button variant="light" size="xs" component={Link} href={`/classes/${c.id}`} mt="xs">
              Book again
            </Button>
          )}
        </Stack>
      </Card>

      <Modal opened={confirmOpen} onClose={close} title="Cancel booking?" centered size="sm">
        <Stack gap="md">
          <Text size="sm">Are you sure you want to cancel your booking for <strong>{c.title}</strong>?</Text>
          <Text size="sm" c="dimmed">You can re-book later if spots are still available.</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={close}>Keep booking</Button>
            <Button color="red" onClick={handleCancel} loading={loading}>Yes, cancel</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
