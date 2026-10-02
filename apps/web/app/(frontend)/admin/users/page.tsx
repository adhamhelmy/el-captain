'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Person, Table, Tag } from '@/components/ui'
import { cap, sessionsOfUser, userSpent, users } from '@/lib/mock'

export default function AdminUsersPage() {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = users.filter(u => !needle || `${u.name} ${u.email}`.toLowerCase().includes(needle))

  return (
    <div className='page'>
      <div className='between' style={{ marginBottom: 24 }}>
        <div className='title'>USERS</div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder='Search by name or email…' className='search' style={{ flex: 'none', width: 300, maxWidth: '100%', minWidth: 0, fontSize: 14, padding: '12px 16px' }} />
      </div>
      <Table cols='minmax(0,2.2fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,1fr)' head={['User', 'Joined', 'Bookings', 'Spent', 'Status']}>
        {list.map(u => (
          <Link key={u.id} href={`/admin/users/${u.id}`} className='tr'>
            <Person initials={u.initials} name={u.name} sub={u.email} />
            <span className='muted'>{u.joined}</span>
            <span className='muted'>{sessionsOfUser(u.id).length}</span>
            <span className='muted'>${userSpent(u.id)}</span>
            <span><Tag kind={u.status}>{cap(u.status)}</Tag></span>
          </Link>
        ))}
        {list.length === 0 && <div className='empty' style={{ padding: 48 }}>No users match.</div>}
      </Table>
    </div>
  )
}
