'use client'
import { Title, SimpleGrid, Text, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { BookingCard } from '@/components/BookingCard'
import type { BookingDTO } from '@el-captain/types'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDTO[]>([])

  useEffect(() => {
    fetch('/api/bookings').then(r => r.json()).then(setBookings)
  }, [])

  function handleCancelled(id: string) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
  }

  return (
    <Stack gap="lg">
      <Title order={2}>My Bookings</Title>
      {bookings.length === 0 ? (
        <Text c="dimmed">No bookings yet. Browse classes to get started.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {bookings.map(b => <BookingCard key={b.id} booking={b} onCancelled={handleCancelled} />)}
        </SimpleGrid>
      )}
    </Stack>
  )
}
