'use client'
import { Container, Title, Text, SimpleGrid, Stack, Skeleton, Button, Center } from '@mantine/core'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ClassCard } from '@/components/ClassCard'
import { ClassSearch } from '@/components/ClassSearch'
import type { ClassDTO, SearchParams } from '@el-captain/types'

const PAGE_SIZE = 9

export default function HomePage() {
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const paramsRef = useRef<SearchParams>({})

  const buildQuery = (params: SearchParams, offset = 0) => {
    const query = new URLSearchParams()
    if (params.types?.length) params.types.forEach(t => query.append('type', t))
    if (params.date) query.set('date', params.date)
    if (params.city) query.set('city', params.city)
    if (params.q) query.set('q', params.q)
    query.set('limit', String(PAGE_SIZE))
    query.set('offset', String(offset))
    return query
  }

  const fetchClasses = useCallback(async (params: SearchParams = {}) => {
    paramsRef.current = params
    setLoading(true)
    const res = await fetch(`/api/classes?${buildQuery(params)}`)
    const data = await res.json()
    setClasses(data)
    setHasMore(data.length === PAGE_SIZE)
    setLoading(false)
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    const res = await fetch(`/api/classes?${buildQuery(paramsRef.current, classes.length)}`)
    const data = await res.json()
    setClasses(prev => [...prev, ...data])
    setHasMore(data.length === PAGE_SIZE)
    setLoadingMore(false)
  }

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
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <Skeleton key={i} height={200} radius="md" />)}
          </SimpleGrid>
        ) : classes.length === 0 ? (
          <Text c="dimmed">No classes found. Try different filters.</Text>
        ) : (
          <Stack gap="xl">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {classes.map(c => <ClassCard key={c.id} class={c} />)}
            </SimpleGrid>
            {hasMore && (
              <Center>
                <Button variant="light" onClick={loadMore} loading={loadingMore}>
                  Load more
                </Button>
              </Center>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
