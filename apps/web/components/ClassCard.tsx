import { Card, Text, Badge, Button, Group, Stack, Image } from '@mantine/core'
import Link from 'next/link'
import type { ClassDTO } from '@el-captain/types'

interface Props { class: ClassDTO }

export function ClassCard({ class: c }: Props) {
  const date = new Date(c.date)
  const spotsColor = c.spotsLeft === 0 ? 'red' : c.spotsLeft <= 3 ? 'orange' : 'green'
  const displayType = c.type.charAt(0).toUpperCase() + c.type.slice(1)

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      {c.imageUrl && (
        <Card.Section>
          <Image src={c.imageUrl} alt={c.title} height={140} fit="cover" />
        </Card.Section>
      )}
      <Stack gap="xs" mt={c.imageUrl ? 'md' : 0}>
        <Group justify="space-between">
          <Badge color="blue" variant="light">{displayType}</Badge>
          <Badge color={spotsColor} variant="light">
            {c.spotsLeft === 0 ? 'Full' : `${c.spotsLeft} spots left`}
          </Badge>
        </Group>
        <Text fw={600} size="lg">{c.title}</Text>
        <Text size="sm" c="dimmed">{c.studioName ?? c.clientName}</Text>
        <Text size="sm">{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text size="sm">{c.city} · {c.durationMinutes} min</Text>
        <Button component={Link} href={`/classes/${c.id}`} variant="light" fullWidth mt="xs">
          View class
        </Button>
      </Stack>
    </Card>
  )
}
