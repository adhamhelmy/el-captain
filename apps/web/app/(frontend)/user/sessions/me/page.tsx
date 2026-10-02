'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Segmented, TypeTag } from '@/components/ui'
import { coachName, ME, sessionsOfUser, when } from '@/lib/mock'

export default function MySessionsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const list = sessionsOfUser(ME.user).filter(s => s.status === tab)

  return (
    <div className='page' style={{ maxWidth: 960 }}>
      <div className='title' style={{ marginBottom: 24 }}>MY SESSIONS</div>
      <div style={{ marginBottom: 24 }}>
        <Segmented options={[['Upcoming', 'upcoming'], ['Past', 'past']]} value={tab} onChange={setTab} />
      </div>
      <div className='stack' style={{ gap: 10 }}>
        {list.map(s => (
          <div key={s.id} className='row'>
            <Link href={`/user/sessions/${s.id}`} className='plain' style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <TypeTag s={s} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</div>
                <div className='muted' style={{ fontSize: 13 }}>{coachName(s)} · {when(s)}</div>
              </div>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className='display' style={{ fontSize: 22, letterSpacing: 0 }}>${s.price}</span>
              {tab === 'upcoming'
                ? <Link href={`/user/sessions/${s.id}`} className='btn-ghost sm plain'>Details</Link>
                : <Link href={`/user/coaches/${s.coachId}`} className='btn-ghost sm plain'>Book again</Link>}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className='empty'>Nothing here yet. <Link href='/user/sessions'>Browse sessions</Link></div>}
      </div>
    </div>
  )
}
