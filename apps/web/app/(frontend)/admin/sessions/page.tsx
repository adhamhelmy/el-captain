'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Segmented, Table, Tag } from '@/components/ui'
import { cap, coachName, fill, sessions, typeLabel, when } from '@/lib/mock'

export default function AdminSessionsPage() {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const list = sessions.filter(s => filter === 'all' || s.status === filter)

  return (
    <div className='page'>
      <div className='between' style={{ marginBottom: 24 }}>
        <div className='title'>SESSIONS</div>
        <Segmented options={[['Upcoming', 'upcoming'], ['Past', 'past'], ['All', 'all']]} value={filter} onChange={setFilter} />
      </div>
      <Table cols='minmax(0,2fr) minmax(0,1.2fr) minmax(0,1.5fr) minmax(0,0.7fr) minmax(0,0.6fr) minmax(0,0.9fr)' head={['Session', 'Coach', 'When', 'Booked', 'Price', 'Status']}>
        {list.map(s => (
          <Link key={s.id} href={`/admin/sessions/${s.id}`} className='tr'>
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>{s.title}</span>
              <span className='cell-sub'>{s.category} · {typeLabel(s)}</span>
            </span>
            <span className='muted'>{coachName(s)}</span>
            <span className='muted'>{when(s)}</span>
            <span className='muted'>{fill(s)}</span>
            <span style={{ fontWeight: 700 }}>${s.price}</span>
            <span><Tag kind={s.status}>{cap(s.status)}</Tag></span>
          </Link>
        ))}
      </Table>
    </div>
  )
}
