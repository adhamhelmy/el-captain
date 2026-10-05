import { useTranslations } from 'next-intl'
import { CoachCard } from '@/components/ui'
import { coaches } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'

export default function CoachesPage() {
  const t = useTranslations('userCoaches')
  const x = useSessionText()
  return (
    <div className='page'>
      <div className='title'>{t('title')}</div>
      <div className='sub'>{t('sub')}</div>
      <div className='grid-cards'>
        {coaches.filter(c => c.status === 'active').map(c => <CoachCard key={c.id} c={c} meta={t('from_', { price: x.price(c.rate) })} />)}
      </div>
    </div>
  )
}
