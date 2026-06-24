'use client'
import {
  Title, Stack, Button, Modal, Drawer, TextInput, Textarea, NumberInput,
  Select, Group, Table, TableThead, TableTbody, TableTr, TableTh, TableTd,
  Text, Badge, Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'
import { useSession } from 'next-auth/react'
import type { ClassDTO } from '@el-captain/types'

interface Attendee { bookingId: string; userId: string; name: string; email: string; bookedAt: string }

const CLASS_TYPES = ['Kickboxing','Yoga','Pilates','Crossfit','Spinning','Zumba','Boxing','Muay Thai','BJJ','MMA','Swimming','Dance','Stretching','Strength','HIIT','Barre','Aerial','Capoeira']

export default function ClientClassesPage() {
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [editTarget, setEditTarget] = useState<ClassDTO | null>(null)
  const [attendeesClass, setAttendeesClass] = useState<ClassDTO | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [attendeesOpened, { open: openAttendees, close: closeAttendees }] = useDisclosure(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/classes?clientId=${session.user.id}`).then(r => r.json()).then(setClasses)
    }
  }, [session])

  const createForm = useForm({
    initialValues: { title: '', type: '', description: '', date: '', durationMinutes: 60, city: '', address: '', capacity: 10, imageUrl: '' },
    validate: {
      title: (v) => (v ? null : 'Required'),
      type: (v) => (v ? null : 'Required'),
      date: (v) => (v ? null : 'Required'),
      city: (v) => (v ? null : 'Required'),
      address: (v) => (v ? null : 'Required'),
    },
  })

  const editForm = useForm({
    initialValues: { title: '', type: '', description: '', date: '', durationMinutes: 60, city: '', address: '', capacity: 10, imageUrl: '' },
  })

  async function handleCreate(values: typeof createForm.values) {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) { notifications.show({ color: 'red', title: 'Error', message: 'Failed to create class' }); return }
    const newClass = await res.json()
    setClasses(prev => [newClass, ...prev])
    createForm.reset()
    closeCreate()
    notifications.show({ color: 'green', title: 'Created', message: 'Class created successfully' })
  }

  function handleEditOpen(cls: ClassDTO) {
    setEditTarget(cls)
    editForm.setValues({
      title: cls.title,
      type: cls.type,
      description: cls.description ?? '',
      date: cls.date.slice(0, 16),
      durationMinutes: cls.durationMinutes,
      city: cls.city,
      address: cls.address,
      capacity: cls.capacity,
      imageUrl: cls.imageUrl ?? '',
    })
    openEdit()
  }

  async function handleEdit(values: typeof editForm.values) {
    if (!editTarget) return
    const res = await fetch(`/api/classes/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) { notifications.show({ color: 'red', title: 'Error', message: 'Failed to update class' }); return }
    const updated = await res.json()
    setClasses(prev => prev.map(c => c.id === updated.id ? updated : c))
    closeEdit()
    notifications.show({ color: 'green', title: 'Updated', message: 'Class updated' })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this class? This will also cancel all bookings.')) return
    const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setClasses(prev => prev.filter(c => c.id !== id))
    notifications.show({ color: 'green', title: 'Deleted', message: 'Class removed' })
  }

  async function handleViewAttendees(cls: ClassDTO) {
    setAttendeesClass(cls)
    const res = await fetch(`/api/classes/${cls.id}/attendees`)
    const data = await res.json()
    setAttendees(data)
    openAttendees()
  }

  const isPast = (date: string) => new Date(date) < new Date()

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>My Classes</Title>
        <Button onClick={openCreate}>+ New Class</Button>
      </Group>

      {classes.length === 0 ? (
        <Text c="dimmed">No classes yet. Create your first class.</Text>
      ) : (
        <Table>
          <TableThead>
            <TableTr>
              <TableTh>Title</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Date</TableTh>
              <TableTh>City</TableTh>
              <TableTh>Spots</TableTh>
              <TableTh>Actions</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {classes.map(c => (
              <TableTr key={c.id} opacity={isPast(c.date) ? 0.5 : 1}>
                <TableTd>
                  {c.title}
                  {isPast(c.date) && <Badge ml="xs" size="xs" color="gray">Past</Badge>}
                </TableTd>
                <TableTd>{c.type}</TableTd>
                <TableTd>{new Date(c.date).toLocaleDateString()}</TableTd>
                <TableTd>{c.city}</TableTd>
                <TableTd>{c.spotsLeft}/{c.capacity}</TableTd>
                <TableTd>
                  <Group gap="xs">
                    <Tooltip label="View attendees">
                      <Button size="xs" variant="light" onClick={() => handleViewAttendees(c)}>
                        👥 {c.capacity - c.spotsLeft}
                      </Button>
                    </Tooltip>
                    <Button size="xs" variant="light" onClick={() => handleEditOpen(c)}>Edit</Button>
                    <Button size="xs" color="red" variant="subtle" onClick={() => handleDelete(c.id)}>Delete</Button>
                  </Group>
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      )}

      {/* Create modal */}
      <Modal opened={createOpened} onClose={closeCreate} title="Create New Class" size="lg">
        <form onSubmit={createForm.onSubmit(handleCreate)}>
          <Stack>
            <TextInput label="Title" placeholder="Morning Kickboxing" {...createForm.getInputProps('title')} />
            <Select label="Type" searchable data={CLASS_TYPES} {...createForm.getInputProps('type')} />
            <Textarea label="Description" placeholder="Optional description" {...createForm.getInputProps('description')} />
            <TextInput label="Date & Time" type="datetime-local" {...createForm.getInputProps('date')} />
            <NumberInput label="Duration (minutes)" min={15} step={15} {...createForm.getInputProps('durationMinutes')} />
            <TextInput label="City" placeholder="Cairo" {...createForm.getInputProps('city')} />
            <TextInput label="Address" placeholder="10 Tahrir Square" {...createForm.getInputProps('address')} />
            <NumberInput label="Capacity" min={1} {...createForm.getInputProps('capacity')} />
            <TextInput label="Image URL (optional)" placeholder="https://..." {...createForm.getInputProps('imageUrl')} />
            <Button type="submit" fullWidth>Create Class</Button>
          </Stack>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Class" size="lg">
        <form onSubmit={editForm.onSubmit(handleEdit)}>
          <Stack>
            <TextInput label="Title" {...editForm.getInputProps('title')} />
            <Select label="Type" searchable data={CLASS_TYPES} {...editForm.getInputProps('type')} />
            <Textarea label="Description" autosize minRows={2} {...editForm.getInputProps('description')} />
            <TextInput label="Date & Time" type="datetime-local" {...editForm.getInputProps('date')} />
            <NumberInput label="Duration (minutes)" min={15} step={15} {...editForm.getInputProps('durationMinutes')} />
            <TextInput label="City" {...editForm.getInputProps('city')} />
            <TextInput label="Address" {...editForm.getInputProps('address')} />
            <NumberInput label="Capacity" min={1} {...editForm.getInputProps('capacity')} />
            <TextInput label="Image URL (optional)" {...editForm.getInputProps('imageUrl')} />
            <Button type="submit" fullWidth>Save changes</Button>
          </Stack>
        </form>
      </Modal>

      {/* Attendees drawer */}
      <Drawer opened={attendeesOpened} onClose={closeAttendees} title={`Attendees — ${attendeesClass?.title}`} position="right" size="md">
        {attendees.length === 0 ? (
          <Text c="dimmed" mt="md">No confirmed bookings yet.</Text>
        ) : (
          <Stack mt="md" gap="xs">
            <Text size="sm" c="dimmed">{attendees.length} confirmed attendee{attendees.length !== 1 ? 's' : ''}</Text>
            <Table>
              <TableThead>
                <TableTr>
                  <TableTh>Name</TableTh>
                  <TableTh>Email</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {attendees.map(a => (
                  <TableTr key={a.bookingId}>
                    <TableTd>{a.name}</TableTd>
                    <TableTd>{a.email}</TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </Stack>
        )}
      </Drawer>
    </Stack>
  )
}
