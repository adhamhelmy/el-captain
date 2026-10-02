import Link from 'next/link'
import { Avatar, SectionHead, Stats } from '@/components/ui'
import { clientsOfCoach, coach, fill, ME, sessionsOfCoach, when } from '@/lib/mock'

export default function CoachDashboard() {
  const me = coach(ME.coach)!
  const nextUp = sessionsOfCoach(me.id).filter(s => s.status === 'upcoming').slice(0, 3)
  const recent = clientsOfCoach(me.id).slice(0, 3)

  return (
    <div className='page stack' style={{ gap: 36 }}>
      <div className='between'>
        <div>
          <div className='muted' style={{ fontSize: 14 }}>Welcome back</div>
          <div className='title'>{me.name.split(' ')[0].toUpperCase()}&apos;S DASHBOARD</div>
        </div>
        <Link href='/coach/sessions/me?add=1' className='btn'>+ Add session</Link>
      </div>
      {/* Mock until wired up: real weekly stats from the API */}
      <Stats items={[['47', 'Bookings this week'], ['$1,860', 'Revenue this week'], ['4.9', 'Average rating'], ['82%', 'Fill rate']]} />
      <div className='grid-2' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div>
          <SectionHead title='COMING UP' href='/coach/sessions/me' link='Schedule →' />
          <div className='stack' style={{ gap: 10 }}>
            {nextUp.map(s => (
              <Link key={s.id} href={`/coach/sessions/${s.id}`} className='row' style={{ flexWrap: 'nowrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</div>
                  <div className='muted' style={{ fontSize: 13 }}>{when(s)}</div>
                </div>
                <span className='muted' style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{fill(s)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionHead title='RECENT CLIENTS' href='/coach/users/me' link='All clients →' />
          <div className='stack' style={{ gap: 10 }}>
            {recent.map(c => (
              <Link key={c.id} href={`/coach/users/${c.id}`} className='row' style={{ justifyContent: 'flex-start', gap: 12, padding: '14px 18px' }}>
                <Avatar initials={c.initials} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div className='muted' style={{ fontSize: 12 }}>{c.count} sessions with you</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
