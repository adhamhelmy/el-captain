'use client'
import { useState } from 'react'
import { Chips, SessionCard, Tag } from '@/components/ui'
import { categories, ME, sessions } from '@/lib/mock'

export default function AllSessionsPage() {
  const [cat, setCat] = useState('All')
  const list = sessions.filter(s => s.status === 'upcoming' && (cat === 'All' || s.category === cat))

  return (
    <div className='page'>
      <div className='title'>ALL SESSIONS</div>
      <div className='sub' style={{ marginBottom: 24 }}>What’s on across El Captain this week.</div>
      <div style={{ marginBottom: 24 }}>
        <Chips options={categories} value={cat} onChange={setCat} />
      </div>
      <div className='grid-cards'>
        {list.map(s => (
          <SessionCard key={s.id} s={s} href={`/coach/sessions/${s.id}`} spots badge={s.coachId === ME.coach ? <Tag kind='mine'>Yours</Tag> : undefined} />
        ))}
      </div>
    </div>
  )
}
