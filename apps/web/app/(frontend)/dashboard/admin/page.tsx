'use client'
import { Title, Stack, Tabs, Table, Badge, Text, Select, Button } from '@mantine/core'
import { useEffect, useState } from 'react'
import { notifications } from '@mantine/notifications'
import type { ClassDTO } from '@el-captain/types'

interface AdminUser {
  id: string; name: string; email: string; role: string; createdAt: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [classes, setClasses] = useState<ClassDTO[]>([])

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(setUsers)
    fetch('/api/admin/classes').then(r => r.json()).then(setClasses)
  }, [])

  async function handleRoleChange(userId: string, role: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    if (!res.ok) {
      notifications.show({ color: 'red', title: 'Error', message: 'Failed to update role' })
      return
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    notifications.show({ color: 'green', title: 'Updated', message: 'User role changed' })
  }

  async function handleDeleteClass(id: string) {
    const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      notifications.show({ color: 'red', title: 'Error', message: 'Failed to delete class' })
      return
    }
    setClasses(prev => prev.filter(c => c.id !== id))
    notifications.show({ color: 'green', title: 'Deleted', message: 'Class removed' })
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Admin Dashboard</Title>
      <Tabs defaultValue="users">
        <Tabs.List>
          <Tabs.Tab value="users">Users ({users.length})</Tabs.Tab>
          <Tabs.Tab value="classes">Classes ({classes.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users" pt="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Joined</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map(u => (
                <Table.Tr key={u.id}>
                  <Table.Td>{u.name}</Table.Td>
                  <Table.Td>{u.email}</Table.Td>
                  <Table.Td><Badge variant="light">{u.role}</Badge></Table.Td>
                  <Table.Td>{new Date(u.createdAt).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      value={u.role}
                      data={['ADMIN', 'CLIENT', 'USER']}
                      onChange={(role) => role && handleRoleChange(u.id, role)}
                      w={100}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="classes" pt="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Studio</Table.Th>
                <Table.Th>City</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Spots</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {classes.map(c => (
                <Table.Tr key={c.id}>
                  <Table.Td>{c.title}</Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{c.type}</Badge></Table.Td>
                  <Table.Td>{c.studioName ?? c.clientName}</Table.Td>
                  <Table.Td>{c.city}</Table.Td>
                  <Table.Td>{new Date(c.date).toLocaleDateString()}</Table.Td>
                  <Table.Td>{c.spotsLeft}/{c.capacity}</Table.Td>
                  <Table.Td>
                    <Button size="xs" color="red" variant="subtle" onClick={() => handleDeleteClass(c.id)}>
                      Delete
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
