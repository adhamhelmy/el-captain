'use client'
import { Container, Title, Text, Stack, Group, Badge, Anchor, SimpleGrid, Divider, Avatar, Skeleton, Alert } from '@mantine/core'
import { useSession } from 'next-auth/react'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ClassCard } from '@/components/ClassCard'
import type { ClassDTO } from '@el-captain/types'

interface ClientProfile {
  id: string
  clientName: string
  studioName: string | null
  studioDescription: string | null
  city: string | null
  logoUrl: string | null
  website: string | null
  instagram: string | null
  phone: string | null
}

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ClientProfile | null | 'not_found'>(null)
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then(r => r.status === 404 ? 'not_found' : r.json())
      .then(setProfile)
    fetch(`/api/classes?clientId=${id}`)
      .then(r => r.json())
      .then(data => { setClasses(data); setLoadingClasses(false) })
  }, [id])

  const isOwner = session?.user?.id === id

  if (profile === null) {
    return (
      <Container size="lg" py="xl">
        <Stack gap="xl">
          <Group gap="lg">
            <Skeleton circle height={80} />
            <Stack gap={8}>
              <Skeleton height={28} width={200} />
              <Skeleton height={20} width={120} />
            </Stack>
          </Group>
          <Skeleton height={16} width="60%" />
          <Divider />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {[1,2,3].map(i => <Skeleton key={i} height={180} radius="md" />)}
          </SimpleGrid>
        </Stack>
      </Container>
    )
  }

  if (profile === 'not_found') {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" title="Studio not found">
          This studio profile doesn&apos;t exist or is no longer available.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group align="flex-start" justify="space-between">
          <Group gap="lg">
            <Avatar size={80} color="blue" radius="xl">
              {(profile.studioName ?? profile.clientName).charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={4}>
              <Title order={2}>{profile.studioName ?? profile.clientName}</Title>
              {profile.studioName && <Text c="dimmed">{profile.clientName}</Text>}
              {profile.city && <Badge variant="light">{profile.city}</Badge>}
            </Stack>
          </Group>
          {isOwner && (
            <Anchor component={Link} href="/dashboard/profile" fw={500}>
              Edit profile
            </Anchor>
          )}
        </Group>

        {profile.studioDescription ? (
          <Text>{profile.studioDescription}</Text>
        ) : isOwner ? (
          <Text c="dimmed" fs="italic">No description yet — <Anchor component={Link} href="/dashboard/profile">add one</Anchor>.</Text>
        ) : null}

        {(profile.website || profile.instagram || profile.phone) && (
          <Group gap="lg">
            {profile.website && (
              <Text size="sm">🌐{' '}
                <Anchor href={profile.website} target="_blank" rel="noopener noreferrer">
                  {profile.website.replace(/^https?:\/\//, '')}
                </Anchor>
              </Text>
            )}
            {profile.instagram && (
              <Text size="sm">📸 @{profile.instagram.replace(/^@/, '')}</Text>
            )}
            {profile.phone && (
              <Text size="sm">📞 {profile.phone}</Text>
            )}
          </Group>
        )}

        <Divider />

        <Stack gap="md">
          <Title order={3}>Upcoming Classes</Title>
          {loadingClasses ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {[1,2,3].map(i => <Skeleton key={i} height={180} radius="md" />)}
            </SimpleGrid>
          ) : classes.length === 0 ? (
            <Text c="dimmed">No upcoming classes.</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {classes.map(c => <ClassCard key={c.id} class={c} />)}
            </SimpleGrid>
          )}
        </Stack>
      </Stack>
    </Container>
  )
}
