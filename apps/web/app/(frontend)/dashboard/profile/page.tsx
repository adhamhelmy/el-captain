'use client'
import { Container, Title, Stack, TextInput, Textarea, Button, Paper, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      studioName: '',
      studioDescription: '',
      city: '',
      website: '',
      instagram: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/clients/${session.user.id}`)
      .then(r => r.json())
      .then(data => {
        form.setValues({
          name: data.clientName ?? '',
          studioName: data.studioName ?? '',
          studioDescription: data.studioDescription ?? '',
          city: data.city ?? '',
          website: data.website ?? '',
          instagram: data.instagram ?? '',
          phone: data.phone ?? '',
        })
        setLoading(false)
      })
  }, [session])

  async function handleSubmit(values: typeof form.values) {
    if (!session?.user?.id) return
    setSaving(true)
    const res = await fetch(`/api/clients/${session.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSaving(false)
    if (!res.ok) {
      notifications.show({ color: 'red', title: 'Error', message: 'Failed to save profile' })
      return
    }
    notifications.show({ color: 'green', title: 'Saved', message: 'Profile updated successfully' })
  }

  if (loading) return <Text>Loading...</Text>

  return (
    <Stack gap="lg">
      <Title order={2}>Edit Profile</Title>
      <Paper withBorder p="md" radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Your name" {...form.getInputProps('name')} />
            <TextInput label="Studio name" placeholder="Cairo Fitness Studio" {...form.getInputProps('studioName')} />
            <Textarea label="Bio / Description" placeholder="Tell people about your studio..." autosize minRows={3} {...form.getInputProps('studioDescription')} />
            <TextInput label="City / Area" placeholder="Maadi, Cairo" {...form.getInputProps('city')} />
            <TextInput label="Website" placeholder="https://yourstudio.com" {...form.getInputProps('website')} />
            <TextInput label="Instagram" placeholder="@yourstudio" {...form.getInputProps('instagram')} />
            <TextInput label="Phone" placeholder="+20 100 000 0000" {...form.getInputProps('phone')} />
            <Button type="submit" loading={saving}>Save changes</Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}
