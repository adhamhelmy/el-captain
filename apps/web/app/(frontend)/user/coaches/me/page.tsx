import { useTranslations } from 'next-intl'
import { CoachCard } from '@/components/ui'
import { coachesOfUser, ME } from '@/lib/mock'

export default function MyCoachesPage() {
  const t = useTranslations('userCoaches')
  return (
    <div className='page'>
      <div className='title'>{t('mineTitle')}</div>
      <div className='sub'>{t('mineSub')}</div>
      <div className='grid-cards'>
        {coachesOfUser(ME.user).map(c => (
          <CoachCard key={c.id} c={c} meta={t('together', { count: c.count })} />
        ))}
      </div>
    </div>
  )
}
