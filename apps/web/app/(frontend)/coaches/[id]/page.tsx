'use client'
import { use, useEffect, useState } from 'react'
import { Container, Title, Text, Stack, Avatar, Group, Anchor, Badge, Button, Textarea, Modal, Alert } from '@mantine/core'
import { useSession } from 'next-auth/react'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'
import { ClassCard } from '@/components/ClassCard'
import type { CoachProfileDTO, ClassDTO } from '@el-captain/types'

export default function CoachProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [coach, setCoach] = useState<CoachProfileDTO | null | 'not_found'>('not_found')
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [opened, { open, close }] = useDisclosure(false)

  useEffect(() => {
    fetch(`/api/coaches/${id}`).then(r => r.ok ? r.json() : 'not_found').then(setCoach)
    fetch(`/api/classes?clientId=${id}`).then(r => r.json()).then(setClasses)
  }, [id])

  async function sendRequest() {
    if (!message.trim()) return
    setSending(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachId: id, message }),
    })
    setSending(false)
    if (res.ok) {
      notifications.show({ color: 'green', message: 'Session request sent!' })
      setMessage('')
      close()
    } else {
      const data = await res.json()
      notifications.show({ color: 'red', message: data.error })
    }
  }

  if (coach === 'not_found') return (
    <Container size="sm" py="xl">
      <Alert color="red">Coach not found.</Alert>
    </Container>
  )

  if (!coach) return null

  const isOwner = session?.user.id === id
  const canRequest = session?.user.role === 'USER'

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group align="flex-start">
          <Avatar src={coach.photoUrl} size={80} radius="xl" color="blue">
            {coach.coachName?.[0]}
          </Avatar>
          <Stack gap={4} style={{ flex: 1 }}>
            <Title order={2}>{coach.coachName}</Title>
            {coach.city && <Text c="dimmed">{coach.city}</Text>}
            {coach.specialties && <Badge variant="light">{coach.specialties}</Badge>}
            <Group gap="sm" mt={4}>
              {coach.instagram && <Anchor href={`https://instagram.com/${coach.instagram.replace('@','')}`} target="_blank" size="sm">Instagram</Anchor>}
              {coach.website && <Anchor href={coach.website} target="_blank" size="sm">Website</Anchor>}
              {coach.phone && <Text size="sm">{coach.phone}</Text>}
            </Group>
          </Stack>
          {isOwner && (
            <Button variant="light" component={Link} href="/dashboard/profile">Edit profile</Button>
          )}
          {canRequest && (
            <Button onClick={open}>Request private session</Button>
          )}
        </Group>

        {coach.bio && <Text>{coach.bio}</Text>}

        {classes.length > 0 && (
          <Stack gap="md">
            <Title order={3}>Classes</Title>
            <Stack gap="sm">
              {classes.map(c => <ClassCard key={c.id} class={c} />)}
            </Stack>
          </Stack>
        )}
      </Stack>

      <Modal opened={opened} onClose={close} title="Request a private session">
        <Stack gap="md">
          <Text size="sm" c="dimmed">Tell {coach.coachName} what you&apos;re looking for — your goals, availability, or any questions.</Text>
          <Textarea
            placeholder="I'm looking to improve my boxing technique..."
            minRows={4}
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
          />
          <Button onClick={sendRequest} loading={sending} disabled={!message.trim()}>Send request</Button>
        </Stack>
      </Modal>
    </Container>
  )
}
