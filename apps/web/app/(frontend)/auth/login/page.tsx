'use client'
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Stack, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') ?? '/dashboard'
  const redirect = rawRedirect.startsWith('/') ? rawRedirect : '/dashboard'

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length >= 6 ? null : 'Min 6 characters'),
    },
  })

  async function handleSubmit(values: typeof form.values) {
    const result = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
    })

    if (result?.error) {
      notifications.show({ color: 'red', title: 'Error', message: 'Invalid email or password' })
      return
    }
    router.push(redirect)
  }

  return (
    <Container size={420} mt={80}>
      <Title ta="center">Welcome back</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Don&apos;t have an account?{' '}
        <Anchor component={Link} href="/auth/register">Sign up</Anchor>
      </Text>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Email" placeholder="you@example.com" {...form.getInputProps('email')} />
            <PasswordInput label="Password" placeholder="Your password" {...form.getInputProps('password')} />
            <Button type="submit" fullWidth mt="xl">Sign in</Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
