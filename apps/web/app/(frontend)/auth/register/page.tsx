'use client'
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Stack, Select, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()

  const form = useForm({
    initialValues: { name: '', email: '', password: '', confirmPassword: '', role: 'USER', studioName: '', city: '' },
    validate: {
      name: (v) => (v.length > 1 ? null : 'Required'),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length >= 8 ? null : 'Min 8 characters'),
      confirmPassword: (v, values) => (v === values.password ? null : 'Passwords do not match'),
      role: (v) => (v ? null : 'Select a role'),
      studioName: (v, values) => (values.role === 'CLIENT' && !v ? 'Required for studios' : null),
      city: (v, values) => (values.role === 'CLIENT' && !v ? 'Required for studios' : null),
    },
  })

  async function handleSubmit(values: typeof form.values) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json()
      notifications.show({ color: 'red', title: 'Error', message: data.error })
      return
    }

    await signIn('credentials', { redirect: false, email: values.email, password: values.password })
    router.push('/dashboard')
  }

  return (
    <Container size={420} mt={80}>
      <Title ta="center">Create an account</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Already have one?{' '}
        <Anchor component={Link} href="/auth/login">Sign in</Anchor>
      </Text>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Name" placeholder="Your name" {...form.getInputProps('name')} />
            <TextInput label="Email" placeholder="you@example.com" {...form.getInputProps('email')} />
            <PasswordInput label="Password" placeholder="Min 8 characters" {...form.getInputProps('password')} />
            <PasswordInput label="Confirm password" placeholder="Repeat your password" {...form.getInputProps('confirmPassword')} />
            <Select
              label="I am a..."
              data={[
                { value: 'USER', label: 'Looking for classes' },
                { value: 'CLIENT', label: 'Studio / gym owner' },
              ]}
              {...form.getInputProps('role')}
            />
            {form.values.role === 'CLIENT' && (
              <>
                <TextInput label="Studio Name" placeholder="Cairo Fitness" {...form.getInputProps('studioName')} />
                <TextInput label="City" placeholder="Cairo" {...form.getInputProps('city')} />
              </>
            )}
            <Button type="submit" fullWidth mt="xl">Create account</Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
