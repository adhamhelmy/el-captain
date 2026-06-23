'use client'
import { Container, Title, Text, SimpleGrid, Stack } from '@mantine/core'
import { useState, useEffect, useCallback } from 'react'
import { ClassCard } from '@/components/ClassCard'
import { ClassSearch } from '@/components/ClassSearch'
import type { ClassDTO, SearchParams } from '@el-captain/types'

export default function HomePage() {
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClasses = useCallback(async (params: SearchParams = {}) => {
    setLoading(true)
    const query = new URLSearchParams()
    if (params.type) query.set('type', params.type)
    if (params.date) query.set('date', params.date)
    if (params.city) query.set('city', params.city)

    const res = await fetch(`/api/classes?${query}`)
    const data = await res.json()
    setClasses(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title>Find your next class</Title>
          <Text c="dimmed">Discover kickboxing, yoga, pilates, and more near you.</Text>
        </Stack>
        <ClassSearch onSearch={fetchClasses} />
        {loading ? (
          <Text c="dimmed">Loading classes...</Text>
        ) : classes.length === 0 ? (
          <Text c="dimmed">No classes found. Try different filters.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {classes.map(c => <ClassCard key={c.id} class={c} />)}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  )
}
