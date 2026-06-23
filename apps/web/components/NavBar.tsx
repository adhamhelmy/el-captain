'use client'
import { Group, Button, Text, Container } from '@mantine/core'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export function NavBar() {
  const { data: session } = useSession()

  return (
    <Container size="lg" py="sm">
      <Group justify="space-between">
        <Text fw={700} size="xl" component={Link} href="/" style={{ textDecoration: 'none' }}>
          El Captain
        </Text>
        <Group>
          {session ? (
            <>
              <Button variant="subtle" component={Link} href="/dashboard">Dashboard</Button>
              <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</Button>
            </>
          ) : (
            <>
              <Button variant="subtle" component={Link} href="/auth/login">Login</Button>
              <Button component={Link} href="/auth/register">Sign up</Button>
            </>
          )}
        </Group>
      </Group>
    </Container>
  )
}
