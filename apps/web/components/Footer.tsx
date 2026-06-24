'use client'
import { Container, Group, Text, Anchor, Divider } from '@mantine/core'
import Link from 'next/link'

export function Footer() {
  return (
    <>
      <Divider mt="xl" />
      <Container size="lg" py="md">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">© {new Date().getFullYear()} El Captain. All rights reserved.</Text>
          <Group gap="md">
            <Anchor component={Link} href="/" size="sm" c="dimmed">Browse classes</Anchor>
            <Anchor component={Link} href="/auth/register" size="sm" c="dimmed">List your studio</Anchor>
          </Group>
        </Group>
      </Container>
    </>
  )
}
