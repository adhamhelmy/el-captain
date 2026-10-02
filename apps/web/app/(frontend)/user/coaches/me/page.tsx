import { CoachCard } from '@/components/ui'
import { coachesOfUser, ME } from '@/lib/mock'

export default function MyCoachesPage() {
  return (
    <div className='page'>
      <div className='title'>MY COACHES</div>
      <div className='sub'>Coaches you’ve trained with before.</div>
      <div className='grid-cards'>
        {coachesOfUser(ME.user).map(c => (
          <CoachCard key={c.id} c={c} meta={`${c.count} session${c.count > 1 ? 's' : ''} together`} />
        ))}
      </div>
    </div>
  )
}
