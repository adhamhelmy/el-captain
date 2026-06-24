'use client'
import { Title, SimpleGrid, Text, Stack, Tabs, TabsList, TabsTab, TabsPanel, Skeleton } from '@mantine/core'
import { useEffect, useState } from 'react'
import { BookingCard } from '@/components/BookingCard'
import type { BookingDTO } from '@el-captain/types'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bookings').then(r => r.json()).then(data => { setBookings(data); setLoading(false) })
  }, [])

  function handleCancelled(id: string) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
  }

  const now = new Date()
  const upcoming = bookings.filter(b => new Date(b.class.date) >= now)
  const past = bookings.filter(b => new Date(b.class.date) < now)

  const SkeletonGrid = () => (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      {[1,2,3].map(i => <Skeleton key={i} height={160} radius="md" />)}
    </SimpleGrid>
  )

  return (
    <Stack gap="lg">
      <Title order={2}>My Bookings</Title>
      <Tabs defaultValue="upcoming">
        <TabsList mb="md">
          <TabsTab value="upcoming">Upcoming ({loading ? '…' : upcoming.length})</TabsTab>
          <TabsTab value="past">Past ({loading ? '…' : past.length})</TabsTab>
        </TabsList>

        <TabsPanel value="upcoming">
          {loading ? <SkeletonGrid /> : upcoming.length === 0 ? (
            <Text c="dimmed">No upcoming bookings. Browse classes to get started.</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {upcoming.map(b => <BookingCard key={b.id} booking={b} onCancelled={handleCancelled} />)}
            </SimpleGrid>
          )}
        </TabsPanel>

        <TabsPanel value="past">
          {loading ? <SkeletonGrid /> : past.length === 0 ? (
            <Text c="dimmed">No past bookings.</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {past.map(b => <BookingCard key={b.id} booking={b} onCancelled={handleCancelled} />)}
            </SimpleGrid>
          )}
        </TabsPanel>
      </Tabs>
    </Stack>
  )
}
