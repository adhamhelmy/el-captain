'use client'
import { Container, Title, Text, Button, Stack } from '@mantine/core'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Container size="sm" py={80} ta="center">
      <Stack align="center" gap="md">
        <Text size="80px" lh={1}>🏋️</Text>
        <Title order={1}>404 — Page not found</Title>
        <Text c="dimmed" size="lg">
          Looks like this page took a rest day.
        </Text>
        <Button component={Link} href="/" size="md" mt="md">
          Back to classes
        </Button>
      </Stack>
    </Container>
  )
}
