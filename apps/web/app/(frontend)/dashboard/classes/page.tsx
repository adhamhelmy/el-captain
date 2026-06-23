'use client'
import { Title, Stack, Button, Modal, TextInput, Textarea, NumberInput, Select, Group, Table, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'
import { useSession } from 'next-auth/react'
import type { ClassDTO } from '@el-captain/types'

export default function ClientClassesPage() {
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [opened, { open, close }] = useDisclosure(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/classes?clientId=${session.user.id}`).then(r => r.json()).then(setClasses)
    }
  }, [session])

  const form = useForm({
    initialValues: {
      title: '', type: '', description: '', date: '',
      durationMinutes: 60, city: '', address: '', capacity: 10, imageUrl: '',
    },
    validate: {
      title: (v) => (v ? null : 'Required'),
      type: (v) => (v ? null : 'Required'),
      date: (v) => (v ? null : 'Required'),
      city: (v) => (v ? null : 'Required'),
      address: (v) => (v ? null : 'Required'),
    },
  })

  async function handleCreate(values: typeof form.values) {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      notifications.show({ color: 'red', title: 'Error', message: 'Failed to create class' })
      return
    }
    const newClass = await res.json()
    setClasses(prev => [newClass, ...prev])
    form.reset()
    close()
    notifications.show({ color: 'green', title: 'Created', message: 'Class created successfully' })
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setClasses(prev => prev.filter(c => c.id !== id))
    notifications.show({ color: 'green', title: 'Deleted', message: 'Class removed' })
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>My Classes</Title>
        <Button onClick={open}>+ New Class</Button>
      </Group>

      {classes.length === 0 ? (
        <Text c="dimmed">No classes yet. Create your first class.</Text>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>City</Table.Th>
              <Table.Th>Spots</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {classes.map(c => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.title}</Table.Td>
                <Table.Td>{c.type}</Table.Td>
                <Table.Td>{new Date(c.date).toLocaleDateString()}</Table.Td>
                <Table.Td>{c.city}</Table.Td>
                <Table.Td>{c.spotsLeft}/{c.capacity}</Table.Td>
                <Table.Td>
                  <Button size="xs" color="red" variant="subtle" onClick={() => handleDelete(c.id)}>
                    Delete
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={opened} onClose={close} title="Create New Class" size="lg">
        <form onSubmit={form.onSubmit(handleCreate)}>
          <Stack>
            <TextInput label="Title" placeholder="Morning Kickboxing" {...form.getInputProps('title')} />
            <Select label="Type" data={['kickboxing', 'yoga', 'pilates', 'crossfit', 'spinning', 'zumba']} {...form.getInputProps('type')} />
            <Textarea label="Description" placeholder="Optional description" {...form.getInputProps('description')} />
            <TextInput label="Date & Time" type="datetime-local" {...form.getInputProps('date')} />
            <NumberInput label="Duration (minutes)" min={15} step={15} {...form.getInputProps('durationMinutes')} />
            <TextInput label="City" placeholder="Cairo" {...form.getInputProps('city')} />
            <TextInput label="Address" placeholder="10 Tahrir Square" {...form.getInputProps('address')} />
            <NumberInput label="Capacity" min={1} {...form.getInputProps('capacity')} />
            <TextInput label="Image URL (optional)" placeholder="https://..." {...form.getInputProps('imageUrl')} />
            <Button type="submit" fullWidth>Create Class</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
