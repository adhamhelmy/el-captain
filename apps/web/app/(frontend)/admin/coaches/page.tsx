'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Person, Segmented, Table, Tag } from '@/components/ui'
import { cap, coaches, type CoachStatus } from '@/lib/mock'

export default function AdminCoachesPage() {
  const [filter, setFilter] = useState<'all' | CoachStatus>('all')
  const list = coaches.filter(c => filter === 'all' || c.status === filter)

  return (
    <div className='page'>
      <div className='between' style={{ marginBottom: 24 }}>
        <div className='title'>COACHES</div>
        <Segmented options={[['All', 'all'], ['Active', 'active'], ['Pending', 'pending'], ['Suspended', 'suspended']]} value={filter} onChange={setFilter} />
      </div>
      <Table cols='minmax(0,2.2fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,1fr)' head={['Coach', 'Rating', 'Clients', 'Revenue', 'Status']}>
        {list.map(c => (
          <Link key={c.id} href={`/admin/coaches/${c.id}`} className='tr'>
            <Person initials={c.initials} name={c.name} sub={`${c.specialty} · ${c.location}`} />
            <span className='muted'>{c.rating} ★</span>
            <span className='muted'>{c.clients}</span>
            <span className='muted'>${c.revenue}</span>
            <span><Tag kind={c.status}>{cap(c.status)}</Tag></span>
          </Link>
        ))}
      </Table>
    </div>
  )
}
