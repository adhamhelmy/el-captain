import Link from 'next/link'
import { SectionHead, SessionCard, Stats } from '@/components/ui'
import { coachName, coachesOfUser, ME, sessions, sessionsOfUser, user, when } from '@/lib/mock'

export default function UserDashboard() {
  const me = user(ME.user)!
  const mine = sessionsOfUser(me.id)
  const upcoming = mine.filter(s => s.status === 'upcoming')
  const next = upcoming[0]
  const picked = sessions.filter(s => s.status === 'upcoming' && !mine.includes(s)).slice(0, 3)

  return (
    <div className='page stack' style={{ gap: 36 }}>
      <div>
        <div className='muted' style={{ fontSize: 14 }}>Welcome back</div>
        <div className='title'>LET&apos;S GO, {me.name.split(' ')[0].toUpperCase()}</div>
      </div>
      {next && (
        <Link href={`/user/sessions/${next.id}`} className='btn' style={{ borderRadius: 18, padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', textAlign: 'left', whiteSpace: 'normal' }}>
          <div>
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>Your next session</div>
            <div className='display' style={{ fontSize: 52, lineHeight: 1, marginTop: 10, letterSpacing: 0 }}>{next.title}</div>
            <div style={{ fontSize: 15, marginTop: 8, fontWeight: 400 }}>{coachName(next)} · {when(next)}</div>
          </div>
          <div style={{ fontSize: 15 }}>View details →</div>
        </Link>
      )}
      <Stats items={[
        [upcoming.length, 'Upcoming sessions'],
        [mine.length - upcoming.length, 'Sessions completed'],
        [coachesOfUser(me.id).length, 'Coaches trained with'],
      ]} />
      <div>
        <SectionHead title='PICKED FOR YOU' href='/user/sessions' link='Browse all →' />
        <div className='grid-cards'>
          {picked.map(s => <SessionCard key={s.id} s={s} href={`/user/sessions/${s.id}`} />)}
        </div>
      </div>
    </div>
  )
}
