import Link from 'next/link'
import { Person, Table } from '@/components/ui'
import { clientsOfCoach, ME } from '@/lib/mock'

export default function MyClientsPage() {
  return (
    <div className='page' style={{ maxWidth: 1000 }}>
      <div className='title'>MY CLIENTS</div>
      <div className='sub' style={{ marginBottom: 24 }}>Everyone who has booked a session with you.</div>
      <Table cols='minmax(0,2fr) minmax(0,1fr) minmax(0,1fr)' head={['Client', 'Sessions', 'Last visit']}>
        {clientsOfCoach(ME.coach).map(c => (
          <Link key={c.id} href={`/coach/users/${c.id}`} className='tr'>
            <Person initials={c.initials} name={c.name} sub={c.email} />
            <span className='muted'>{c.count}</span>
            <span className='muted'>{c.last}</span>
          </Link>
        ))}
      </Table>
    </div>
  )
}
