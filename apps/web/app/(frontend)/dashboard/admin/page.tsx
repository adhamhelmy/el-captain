'use client'
import { Title, Stack, Tabs, TabsList, TabsTab, TabsPanel, Table, TableThead, TableTbody, TableTr, TableTh, TableTd, Badge, Select, Button } from '@mantine/core'
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
        <TabsList>
          <TabsTab value="users">Users ({users.length})</TabsTab>
          <TabsTab value="classes">Classes ({classes.length})</TabsTab>
        </TabsList>

        <TabsPanel value="users" pt="md">
          <Table>
            <TableThead>
              <TableTr>
                <TableTh>Name</TableTh>
                <TableTh>Email</TableTh>
                <TableTh>Role</TableTh>
                <TableTh>Joined</TableTh>
                <TableTh>Action</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {users.map(u => (
                <TableTr key={u.id}>
                  <TableTd>{u.name}</TableTd>
                  <TableTd>{u.email}</TableTd>
                  <TableTd><Badge variant="light">{u.role}</Badge></TableTd>
                  <TableTd>{new Date(u.createdAt).toLocaleDateString()}</TableTd>
                  <TableTd>
                    <Select
                      size="xs"
                      value={u.role}
                      data={['ADMIN', 'CLIENT', 'USER']}
                      onChange={(role) => role && handleRoleChange(u.id, role)}
                      w={100}
                    />
                  </TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </TabsPanel>

        <TabsPanel value="classes" pt="md">
          <Table>
            <TableThead>
              <TableTr>
                <TableTh>Title</TableTh>
                <TableTh>Type</TableTh>
                <TableTh>Studio</TableTh>
                <TableTh>City</TableTh>
                <TableTh>Date</TableTh>
                <TableTh>Spots</TableTh>
                <TableTh></TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {classes.map(c => (
                <TableTr key={c.id}>
                  <TableTd>{c.title}</TableTd>
                  <TableTd><Badge variant="light" color="blue">{c.type}</Badge></TableTd>
                  <TableTd>{c.studioName ?? c.clientName}</TableTd>
                  <TableTd>{c.city}</TableTd>
                  <TableTd>{new Date(c.date).toLocaleDateString()}</TableTd>
                  <TableTd>{c.spotsLeft}/{c.capacity}</TableTd>
                  <TableTd>
                    <Button size="xs" color="red" variant="subtle" onClick={() => handleDeleteClass(c.id)}>
                      Delete
                    </Button>
                  </TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </TabsPanel>
      </Tabs>
    </Stack>
  )
}
