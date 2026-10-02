'use client'
import { Title, Stack, Text, Paper, Group, Badge, Button, Skeleton } from '@mantine/core'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'
import type { SessionRequestDTO } from '@el-captain/types'

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'yellow',
  ACCEPTED: 'green',
  DECLINED: 'red',
}

export default function SessionsPage() {
  const [requests, setRequests] = useState<SessionRequestDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sessions').then(r => r.json()).then(data => { setRequests(data); setLoading(false) })
  }, [])

  async function respond(id: string, status: 'ACCEPTED' | 'DECLINED') {
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated: SessionRequestDTO = await res.json()
      setRequests(prev => prev.map(r => r.id === id ? updated : r))
      notifications.show({ color: 'green', message: `Request ${status.toLowerCase()}` })
    }
  }

  if (loading) return (
    <Stack gap="md">
      <Title order={2}>Session Requests</Title>
      {[1,2,3].map(i => <Skeleton key={i} height={100} radius="md" />)}
    </Stack>
  )

  return (
    <Stack gap="md">
      <Title order={2}>Session Requests</Title>
      {requests.length === 0 ? (
        <Text c="dimmed">No session requests yet.</Text>
      ) : requests.map(r => (
        <Paper key={r.id} withBorder p="md" radius="md">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={600}>{r.userName}</Text>
              <Badge color={STATUS_COLOR[r.status]}>{r.status}</Badge>
            </Group>
            <Text size="sm" c="dimmed">{r.userEmail}</Text>
            <Text size="sm">{r.message}</Text>
            <Text size="xs" c="dimmed">{new Date(r.createdAt).toLocaleDateString()}</Text>
            {r.status === 'PENDING' && (
              <Group gap="sm" mt="xs">
                <Button size="xs" color="green" onClick={() => respond(r.id, 'ACCEPTED')}>Accept</Button>
                <Button size="xs" color="red" variant="light" onClick={() => respond(r.id, 'DECLINED')}>Decline</Button>
              </Group>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}
