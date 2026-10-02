import { CoachCard } from '@/components/ui'
import { coaches } from '@/lib/mock'

export default function CoachesPage() {
  return (
    <div className='page'>
      <div className='title'>COACHES</div>
      <div className='sub'>Find a coach that fits how you train.</div>
      <div className='grid-cards'>
        {coaches.filter(c => c.status === 'active').map(c => <CoachCard key={c.id} c={c} meta={`From $${c.rate}`} />)}
      </div>
    </div>
  )
}
