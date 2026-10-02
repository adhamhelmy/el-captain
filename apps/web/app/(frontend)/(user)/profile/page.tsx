'use client'
import { Title, Stack, TextInput, Textarea, Button, Paper, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const isCoach = session?.user.role === 'COACH'

  const form = useForm({
    initialValues: {
      name: '',
      studioName: '',
      studioDescription: '',
      bio: '',
      specialties: '',
      city: '',
      website: '',
      instagram: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!session?.user?.id) return
    const endpoint = isCoach ? `/api/coaches/${session.user.id}` : `/api/clients/${session.user.id}`
    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        if (isCoach) {
          form.setValues({
            name: data.coachName ?? '',
            bio: data.bio ?? '',
            specialties: data.specialties ?? '',
            city: data.city ?? '',
            website: data.website ?? '',
            instagram: data.instagram ?? '',
            phone: data.phone ?? '',
            studioName: '',
            studioDescription: '',
          })
        } else {
          form.setValues({
            name: data.clientName ?? '',
            studioName: data.studioName ?? '',
            studioDescription: data.studioDescription ?? '',
            city: data.city ?? '',
            website: data.website ?? '',
            instagram: data.instagram ?? '',
            phone: data.phone ?? '',
            bio: '',
            specialties: '',
          })
        }
        setLoading(false)
      })
    // `form` is a new object every render; listing it would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isCoach])

  async function handleSubmit(values: typeof form.values) {
    if (!session?.user?.id) return
    setSaving(true)
    const endpoint = isCoach ? `/api/coaches/${session.user.id}` : `/api/clients/${session.user.id}`
    const res = await fetch(endpoint, {
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
            {isCoach ? (
              <>
                <Textarea label="Bio" placeholder="Tell people about yourself and your coaching style..." autosize minRows={3} {...form.getInputProps('bio')} />
                <TextInput label="Specialties" placeholder="Boxing, HIIT, Strength training..." {...form.getInputProps('specialties')} />
              </>
            ) : (
              <>
                <TextInput label="Studio name" placeholder="Cairo Fitness Studio" {...form.getInputProps('studioName')} />
                <Textarea label="Bio / Description" placeholder="Tell people about your studio..." autosize minRows={3} {...form.getInputProps('studioDescription')} />
              </>
            )}
            <TextInput label="City / Area" placeholder="Maadi, Cairo" {...form.getInputProps('city')} />
            <TextInput label="Website" placeholder="https://..." {...form.getInputProps('website')} />
            <TextInput label="Instagram" placeholder="@handle" {...form.getInputProps('instagram')} />
            <TextInput label="Phone" placeholder="+20 100 000 0000" {...form.getInputProps('phone')} />
            <Button type="submit" loading={saving}>Save changes</Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}
